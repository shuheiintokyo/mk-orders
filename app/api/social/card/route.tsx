import { ImageResponse } from "next/og";
import sharp from "sharp";
import { dailyItem, type DailyItem } from "../../../../lib/social";
import { getSubPage } from "../../../../lib/news";
import { parseItem, topicOf } from "../../../../lib/social-text";

// Bright social palette (matches the profile images); CSS variables do not work in images.
// News card image for Instagram: 1080×1350 JPEG (Instagram only accepts JPEG).
// /api/social/card            → today's item
// /api/social/card?d=…&s=…&i=… → item i of that date's section on subject page s (stable URL for Buffer)
export const runtime = "nodejs";
export const revalidate = 1800;

async function itemFor(d: string | null, s: string | null, n: number): Promise<DailyItem | null> {
  if (!d || !s) return dailyItem();
  const page = await getSubPage(s);
  if (!page) return null;
  const i = page.blocks.findIndex((b) => b.type === "heading_2" && b.data.rich_text.map((t: { plain_text: string }) => t.plain_text).join("").includes(d));
  if (i < 0) return null;
  const end = page.blocks.findIndex((b, j) => j > i && (b.type === "heading_1" || b.type === "heading_2"));
  const items = page.blocks.slice(i + 1, end < 0 ? undefined : end).filter((b) => b.type === "bulleted_list_item");
  const pick = items[n] ?? items[0];
  if (!pick) return null;
  return { date: d, index: n, subject: { title: page.title, icon: page.icon, slug: page.slug, url: "" }, ...parseItem(pick.data.rich_text) };
}

// Noto Sans JP from Google Fonts, cut down to the characters on the card.
async function font(text: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error("font not found");
  return (await fetch(url)).arrayBuffer();
}

const clip = (s: string, n: number) => ([...s].length > n ? [...s].slice(0, n - 1).join("") + "…" : s);

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const item = await itemFor(q.get("d"), q.get("s"), Number(q.get("i")) || 0).catch(() => null);
  if (!item) return new Response("No news item", { status: 404 });

  const t = topicOf(item.subject.title);
  const summary = clip(item.summary || item.headline, 110);
  const headline = item.headline && item.headline !== summary ? clip(item.headline, 120) : "";
  const label = `今日の${t.ja}ニュース`;
  const labelEn = `Today's ${t.en} news`;
  const foot = "mkproductionlab.com";
  const all = label + labelEn + summary + headline + item.source + item.date + foot + "MK Production" + "出典 / Source" + "おはようございます！";
  const [regular, bold] = await Promise.all([font(all, 400), font(all, 700)]);

  // Bright brand: sunny orange → coral → berry gradient, cream paper, ink text (same palette as the profile images).
  const grad = "linear-gradient(120deg, #FFC23D 0%, #FF8A3D 32%, #FF5C7A 66%, #C04BD8 100%)";
  const bar = (color: string, width: number) => <div style={{ height: 18, width, borderRadius: 9, background: color }} />;
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFF8EE", color: "#2A2140", fontFamily: "Noto Sans JP" }}>
        <div style={{ display: "flex", flexDirection: "column", background: grad, color: "#fff", padding: "64px 80px 56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, background: "#fff", color: "#FF5C7A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>MK</div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>MK Production</div>
          </div>
          <div style={{ marginTop: 44, fontSize: 52, fontWeight: 700, display: "flex" }}>{label}</div>
          <div style={{ marginTop: 6, fontSize: 30, display: "flex", opacity: 0.95 }}>{`${labelEn} · ${item.date}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "64px 80px 0", flexGrow: 1 }}>
          <div style={{ fontSize: 56, lineHeight: 1.5, fontWeight: 700, display: "flex" }}>{summary}</div>
          {headline ? (
            <div style={{ marginTop: 40, display: "flex", background: "#fff", borderRadius: 24, padding: "28px 32px", borderLeft: "10px solid #38BDF8", fontSize: 32, lineHeight: 1.45, color: "#4B3F66" }}>{headline}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 80px 72px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10 }}>{bar("#FFC23D", 120)}{bar("#38BDF8", 80)}{bar("#34D399", 50)}</div>
            <div style={{ display: "flex", fontSize: 26, color: "#7A6F8F", marginTop: 8 }}>{item.source ? `出典 / Source: ${clip(item.source, 30)}` : ""}</div>
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#FF5C7A" }}>{foot}</div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Noto Sans JP", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90 }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
