# MK Orders

Public website and admin web app for MK Production. Orders live in the Notion database **MK Orders**; this app reads and writes them.

- `/` public front page, read from the Notion page **MK Production · News Watch** (no login)
- `/news/<subject>` one news subject page per child page linked on the hub (no login). Grey callouts and toggles in Notion are treated as internal and never shown. Pages re-read Notion at most every 30 minutes.
- `/orders` order list with status tabs, unpaid total and files-to-delete count (admin)
- `/order` create or edit an order, with the live suggested quote
- `/kobe` mobile to do list for Kobe (Japanese), one button per step
- Two passwords: `ADMIN_PASSWORD` (everything) and `KOBE_PASSWORD` (Kobe page only, no customer or price data)

Quote = resin ml × yen per ml (default 10) × 1.2 + minutes ÷ 60 × Hyogo minimum wage + shipping, rounded up to 100 yen.
Update `HYOGO_MIN_WAGE` in `lib/pricing.js` every October.

## Setup

1. Notion: go to notion.so/profile/integrations, create an **internal** integration (read, update, insert content), copy its secret.
   Open the MK Orders database, `•••` > Connections > add the integration.
   Do the same on the **MK Production · News Watch** page so the public site can read it (its subpages follow).
2. Vercel project `mk-orders` is linked to this repo; every push to `main` deploys.
   `NOTION_DATA_SOURCE_ID` and `SESSION_SECRET` are already set. Add `NOTION_TOKEN`, `ADMIN_PASSWORD`
   and `KOBE_PASSWORD` in Vercel > mk-orders > Settings > Environment Variables, then redeploy.
3. Open https://mk-orders.vercel.app and log in.

## Local development

```
cp .env.example .env.local   # fill in values
npm install
npm run dev
npm test                     # pricing tests
```
