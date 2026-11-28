"""Step 1 of the render: make the narration, a soft music bed and the subtitle files.

Voices come from Kokoro (open model, Apache-2.0 licence, runs free on your own
computer). Music is generated from scratch by music.py (calm study style, ducks under the voice).

Usage: python3 voice.py <episode folder>
Writes into <episode folder>/out/: voice.wav, music.wav, timings.json, ja.srt, en.srt
"""
import json, math, os, sys, urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
from music import music_track

SR = 24000
GAP_LINE = 0.35    # pause between two lines in the same scene (seconds)
GAP_SCENE = 0.9    # pause when the scene changes
LEAD_IN = 0.6      # silence before the first line
TAIL = 2.5         # silence after the last line (end card stays up)

MODEL_DIR = Path(__file__).resolve().parent.parent / ".models"
MODEL_FILES = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}


def get_models():
    MODEL_DIR.mkdir(exist_ok=True)
    for name, url in MODEL_FILES.items():
        p = MODEL_DIR / name
        if not p.exists():
            print("downloading", name, "(one time, ~350 MB total)")
            urllib.request.urlretrieve(url, p)
    from kokoro_onnx import Kokoro
    return Kokoro(str(MODEL_DIR / "kokoro-v1.0.onnx"), str(MODEL_DIR / "voices-v1.0.bin"))


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main(ep_dir):
    ep_dir = Path(ep_dir)
    ep = json.loads((ep_dir / "episode.json").read_text())
    out = ep_dir / "out"
    out.mkdir(exist_ok=True)
    kokoro = get_models()

    audio = [np.zeros(int(LEAD_IN * SR), np.float32)]
    t = LEAD_IN
    scenes, ja, en, n = [], [], [], 0
    for si, scene in enumerate(ep["scenes"]):
        if si > 0:
            audio.append(np.zeros(int(GAP_SCENE * SR), np.float32))
            t += GAP_SCENE
        s_start = t - (GAP_SCENE / 2 if si > 0 else LEAD_IN)
        lines = []
        for li, line in enumerate(scene["lines"]):
            if li > 0:
                audio.append(np.zeros(int(GAP_LINE * SR), np.float32))
                t += GAP_LINE
            spk = ep["speakers"][line["sp"]]
            samples, sr = kokoro.create(line["en"], voice=spk["voice"], speed=spk.get("speed", 1.0), lang="en-us")
            assert sr == SR
            samples = samples.astype(np.float32)
            dur = len(samples) / SR
            audio.append(samples)
            lines.append({"start": round(t, 3), "end": round(t + dur, 3), "sp": line["sp"]})
            n += 1
            ja.append(f"{n}\n{srt_time(t)} --> {srt_time(t + dur)}\n{line['ja']}\n")
            en.append(f"{n}\n{srt_time(t)} --> {srt_time(t + dur)}\n{line['en']}\n")
            t += dur
            print(f"  scene {si+1} line {li+1}: {dur:.1f}s")
        scenes.append({"start": round(s_start, 3), "lines": lines})
    audio.append(np.zeros(int(TAIL * SR), np.float32))
    total = t + TAIL
    for i, s in enumerate(scenes):
        s["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else round(total, 3)

    voice = np.concatenate(audio)
    sf.write(out / "voice.wav", voice, SR)
    timings = {"total": round(total, 3), "scenes": scenes}
    sf.write(out / "music.wav", music_track(len(voice) / SR, timings, [s["kind"] for s in ep["scenes"]], SR, level_db=-33), SR)
    (out / "timings.json").write_text(json.dumps(timings, indent=1))
    (out / "ja.srt").write_text("\n".join(ja), encoding="utf-8")
    (out / "en.srt").write_text("\n".join(en), encoding="utf-8")
    print(f"total {total:.1f}s ({total/60:.1f} min)")


if __name__ == "__main__":
    main(sys.argv[1])
