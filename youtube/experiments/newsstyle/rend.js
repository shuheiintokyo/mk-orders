const {chromium}=require('playwright'); const {spawn}=require('child_process'); const fs=require('fs');
const [,,page,out,fpsA,from,to]=process.argv; const fps=Number(fpsA||30);
const tl=JSON.parse(fs.readFileSync(__dirname+'/out/timeline.json'));
(async()=>{
 const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('pageerror',e=>console.log('ERR',e.message)); p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
 await p.goto('http://127.0.0.1:8765/'+page); await p.waitForFunction(()=>window.ready===true); await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(t=>init(t),tl);
 if(out==='stills'){ const ts=tl.lines.map(l=>(l.start+l.end)/2); for(let i=0;i<ts.length;i++){await p.evaluate(t=>render(t),ts[i]); await p.screenshot({path:`out/still${i}.jpg`,type:'jpeg'});} await b.close(); return; }
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','19',out],{stdio:['pipe','ignore','inherit']});
 const F0=Number(from||0), F1=Number(to||Math.ceil(tl.total*fps));
 for(let f=F0;f<F1;f++){ await p.evaluate(t=>render(t),f/fps); const buf=await p.screenshot({type:'jpeg',quality:92}); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
 ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close();
})();
