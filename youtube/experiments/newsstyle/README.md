# News-show style test (not part of the episode pipeline yet)

Two 36-second samples of a broadcast-news format: headline promo, sting, two anchors
at a desk, lower thirds, OTS graphic box, full-screen graphic, ticker, wide close.
Everything is drawn in code; voices are Kokoro, music is generated.

- `studio.html`: Sample A, 3D virtual studio (Three.js). Needs `npm i --no-save three`.
- `studio2d.html`: Sample B, 2D illustrated studio (SVG, camera = zoom/pan).
- `script.json`: the test lines (speaker, shot, English, Japanese).

```bash
cp -r ../../pipeline/fonts/. fonts/   # or link the Noto Sans JP files as r/b/k.ttf
python3 voice.py                      # out/voice.wav, music.wav, timeline.json
python3 -m http.server 8765 --bind 127.0.0.1 &
node rend.js studio2d.html out/b.mp4 30   # or stills
python3 mux.py out/b.mp4 out/b_final.mp4
```
