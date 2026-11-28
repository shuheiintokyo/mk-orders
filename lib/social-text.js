// Daily social posts built from one News Watch item. Pure functions, no network.
// X: Japanese. Threads: English. Instagram: Japanese + English (with a news card image).

/** Split a News Watch bullet into headline, Japanese summary, source name and link.
 *  Bullet shape: **Headline** — 日本語の要約（短い記事）。 · 📰 4 · [Source](url)
 *  "📰 4" (optional) = how many different outlets covered the story; the News Watch run checks this. */
export function parseItem(richText) {
  const rt = richText || [];
  const headline = rt.filter((t) => t.annotations?.bold).map((t) => t.plain_text).join("").trim();
  const linkPart = [...rt].reverse().find((t) => t.href || t.text?.link?.url);
  const url = linkPart ? linkPart.href || linkPart.text.link.url : "";
  const source = linkPart ? linkPart.plain_text.trim() : "";
  const rest = rt.filter((t) => !t.annotations?.bold && t !== linkPart).map((t) => t.plain_text).join("");
  const count = rest.match(/📰\s*(\d+)/);
  const summary = rest.replace(/\s*[·・]?\s*📰\s*\d+[^·・]*/, "").replace(/^\s*[—–-]\s*/, "").replace(/\s*[·・]\s*$/, "").trim();
  return { headline, summary, source, url, sources: count ? Number(count[1]) : 0 };
}

/** True when the text is mostly Latin letters (so it can be shown as an English headline). */
export function isLatin(s) {
  const letters = (s || "").replace(/[\s\d\p{P}\p{S}]/gu, "");
  if (!letters) return false;
  const latin = letters.replace(/[^A-Za-zÀ-ɏ]/g, "");
  return latin.length / letters.length > 0.8;
}

