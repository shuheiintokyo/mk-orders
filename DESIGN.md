# MK Production design system

All tokens live in `app/globals.css` under `:root`, with a dark mode override. Use tokens, never raw hex values.

## Tokens
| Group | Tokens | Notes |
|---|---|---|
| Neutrals | `--bg --surface --surface-2 --ink --ink-2 --muted --line --line-strong` | Warm paper and ink |
| Brand | `--brand` (deep ink), `--accent` (resin amber), `--accent-soft`, `--focus` | Accent is for money and attention: unpaid totals, the quote panel and notes |
| Status | `--st-<status>` and `--st-<status>-bg` | Estimate grey, Agreed amber, Printing blue, Finished violet, Shipped green |
| Type | `--fs-xs 12`, `--fs-sm 13`, `--fs-md 15`, `--fs-lg 17`, `--fs-xl 22`, `--fs-2xl 30`; weights 400, 500 and 650 | Use tabular numbers for yen amounts |
| Spacing | `--sp-1 … --sp-10` | 4px grid |
| Shape | `--r-sm 6`, `--r-md 10`, `--r-lg 14`, `--r-pill`; `--shadow-1`, `--shadow-2` | |
| Motion | `--dur 140ms`, `--ease` | Turned off when the device asks for reduced motion |

## Components
- **Button** `.btn`: variants `primary` (one per view), `accent`, `success` (Kobe "ship" step), `ghost`; sizes `sm` and `lg` (Kobe full-width actions, 56px tall).
- **Status pill** `<StatusPill>` with `.pill.s-<Status>`: a dot plus a tinted label. Any element can take `.s-<Status>` to get the `--c` and `--bgc` colours.
- **Segmented filter** `.seg`: status filter with counts.
- **Stepper** `.stepper` / `.step`: status picker on the order page; earlier steps show as done.
- **Field** `.field` with an inline `.hint`. Inputs are 40px tall (48px on the Kobe page) and show a focus ring.
- **Card** `.card` and `.card.flush` (for tables); `.kcard` is the Kobe card with a status-coloured top bar.
- **Feedback**: `.alert` for errors, `.skeleton` while loading, `.empty` for empty lists.

## Rules
- Keep the Kobe page simple: one main action per card, large touch targets, Japanese labels.
- Admin pages are in English. Money is shown as `¥1,234`.
