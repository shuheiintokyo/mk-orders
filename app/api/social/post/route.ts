import { NextResponse } from "next/server";
import { currentRole } from "../../../../lib/auth";
import { bufferChannels, bufferPost, cardUrl, dailyItem, postsFor, xPostsToday } from "../../../../lib/social";

// Daily social post. Vercel Cron calls this every morning (see vercel.json) with the CRON_SECRET.
// Admin can open /api/social/post?dry=1 while logged in to preview today's texts without posting.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERVICES = { twitter: "x", threads: "threads", instagram: "instagram" } as const;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const isCron = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!isCron && (await currentRole()) !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 401 });

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  try {
    const item = await dailyItem();
    if (!item) return NextResponse.json({ ok: true, skipped: "No News Watch items from the last 2 days" });
    const posts = postsFor(item);
    const image = cardUrl(item);
    if (dry || process.env.SOCIAL_PAUSED === "1" || !process.env.BUFFER_API_KEY) {
      const why = dry ? "preview" : process.env.SOCIAL_PAUSED === "1" ? "SOCIAL_PAUSED is 1" : "BUFFER_API_KEY is not set";
      return NextResponse.json({ ok: true, posted: false, why, xToday: xPostsToday(), item, posts, image });
    }

    // X only on its days (Buffer free plan: 3 X posts a week); Threads and Instagram every day.
    const xDay = xPostsToday();
    const channels = (await bufferChannels()).filter((c) => c.service in SERVICES && (c.service !== "twitter" || xDay));
    const results = await Promise.all(
      channels.map(async (c) => {
        const key = SERVICES[c.service as keyof typeof SERVICES];
        try {
          const id = await bufferPost(c, posts[key], key === "instagram" ? image : undefined);
          return { channel: c.service, name: c.name, ok: true, id };
        } catch (e) {
          return { channel: c.service, name: c.name, ok: false, error: (e as Error).message };
        }
      }),
    );
    const ok = results.length > 0 && results.every((r) => r.ok);
    if (!ok) console.error("social post", JSON.stringify(results));
    return NextResponse.json({ ok, posted: true, results, item, posts, image }, { status: ok ? 200 : 502 });
  } catch (e) {
    console.error("social post", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