/** X counts CJK and most non-Latin characters as 2, and every link as 23. */
export function xLength(text) {
  let n = 0;
  for (const part of text.split(/(https?:\/\/\S+)/)) {
    if (/^https?:\/\//.test(part)) { n += 23; continue; }
    for (const ch of part) n += ch.codePointAt(0) <= 0x10ff || (ch >= " " && ch <= "‍") || (ch >= "‐" && ch <= "‟") || (ch >= "′" && ch <= "‷") ? 1 : 2;
  }
  return n;
}

/** Cut text so that a full post stays within the limit, adding "…" when cut. */
export function fit(text, measure, budget) {
  if (measure(text) <= budget) return text;
  const chars = [...text];
  while (chars.length && measure(chars.join("") + "…") > budget) chars.pop();
  return chars.join("").trimEnd() + "…";
}

// Subject labels, emoji and hashtags, matched on words in the Notion subject title.
const TOPICS = [
  { re: /3d|print/i, ja: "3Dプリント", en: "3D printing", emoji: "🖨️", tagsJa: ["#3Dプリンター", "#光造形"], tagsEn: ["#3DPrinting", "#Formlabs"] },
  { re: /design|cad|engineering/i, ja: "AI×設計", en: "AI × design", emoji: "📐", tagsJa: ["#AI設計", "#CAD"], tagsEn: ["#CAD", "#AIdesign"] },
  { re: /ai|dev/i, ja: "生成AI開発", en: "Gen-AI dev", emoji: "🤖", tagsJa: ["#生成AI", "#AI開発"], tagsEn: ["#GenAI", "#AI"] },
];
export function topicOf(subjectTitle) {
  return TOPICS.find((t) => t.re.test(subjectTitle)) || { ja: "ものづくり", en: "making", emoji: "✨", tagsJa: ["#ものづくり"], tagsEn: ["#making"] };
}

// Openers and closers, written the way a small workshop account would talk: short, calm,
// one emoji at most, no "good morning" in English (Threads readers are in many time zones),
// and no "tell us in the comments" while the accounts are new. A different one each day.
const OPEN_JA = [
  (t) => `おはようございます。今朝の${t.ja}ニュースから${t.emoji}`,
  (t) => `${t.ja}まわりで、こんなニュースがありました${t.emoji}`,
  (t) => `今日チェックした${t.ja}の話題です${t.emoji}`,
  (t) => `${t.emoji} 気になった${t.ja}ニュースをひとつ。`,
  (t) => `${t.ja}のニュースをひとつご紹介します${t.emoji}`,
];
// X and Threads: the line just before our link.
const CLOSE_JA = [
  "要点と元記事へのリンクはこちら👇",
  "元記事（出典）へのリンクもサイトにまとめています👇",
  "ほかのニュースもあわせてどうぞ👇",
  "気になった方はこちらから👇",
];
const OPEN_EN = [
  (t) => `Today's ${t.en} pick ${t.emoji}`,
  (t) => `One ${t.en} story worth a look ${t.emoji}`,
  (t) => `Spotted in the ${t.en} news today ${t.emoji}`,
  (t) => `From today's ${t.en} headlines ${t.emoji}`,
  (t) => `${t.emoji} A ${t.en} story we're following:`,
];
const CLOSE_EN = [
  "Our short summary and the original article:",
  "Summary and source link here:",
  "More of today's news on our site:",
  "Read the summary (and the original) here:",
];
// Instagram: links in captions are not clickable, so point to the link in the bio.
const CLOSE_IG_JA = ["要点と元記事へのリンクは、プロフィールのリンクからどうぞ。", "ほかのニュースもプロフィールのリンクからご覧いただけます。"];
const CLOSE_IG_EN = ["Summary and the original article: link in bio.", "More news via the link in our bio."];
const pick = (list, day) => list[((day % list.length) + list.length) % list.length];

/** Build the three posts. item = parseItem() result, subject = { title, url } (url = page on our site),
 *  day = day number, used to rotate the phrases. */
export function buildPosts(item, subject, site, day = 0) {
  const t = topicOf(subject.title);
  const summary = item.summary || item.headline;
  const enHead = isLatin(item.headline) ? item.headline : "";
  const via = item.source ? `via ${item.source}` : "";
  const openJa = pick(OPEN_JA, day)(t), closeJa = pick(CLOSE_JA, day);
  const openEn = pick(OPEN_EN, day)(t), closeEn = pick(CLOSE_EN, day);

  // X (Japanese): 280 weighted characters, link counts as 23.
  const xHead = `${openJa}\n\n`;
  const xTail = `${item.source ? `（出典：${item.source}）` : ""}\n\n${closeJa}\n${subject.url}\n${t.tagsJa.join(" ")}`;
  const x = xHead + fit(summary, (s) => xLength(xHead + s + xTail), 280) + xTail;

  // Threads (English): 500 characters.
  const thHead = `${openEn}\n\n`;
  const thBody = enHead || `A new story${item.source ? ` from ${item.source}` : ""}. Our summary is in Japanese for now, and the link to the original is on the page.`;
  const thTail = `${enHead && via ? `\n(${via})` : ""}\n\n${closeEn}\n${subject.url}`;
  const threads = thHead + fit(thBody, (s) => [...(thHead + s + thTail)].length, 500) + thTail;

  // Instagram (Japanese + English): caption up to 2,200 characters; links are not clickable.
  const instagram = [
    openJa,
    "",
    summary,
    pick(CLOSE_IG_JA, day),
    "",
    "― English ―",
    openEn,
    enHead || `Today's ${t.en} news (summary in Japanese above).`,
    pick(CLOSE_IG_EN, day),
    "",
    item.source ? `出典 / Source: ${item.source}` : "",
    "",
    [...t.tagsJa, ...t.tagsEn, "#mkproductionlab"].join(" "),
  ].filter((l, i, a) => l !== "" || (i > 0 && a[i - 1] !== "")).join("\n").trim().slice(0, 2200);

  return { x, threads, instagram };
}

/** Pick one subject per day, rotating so each subject gets a turn. dayNumber = days since 1970 (JST). */
export function pickIndex(count, dayNumber) {
  return count ? ((dayNumber % count) + count) % count : -1;
}
