// Daily social posts built from one News Watch item. Pure functions, no network.
// X: Japanese. Threads: English. Instagram: Japanese + English (with a news card image).

/** Split a News Watch bullet into headline, Japanese summary, source name and link.
 *  Bullet shape: **Headline** — 日本語の要約。 · [Source](url) */
export function parseItem(richText) {
  const rt = richText || [];
  const headline = rt.filter((t) => t.annotations?.bold).map((t) => t.plain_text).join("").trim();
  const linkPart = [...rt].reverse().find((t) => t.href || t.text?.link?.url);
  const url = linkPart ? linkPart.href || linkPart.text.link.url : "";
  const source = linkPart ? linkPart.plain_text.trim() : "";
  const rest = rt.filter((t) => !t.annotations?.bold && t !== linkPart).map((t) => t.plain_text).join("");
  const summary = rest.replace(/^\s*[—–-]\s*/, "").replace(/\s*[·・]\s*$/, "").trim();
  return { headline, summary, source, url };
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

// Subject labels and hashtags, matched on words in the Notion subject title.
const TOPICS = [
  { re: /3d|print/i, ja: "3Dプリント", en: "3D printing", tagsJa: ["#3Dプリンター", "#光造形"], tagsEn: ["#3DPrinting", "#Formlabs"] },
  { re: /design|cad|engineering/i, ja: "AI×設計", en: "AI × design", tagsJa: ["#AI設計", "#CAD"], tagsEn: ["#CAD", "#AIdesign"] },
  { re: /ai|dev/i, ja: "生成AI開発", en: "Gen-AI dev", tagsJa: ["#生成AI", "#AI開発"], tagsEn: ["#GenAI", "#AI"] },
];
export function topicOf(subjectTitle) {
  return TOPICS.find((t) => t.re.test(subjectTitle)) || { ja: "ニュース", en: "News", tagsJa: ["#ものづくり"], tagsEn: ["#making"] };
}

/** Build the three posts. item = parseItem() result, subject = { title, url } (url = page on our site). */
export function buildPosts(item, subject, site) {
  const t = topicOf(subject.title);
  const summary = item.summary || item.headline;
  const enHead = isLatin(item.headline) ? item.headline : "";

  // X (Japanese): 280 weighted characters, link counts as 23.
  const xHead = `【今日の${t.ja}ニュース】\n`;
  const xTail = `\n\n${t.tagsJa.join(" ")}\n${subject.url}`;
  const x = xHead + fit(summary, (s) => xLength(xHead + s + xTail), 280) + xTail;

  // Threads (English): 500 characters.
  const thHead = `Today's ${t.en} pick 📰\n\n`;
  const thBody = enHead || `New from ${item.source || "the news"} — summary in Japanese on our site.`;
  const thTail = `${item.source ? `\n(via ${item.source})` : ""}\n\nDaily news on 3D printing, design & AI, in Japanese and English 👇\n${subject.url}`;
  const threads = thHead + fit(thBody, (s) => [...(thHead + s + thTail)].length, 500) + thTail;

  // Instagram (Japanese + English): caption up to 2,200 characters; links are not clickable.
  const instagram = [
    `【今日の${t.ja}ニュース】`,
    summary,
    "",
    enHead ? `🇬🇧 ${enHead}` : `🇬🇧 Today's ${t.en} news, summarised in Japanese.`,
    "",
    item.source ? `出典 / Source: ${item.source}` : "",
    `続きはプロフィールのリンクから / More at ${site.replace(/^https?:\/\//, "")} (link in bio)`,
    "",
    [...t.tagsJa, ...t.tagsEn, "#mkproductionlab"].join(" "),
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").slice(0, 2200);

  return { x, threads, instagram };
}

/** Pick one subject per day, rotating so each subject gets a turn. dayNumber = days since 1970 (JST). */
export function pickIndex(count, dayNumber) {
  return count ? ((dayNumber % count) + count) % count : -1;
}
