import "server-only";
import { getHub, getSubPage, plain, type Block } from "./news";
import { isCommentary, parseItem, topicOf } from "./social-text";
import { matchEpisode } from "./episodes";

// News Watch pages turned into story cards: headline, Japanese summary and where it came from.

export type Lang = { code: string; ja: string };
export type Story = { id: string; date: string; headline: string; summary: string; source: string; url: string; domain: string; lang: Lang | null; sources: number; video?: { url: string; title: string } };

/** The language of the original article, guessed from its headline (the headline keeps the original wording). */
export function langOf(headline: string): Lang | null {
  const s = headline.replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!s) return null;
  if (/[\uac00-\ud7af]/.test(s)) return { code: "KO", ja: "韓国語" };
  if (/[\u3040-\u30ff]/.test(s)) return { code: "JA", ja: "日本語" };
  if (/[\u4e00-\u9fff]/.test(s)) return { code: "ZH", ja: "中国語" };
  if (/[A-Za-z]/.test(s)) return { code: "EN", ja: "英語" };
  return null;
}
export type Topic = { slug: string; title: string; icon: string; label: string; color: string; kind: "news" | "weekly" | "log"; stories: Story[]; blocks: Block[] };

const COLORS = [
  { re: /3d|print/i, color: "#FF8A3D" },
  { re: /design|cad|engineering/i, color: "#C04BD8" },
  { re: /ai|dev/i, color: "#1EA7E8" },
  { re: /week|roundup/i, color: "#FF5C7A" },
];

export function colorOf(title: string) {
  return COLORS.find((c) => c.re.test(title))?.color ?? "#20B486";
}

function domainOf(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h === "news.google.com" ? "" : h; // Google News links hide the real site; the source name says it
  } catch {
    return "";
  }
}

/** Mark each story that a YouTube episode explains ("watch the deep dive"). */
export function withVideos(stories: Story[], episodes: { url: string; title: string; description: string }[]): Story[] {
  if (!episodes.length) return stories;
  return stories.map((s) => {
    const v = matchEpisode(s, episodes);
    return v ? { ...s, video: { url: v.url, title: v.title } } : s;
  });
}

/** The day's pick for a topic: from the newest day, the story the most outlets covered (ties: listed first). */
export function topPick(stories: Story[]): Story | undefined {
  const day = stories[0]?.date;
  return stories.filter((s) => s.date === day).reduce<Story | undefined>((best, s) => (!best || s.sources > best.sources ? s : best), undefined);
}

/** Every dated bullet on a subject page, newest section first. */
export function storiesOf(list: Block[]): Story[] {
  const out: Story[] = [];
  let date = "";
  for (const b of list) {
    if (b.type === "heading_2") date = plain(b.data.rich_text).trim();
    else if (b.type === "bulleted_list_item" && date) {
      const p = parseItem(b.data.rich_text);
      if (p.headline && !isCommentary(p)) out.push({ id: b.id, date, ...p, domain: domainOf(p.url), lang: langOf(p.headline) });
    }
  }
  return out;
}

export async function getTopics(): Promise<Topic[]> {
  const hub = await getHub();
  const pages = await Promise.all(hub.pages.map((p) => getSubPage(p.slug).catch(() => null)));
  return pages.flatMap((p) => {
    if (!p) return [];
    const kind: Topic["kind"] = /week|roundup/i.test(p.title) ? "weekly" : /event|log|learn/i.test(p.title) ? "log" : "news";
    const t = topicOf(p.title);
    const label = kind === "weekly" ? "週間まとめ" : kind === "log" ? "イベントと学び" : t.ja;
    return [{ slug: p.slug, title: p.title, icon: p.icon, label, color: colorOf(p.title), kind, stories: kind === "news" ? storiesOf(p.blocks) : [], blocks: p.blocks }];
  });
}

/** The newest week of a weekly roundup page: its heading, and each sub-heading with its item titles. */
export function latestWeek(list: Block[]) {
  const i = list.findIndex((b) => b.type === "heading_2");
  if (i < 0) return null;
  const groups: { title: string; items: string[] }[] = [];
  for (const b of list.slice(i + 1)) {
    if (b.type === "heading_2" || b.type === "heading_1") break;
    if (b.type === "heading_3") groups.push({ title: plain(b.data.rich_text).trim(), items: [] });
    else if (b.type === "bulleted_list_item" && groups.length) {
      const h = parseItem(b.data.rich_text).headline || plain(b.data.rich_text);
      groups[groups.length - 1].items.push(h);
    }
  }
  return { heading: plain(list[i].data.rich_text).trim(), groups };
}

/** "2026-11-23" -> "11/23" (other headings are kept as they are). */
export function shortDate(d: string) {
  const m = d.match(/\d{4}-(\d{2})-(\d{2})/);
  return m ? `${Number(m[1])}/${Number(m[2])}` : d;
}

export type Note = { id: string; date: string; title: string; excerpt: string; topic: string };

/** Learning-log entries written by the diary run, newest first, under the "## 記録 / Log" heading:
 *    ### YYYY-MM-DD · 日本語タイトル / English title
 *    JA paragraph, then EN paragraph
 *    Topic: AI / 3D printing / R&D   (optional "🔗 link" line after it)
 *  The card shows the title, the first (Japanese) paragraph and the topic. Toggles (the template) are skipped. */
export function notesOf(list: Block[], max = 3): Note[] {
  const start = list.findIndex((b) => b.type === "heading_2" && /記録|\blog\b/i.test(plain(b.data.rich_text)));
  if (start < 0) return [];
  const out: Note[] = [];
  let cur: Note | null = null;
  for (const b of list.slice(start + 1)) {
    if (b.type === "heading_2" || b.type === "heading_1") break;
    if (b.type === "heading_3") {
      const raw = plain(b.data.rich_text).trim();
      const date = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
      cur = { id: b.id, date, title: raw.replace(/^\d{4}-\d{2}-\d{2}\s*[·・:-]?\s*/, ""), excerpt: "", topic: "" };
      out.push(cur);
    } else if (cur && b.type === "paragraph") {
      const text = plain(b.data.rich_text).trim();
      const topic = text.match(/^(?:Topic|トピック)\s*[:：]\s*(.+)$/i);
      if (topic) cur.topic = topic[1].trim();
      else if (!cur.excerpt && text && !text.startsWith("🔗")) cur.excerpt = text.length > 140 ? text.slice(0, 138) + "…" : text;
    }
  }
  return out.slice(0, max);
}
