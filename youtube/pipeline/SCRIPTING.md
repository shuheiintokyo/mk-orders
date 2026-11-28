# Writing an episode (for Claude)

## Pick the topic
- Read the last 7 days of the News Watch subject pages in Notion
  (Generative AI dev, AI × design engineering, 3D printing & materials, Weekly roundups).
- Choose a story that (a) several outlets covered, (b) teaches an idea that will
  still be true in a year, and (c) fits one of the five pillars:
  Code & AI tools · Servers & networks · Platforms & services · Generative AI in practice · Design & real printing.
- Skip stock prices, funding, gossip, health/legal/financial advice.
- Don't repeat last week's pillar.

## Structure (10 scenes, 500–650 words, 3–5 min)
1. `headline` — the news + the puzzle (Mia states it, Ken reacts, ends on a question)
2. `title` — "Welcome to Behind the Headlines…" one line
3. background / the problem
4. one analogy, drawn (`analogy` or `matrix`)
5. how it works (`flow`, max 4 nodes + 3 items)
6. back to the news: answer the puzzle (`switches` or `cards`)
7. for makers: design, printing, small shop ("could", unless it exists)
8. what's next: 2–3 things to watch (`cards`, numbered)
9. recap: 3 takeaways (`cards`, numbered)
10. `end` — next episode teaser

## Lines
- Mia (A) explains; Ken (B) asks what a viewer would ask. Ken's question opens each section.
- One or two sentences per line, under ~25 words. Spoken English, contractions, no jargon
  without a plain explanation right after it.
- `ja` is a natural Japanese subtitle, not word-for-word. Max ~60 characters (2 rows).
- Hedge single-source news: "there was a report", "most likely".
- No reading out articles. Our own words only.

## On-screen text
- Heading in English + `heading_ja`. Short labels (1–4 words). Max 3 cards per screen.
- Only icons from `ICON` in template.html; add new icons by drawing simple SVG paths.

## Next-episode promise
- The `end` scene teases the next episode. The next weekly run must make that episode
  (check the previous episode's `end.next`), unless the facts changed; then say so in the hook.
- Planned: ep002 "Why AI tools have usage limits" (teased in ep001).
