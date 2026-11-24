import "server-only";
import { getHub, getSubPage, plain, type Block } from "./news";
import { buildPosts, isLatin, parseItem, pickIndex } from "./social-text";

// Daily social posts: pick one item from last night's News Watch, build the texts,
// and send them through Buffer (free plan: X, Threads and Instagram as 3 channels).

export const SITE = (process.env.SITE_URL ?? "https://mkproductionlab.com").replace(/\/$/, "");
const BUFFER = process.env.BUFFER_API_URL ?? "https://api.buffer.com";

export type DailyItem = {
  date: string; // YYYY-MM-DD of the News Watch section
  index: number; // position of the item in that section
  subject: { title: string; icon: string; slug: string; url: string };
  headline: string;
  summary: string;
  source: string;
  url: string;
};

/** Days of the week (0 = Sunday, Japan time) when X gets a post. Buffer's free plan allows X
 *  3 posts a week, so the default is Monday, Wednesday and Friday. Set SOCIAL_X_DAYS to change it. */
export function xPostsToday(now = new Date()) {
  const days = (process.env.SOCIAL_X_DAYS ?? "1,3,5").split(",").map((d) => Number(d.trim()));
  return days.includes(new Date(now.getTime() + 9 * 3600_000).getUTCDay());
}

/** Today's date in Japan and the day number used to rotate subjects. */
export function jstToday(now = new Date()) {
  const d = new Date(now.getTime() + 9 * 3600_000);
  return { iso: d.toISOString().slice(0, 10), day: Math.floor(d.getTime() / 86_400_000) };
}

function newestSection(list: Block[]) {
  const i = list.findIndex((b) => b.type === "heading_2");
  if (i < 0) return null;
  const items: Block[] = [];
  for (const b of list.slice(i + 1)) {
    if (b.type === "heading_1" || b.type === "heading_2") break;
    if (b.type === "bulleted_list_item") items.push(b);
  }
  return { heading: plain(list[i].data.rich_text).trim(), items };
}

/** One news item for the day: subjects with news from the last 2 days take turns. */
export async function dailyItem(now = new Date()): Promise<DailyItem | null> {
  const { iso, day } = jstToday(now);
  const oldest = new Date(Date.parse(iso) - 2 * 86_400_000).toISOString().slice(0, 10);
  const hub = await getHub();
  const subs = await Promise.all(hub.pages.map((p) => getSubPage(p.slug).catch(() => null)));
  const fresh = subs.flatMap((s) => {
    const sec = s ? newestSection(s.blocks) : null;
    const date = sec?.heading.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    return s && sec && date && date >= oldest && sec.items.length ? [{ s, sec, date }] : [];
  });
  const pick = fresh[pickIndex(fresh.length, day)];
  if (!pick) return null;
  // Prefer the first item with an English headline, so Threads and Instagram get an English line.
  const parsed = pick.sec.items.map((b) => parseItem(b.data.rich_text));
  const index = Math.max(0, parsed.findIndex((p) => isLatin(p.headline)));
  const item = parsed[index];
  const { s } = pick;
  return {
    date: pick.date,
    index,
    subject: { title: s.title, icon: s.icon, slug: s.slug, url: `${SITE}/news/${s.slug}` },
    ...item,
  };
}

export function postsFor(item: DailyItem) {
  return buildPosts(item, item.subject, SITE) as { x: string; threads: string; instagram: string };
}

/** Public URL of the news card image (JPEG, 1080×1350) for Instagram. */
export function cardUrl(item: DailyItem) {
  return `${SITE}/api/social/card?d=${item.date}&s=${item.subject.slug}&i=${item.index}`;
}

/* ---------- Buffer ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
async function gql(query: string, variables: Record<string, unknown> = {}) {
  const key = process.env.BUFFER_API_KEY;
  if (!key) throw new Error("BUFFER_API_KEY is not set");
  const res = await fetch(BUFFER, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || body.errors?.length) throw new Error(`Buffer ${res.status}: ${body.errors?.[0]?.message ?? "request failed"}`);
  return body.data;
}

export type Channel = { id: string; service: string; name: string };

/** All connected channels, found from the API key (no ids to copy by hand). */
export async function bufferChannels(): Promise<Channel[]> {
  const data = await gql(`query { account { organizations { id } } }`);
  const orgs: { id: string }[] = data.account?.organizations ?? [];
  const lists = await Promise.all(
    orgs.map((o) => gql(`query { channels(input: { organizationId: ${JSON.stringify(o.id)} }) { id service name } }`)),
  );
  return lists.flatMap((l) => l.channels ?? []);
}

// GraphQL input written inline (as in Buffer's own examples). Enum values are wrapped in enumOf().
const ENUM = Symbol("enum");
const enumOf = (v: string) => ({ [ENUM]: v });
function lit(v: any): string {
  if (v && typeof v === "object" && ENUM in v) return v[ENUM];
  if (Array.isArray(v)) return `[${v.map(lit).join(", ")}]`;
  if (v && typeof v === "object") return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(", ")} }`;
  return JSON.stringify(v);
}

export async function bufferPost(channel: Channel, text: string, imageUrl?: string) {
  const input: Record<string, unknown> = { channelId: channel.id, text, schedulingType: enumOf("automatic"), mode: enumOf("shareNow") };
  if (imageUrl) input.assets = [{ image: { url: imageUrl } }];
  if (channel.service === "instagram") input.metadata = { instagram: { type: enumOf("post"), shouldShareToFeed: true } };
  const data = await gql(
    `mutation { createPost(input: ${lit(input)}) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    } }`,
  );
  const r = data.createPost;
  if (r?.message) throw new Error(r.message);
  return r?.post?.id as string;
}
