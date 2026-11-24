import "server-only";

// Public website content comes from the Notion page "MK Production · News Watch" and the
// subject pages linked on it. Only those pages can be shown: the integration can also see
// MK Orders, so every page id is checked against the hub's own list before it is read.

const API = process.env.NOTION_API_URL ?? "https://api.notion.com/v1";
const VERSION = "2025-09-03";
export const HUB_ID = (process.env.NEWS_PAGE_ID ?? "4192e44d4610816fabc0d4d05ad6f251").replace(/-/g, "");
export const REVALIDATE = 1800; // seconds: the site re-reads Notion at most every 30 minutes

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Block = { id: string; type: string; data: any; children: Block[] };
export type RichText = any[];
export type SubPage = { id: string; slug: string; title: string; icon: string; blocks: Block[] };

async function get(path: string) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not set");
  const res = await fetch(API + path, {
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": VERSION },
    next: { revalidate: REVALIDATE },
  });
  if (res.status === 404 || res.status === 401)
    throw new Error("Notion can't see the News Watch page. In Notion open MK Production · News Watch > ••• > Connections and add the \"MK Orders app\" integration.");
  if (!res.ok) throw new Error(`Notion ${res.status}`);
  return res.json();
}

const NESTED = new Set(["column_list", "column", "bulleted_list_item", "numbered_list_item", "to_do", "callout", "quote"]);

export async function blocks(id: string, depth = 0): Promise<Block[]> {
  const out: Block[] = [];
  let cursor = "";
  do {
    const data = await get(`/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`);
    for (const b of data.results) {
      const kids = b.has_children && NESTED.has(b.type) && depth < 3 ? await blocks(b.id, depth + 1) : [];
      out.push({ id: b.id, type: b.type, data: b[b.type], children: kids });
    }
    cursor = data.has_more ? data.next_cursor : "";
  } while (cursor);
  return out;
}

export const plain = (rt: RichText = []) => rt.map((t) => t.plain_text).join("");

export function slugify(title: string) {
  const s = title.toLowerCase().replace(/&/g, " ").replace(/×/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "page";
}

function iconOf(page: any) {
  return page?.icon?.type === "emoji" ? page.icon.emoji : "📄";
}

// Child pages listed on the hub, outside toggles (retired subjects sit in a toggle and stay hidden).
function childPages(list: Block[]): Block[] {
  return list.flatMap((b) => (b.type === "child_page" ? [b] : b.type === "toggle" ? [] : childPages(b.children)));
}

export async function getHub() {
  const [page, list] = await Promise.all([get(`/pages/${HUB_ID}`), blocks(HUB_ID)]);
  const pages = await Promise.all(
    childPages(list).map(async (b) => {
      const p = await get(`/pages/${b.id}`);
      return { id: b.id.replace(/-/g, ""), slug: slugify(b.data.title), title: b.data.title as string, icon: iconOf(p) };
    }),
  );
  return { title: plain(page.properties?.title?.title) || "MK Production", icon: iconOf(page), blocks: list, pages };
}

export async function getSubPage(slug: string): Promise<SubPage | null> {
  const hub = await getHub();
  const meta = hub.pages.find((p) => p.slug === slug);
  if (!meta) return null;
  return { ...meta, blocks: await blocks(meta.id) };
}

// Latest dated section of a subject page: its heading and first items, for the front page.
export function latest(list: Block[], max = 3) {
  const i = list.findIndex((b) => b.type === "heading_2");
  if (i < 0) return null;
  const items: Block[] = [];
  for (const b of list.slice(i + 1)) {
    if (b.type === "heading_1" || b.type === "heading_2") break;
    if (b.type === "bulleted_list_item") items.push(b);
    if (items.length >= max) break;
  }
  return { heading: plain(list[i].data.rich_text), items };
}
