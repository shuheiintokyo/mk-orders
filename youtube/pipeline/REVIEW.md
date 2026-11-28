# Second-perspective review (do this as a separate pass, before rendering)

Read the script as a different person each time and fix what fails.

1. **Fact checker** — every claim traced to a source? Single-source news hedged? Dates,
   names, numbers correct? Nothing presented as existing that is only an idea?
2. **Beginner (high-school level)** — every technical word explained the first time?
   Could someone repeat the main idea after watching? One analogy, not three?
3. **Japanese reader** — subtitles natural, ≤ 60 characters, same meaning as the English?
   Terms written the way Japanese tech media write them (e.g. プロンプトインジェクション)?
4. **Rights check** — no outside images, logos, clips, music or quoted article text?
   Company names only as plain text? End card says voices are synthetic?
5. **Fairness** — no hype, no attacks on a company, both sides of an open question?
   No financial, medical or legal advice?
6. **Viewer** — does the first 20 seconds raise a question worth staying for?
   Does each section end with a reason to keep watching? Under 5 minutes?

Write a short note per point into `review.notes` in episode.json, and set
`review.status` to "ready for Shuhei" when everything passes.
