# MK Orders

Admin web app for MK Production. Orders live in the Notion database **MK Orders**; this app reads and writes them.

- `/` order list with status tabs, unpaid total and files-to-delete count (admin)
- `/order` create or edit an order, with the live suggested quote
- `/kobe` mobile to do list for Kobe (Japanese), one button per step
- Two passwords: `ADMIN_PASSWORD` (everything) and `KOBE_PASSWORD` (Kobe page only, no customer or price data)

Quote = resin ml × yen per ml (default 10) × 1.2 + minutes ÷ 60 × Hyogo minimum wage + shipping, rounded up to 100 yen.
Update `HYOGO_MIN_WAGE` in `lib/pricing.js` every October.

## Setup

1. Notion: go to notion.so/profile/integrations, create an **internal** integration (read, update, insert content), copy its secret.
   Open the MK Orders database, `•••` > Connections > add the integration.
2. Vercel: import this repo, then add the environment variables from `.env.example`.
3. Open the site and log in.

## Local development

```
cp .env.example .env.local   # fill in values
npm install
npm run dev
npm test                     # pricing tests
```
