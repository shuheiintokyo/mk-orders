"""Calm 'study' background music, made from scratch (no samples, nobody else's recordings).

Design rules (so the music never fights the narration):
- slow tempo (76 BPM), soft electric-piano chords, round sub bass, a very soft kick; no hi-hats or noise
- music is filtered to stay out of the speech band (above ~2.5 kHz is rolled off, 1-4 kHz dipped)
- it ducks (gets quieter) while someone is speaking, and comes back up in the pauses
- each section of the video gets its own chord loop, so it changes with the content
- the hook and end card have no drums: just chords

Used by voice.py: music_track(total_seconds, timings, sr)
"""
import math
import numpy as np

BPM = 76
BEAT = 60 / BPM
BAR = 4 * BEAT

# Chord loops (MIDI note numbers, 4 bars each). Mellow jazz voicings in F major / D minor.
LOOPS = {
    "warm":   [[53, 57, 60, 64, 67], [52, 55, 59, 62, 65], [50, 53, 57, 60, 64], [48, 52, 55, 59, 62]],  # Fmaj9 Em7 Dm9 Cmaj9
    "curious":[[50, 53, 57, 60, 64], [55, 59, 62, 65, 69], [48, 52, 55, 59, 62], [53, 57, 60, 64, 67]],  # Dm9 G13 Cmaj9 Fmaj9
    "open":   [[46, 50, 53, 57, 60], [48, 52, 55, 58, 62], [53, 57, 60, 64, 67], [50, 53, 57, 60, 65]],  # Bbmaj7 C9 Fmaj9 Dm11
}
SCENE_MOOD = {"headline": "curious", "title": "warm", "matrix": "curious", "analogy": "warm", "flow": "open",
              "switches": "curious", "cards": "warm", "end": "warm"}
NO_DRUMS = {"headline", "title", "end"}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def epiano(f, dur, sr, vel=1.0):
    """Soft Rhodes-like note: a sine with a little FM 'tine' that fades quickly."""
    t = np.arange(int(dur * sr)) / sr
    env = np.exp(-t / 1.6) * np.clip(t / 0.008, 0, 1)
    tine = 1.6 * np.exp(-t / 0.25)
    x = np.sin(2 * math.pi * f * t + tine * np.sin(2 * math.pi * f * t))
    x += 0.25 * np.sin(2 * math.pi * 2 * f * t) * np.exp(-t / 0.6)
    return vel * env * x


def bass(f, dur, sr):
    t = np.arange(int(dur * sr)) / sr
    env = np.clip(t / 0.03, 0, 1) * np.exp(-t / 1.2)
    return env * (np.sin(2 * math.pi * f * t) + 0.15 * np.sin(2 * math.pi * 2 * f * t))


def kick(sr):
    t = np.arange(int(0.35 * sr)) / sr
    f = 48 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * math.pi * np.cumsum(f) / sr) * np.exp(-t / 0.12)


def add(buf, x, at, sr):
    i = int(at * sr)
    if i >= len(buf):
        return
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n]


def spectral_shape(x, sr):
    """Roll off above 2.5 kHz and dip the 1-4 kHz speech band, so voices stay clear."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / sr)
    lp = 1 / np.sqrt(1 + (f / 2500) ** 4)
    dip = 1 - 0.4 * np.exp(-((np.log2(np.maximum(f, 1) / 2000)) ** 2) / 0.8)
    hp = 1 / np.sqrt(1 + (40 / np.maximum(f, 1)) ** 4)   # remove rumble under 40 Hz
    return np.fft.irfft(X * lp * dip * hp, n=len(x))


def reverb(x, sr, seconds=1.8, mix=0.25):
    rng = np.random.default_rng(7)
    t = np.arange(int(seconds * sr)) / sr
    ir = rng.standard_normal(len(t)) * np.exp(-t / (seconds / 5))
    ir[0] = 0
    n = len(x) + len(ir)
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
    wet *= np.abs(x).max() / (np.abs(wet).max() + 1e-9)
    return (1 - mix) * x + mix * wet


def duck_curve(total, timings, sr, depth_db=-8, attack=0.15, release=0.5):
    """1.0 in pauses, lower while a line is being spoken; smooth in and out."""
    n = int(total * sr)
    speak = np.zeros(n, np.float32)
    for s in timings["scenes"]:
        for l in s["lines"]:
            speak[int(l["start"] * sr):int(l["end"] * sr)] = 1
    # smooth with attack/release (one-pole, run on a 100 Hz control rate for speed)
    step = sr // 100
    ctrl = speak[::step]
    out = np.zeros_like(ctrl)
    g = 0.0
    for i, v in enumerate(ctrl):
        k = 1 / (attack * 100) if v > g else 1 / (release * 100)
        g += (v - g) * min(1, k)
        out[i] = g
    curve = np.interp(np.arange(n), np.arange(len(out)) * step, out)
    return 10 ** (depth_db * curve / 20)


def music_track(total, timings, scene_kinds, sr, level_db=-24):
    n = int(total * sr)
    keys = np.zeros(n)
    low = np.zeros(n)
    drums = np.zeros(n)
    k = kick(sr)
    rng = np.random.default_rng(3)
    for si, s in enumerate(timings["scenes"]):
        kind = scene_kinds[si]
        loop = LOOPS[SCENE_MOOD.get(kind, "warm")]
        start, end = s["start"], s["end"]
        # snap section start to the beat grid so the rhythm never stumbles
        b0 = math.ceil(start / BEAT) * BEAT
        bar = 0
        t = b0
        while t < end:
            chord = loop[bar % 4]
            # chords: beat 1 (full) and the "and" of beat 3 (softer, upper notes only)
            for j, m in enumerate(chord):
                add(keys, epiano(hz(m), 3.0, sr, 0.22) , t + j * 0.012 + rng.uniform(0, 0.006), sr)
            for m in chord[2:]:
                add(keys, epiano(hz(m), 2.0, sr, 0.10), t + 2.5 * BEAT + rng.uniform(0, 0.01), sr)
            add(low, 0.55 * bass(hz(chord[0] - 12), BEAT * 2, sr), t, sr)
            add(low, 0.40 * bass(hz(chord[0] - 12), BEAT * 1.5, sr), t + 2 * BEAT, sr)
            if kind not in NO_DRUMS:
                for beat in (0, 2):
                    add(drums, 0.35 * k, t + beat * BEAT, sr)
            t += BAR
            bar += 1
    mix = reverb(keys, sr) + low + drums
    mix = spectral_shape(mix, sr)
    mix *= duck_curve(total, timings, sr)
    # gentle fades at the very start and end
    f = int(2.5 * sr)
    mix[:f] *= np.linspace(0, 1, f)
    mix[-f:] *= np.linspace(1, 0, f)
    rms = np.sqrt(np.mean(mix ** 2)) + 1e-9
    mix *= 10 ** (level_db / 20) / rms
    return mix.astype(np.float32)
