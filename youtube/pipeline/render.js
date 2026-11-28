// Step 2 of the render: draw every frame from template.html, then add voice + music.
// Usage: node render.js <episode folder> [fps=30] [workers=4]
// Needs: out/timings.json and out/voice.wav from voice.py, ffmpeg, Playwright (Chromium).
// Writes out/video.mp4 (1920x1080, Japanese subtitles burned in) and out/thumbnail.png.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const epDir = path.resolve(process.argv[2]);
const fps = Number(process.argv[3] || 30);
const workers = Number(process.argv[4] || 4);
const out = path.join(epDir, 'out');
const ep = JSON.parse(fs.readFileSync(path.join(epDir, 'episode.json'), 'utf8'));
const tm = JSON.parse(fs.readFileSync(path.join(out, 'timings.json'), 'utf8'));
const tpl = path.join(__dirname, 'template.html');
for (const f of ['r.ttf', 'b.ttf', 'k.ttf'])
  if (!fs.existsSync(path.join(__dirname, 'fonts', f))) { console.error('Missing font pipeline/fonts/' + f + ' (see README)'); process.exit(1); }

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + tpl);
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(([e, t]) => init(e, t), [ep, tm]);
  return p;
}

async function segment(browser, i, from, to) {
  const p = await page(browser);
  const file = path.join(out, `seg${i}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', file], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = from; f < to; f++) {
    await p.evaluate(t => render(t), f / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i === 0 && f % (fps * 10) === 0) console.log(`  ${Math.round(100 * (f - from) / (to - from))}% of first part`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  return file;
}

(async () => {
  const started = Date.now();
  const browser = await chromium.launch();
  // thumbnail: the title card, without subtitles
  const tp = await page(browser);
  const ti = ep.scenes.findIndex(s => s.kind === 'title');
  await tp.evaluate(t => { render(t); document.getElementById('sub').style.display = 'none'; }, tm.scenes[ti].end - 0.6);
  await tp.screenshot({ path: path.join(out, 'thumbnail.png') });
  await tp.close();

  const frames = Math.ceil(tm.total * fps), per = Math.ceil(frames / workers);
  const segs = await Promise.all([...Array(workers)].map((_, i) => segment(browser, i, i * per, Math.min(frames, (i + 1) * per))));
  await browser.close();
  fs.writeFileSync(path.join(out, 'segs.txt'), segs.map(s => `file '${s}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(out, 'segs.txt'),
    '-i', path.join(out, 'voice.wav'), '-i', path.join(out, 'music.wav'),
    '-filter_complex', '[1:a]volume=1.0[v];[2:a]volume=1.0[m];[v][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest',
    path.join(out, 'video.mp4')]);
  segs.forEach(s => fs.unlinkSync(s)); fs.unlinkSync(path.join(out, 'segs.txt'));
  console.log(`done: ${path.join(out, 'video.mp4')} in ${Math.round((Date.now() - started) / 1000)}s`);
})();
