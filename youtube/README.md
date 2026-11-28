# Behind the Update: YouTube pipeline

Short explainer videos (3–5 min) for the MK Production Lab YouTube channel.
English narration (two synthetic voices), Japanese subtitles burned in, every
visual drawn by our own template. Policy, series rules and schedule live in Notion:
"MK Production YouTube: content policy, series and pipeline" (Documents database).

This folder is not part of the website. `.vercelignore` keeps it out of deploys.

## Make an episode

1. **Pick and script** (Claude): follow `pipeline/SCRIPTING.md`, write
   `episodes/epNNN-slug/episode.json` (copy ep001 as a starting point).
2. **Review** (Claude, separate pass): follow `pipeline/REVIEW.md`, fix the script,
   write notes into `review` in episode.json.
3. **Render** (any computer with Python 3, Node, ffmpeg):

   ```bash
   pip install kokoro-onnx soundfile numpy
   cd youtube && npm i --no-save playwright && npx playwright install chromium && cd ..   # one time
   # fonts are included: Noto Sans JP (SIL Open Font License) in pipeline/fonts
   cd youtube
   python3 pipeline/voice.py episodes/ep001-mcp     # voice, music, subtitles (~1 min)
   node pipeline/render.js episodes/ep001-mcp       # frames → MP4 (~10 min)
   ```

   The first run downloads the Kokoro voice model (~350 MB, Apache-2.0) into `.models/`.
4. **Outputs** in `episodes/<ep>/out/`: `video.mp4`, `thumbnail.png`, `en.srt`
   (upload as English captions), `ja.srt` (Japanese text, already in the picture).
5. **Shuhei approves**, then uploads (description must name the sources and say
   "Voices are synthetic").

## Scene types (template.html)

`headline`, `title`, `matrix` (many-to-many → hub), `analogy` (plug and socket),
`flow` (nodes + 3 items), `switches` (allowed / not allowed), `cards` (2–3 cards,
optional numbers and footer), `end`. Elements appear when the line with the matching
`at` index starts, so the picture follows the voice. Icons are drawn in `ICON`.
