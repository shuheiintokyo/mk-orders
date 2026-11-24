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

// Subject labels, emoji and hashtags, matched on words in the Notion subject title.
const TOPICS = [
  { re: /3d|print/i, ja: "3Dプリント", en: "3D printing", emoji: "🖨️", tagsJa: ["#3Dプリンター", "#光造形"], tagsEn: ["#3DPrinting", "#Formlabs"] },
  { re: /design|cad|engineering/i, ja: "AI×設計", en: "AI × design", emoji: "📐", tagsJa: ["#AI設計", "#CAD"], tagsEn: ["#CAD", "#AIdesign"] },
  { re: /ai|dev/i, ja: "生成AI開発", en: "Gen-AI dev", emoji: "🤖", tagsJa: ["#生成AI", "#AI開発"], tagsEn: ["#GenAI", "#AI"] },
];
export function topicOf(subjectTitle) {
  return TOPICS.find((t) => t.re.test(subjectTitle)) || { ja: "ものづくり", en: "making", emoji: "✨", tagsJa: ["#ものづくり"], tagsEn: ["#making"] };
}

// Friendly openers and closers. A different one each day so the feed does not feel robotic.
const OPEN_JA = [
  (t) => `おはようございます☀️ 今日の${t.ja}ニュースをお届けします${t.emoji}`,
  (t) => `今日の${t.ja}ニュース、ひとつピックアップしました${t.emoji}`,
  (t) => `こんにちは、MK Productionです😊 今日気になった${t.ja}ニュースはこちら${t.emoji}`,
  (t) => `${t.emoji} 今日の${t.ja}トピックをシェアします！`,
];
const CLOSE_JA = ["みなさんはどう思いますか？ぜひコメントで教えてください💬", "詳しくはこちらからどうぞ👇", "ものづくり好きの方、ぜひチェックしてみてください✨"];
const OPEN_EN = [
  (t) => `Good morning! ☀️ Here's today's ${t.en} story ${t.emoji}`,
  (t) => `Hi from Tokyo & Kobe 👋 Today's ${t.en} pick ${t.emoji}`,
  (t) => `${t.emoji} Something interesting from the ${t.en} world today:`,
  (t) => `Morning, makers! ☕ Today's ${t.en} news ${t.emoji}`,
];
const CLOSE_EN = ["What do you think? Tell us in the replies 💬", "Curious? There's a short summary on our site 👇", "Have a great day, makers! ✨"];
const pick = (list, day) => list[((day % list.length) + list.length) % list.length];

/** Build the three posts. item = parseItem() result, subject = { title, url } (url = page on our site),
 *  day = day number, used to rotate the friendly phrases. */
export function buildPosts(item, subject, site, day = 0) {
  const t = topicOf(subject.title);
  const summary = item.summary || item.headline;
  const enHead = isLatin(item.headline) ? item.headline : "";
  const openJa = pick(OPEN_JA, day)(t), closeJa = pick(CLOSE_JA, day);
  const openEn = pick(OPEN_EN, day)(t), closeEn = pick(CLOSE_EN, day);

  // X (Japanese): 280 weighted characters, link counts as 23.
  const xHead = `${openJa}\n\n`;
  const xTail = `\n\n${closeJa}\n${subject.url}\n${t.tagsJa.join(" ")}`;
  const x = xHead + fit(summary, (s) => xLength(xHead + s + xTail), 280) + xTail;

  // Threads (English): 500 characters.
  const thHead = `${openEn}\n\n`;
  const thBody = enHead || `A new story from ${item.source || "the news"} (we summarised it in Japanese).`;
  const thTail = `${item.source ? ` (via ${item.source})` : ""}\n\n${closeEn}\n${subject.url}`;
  const threads = thHead + fit(thBody, (s) => [...(thHead + s + thTail)].length, 500) + thTail;

  // Instagram (Japanese + English): caption up to 2,200 characters; links are not clickable.
  const instagram = [
    openJa,
    summary,
    closeJa.replace("こちらから", "プロフィールのリンクから").replace("👇", "👆"),
    "",
    "🇬🇧 " + openEn,
    enHead || `Today's ${t.en} news, summarised in Japanese.`,
    closeEn.replace("on our site 👇", "via the link in our bio 👆").replace("in the replies", "in the comments"),
    "",
    item.source ? `出典 / Source: ${item.source}` : "",
    `🔗 ${site.replace(/^https?:\/\//, "")}（プロフィールのリンク / link in bio）`,
    "",
    [...t.tagsJa, ...t.tagsEn, "#mkproductionlab"].join(" "),
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n").slice(0, 2200);

  return { x, threads, instagram };
}

/** Pick one subject per day, rotating so each subject gets a turn. dayNumber = days since 1970 (JST). */
export function pickIndex(count, dayNumber) {
  return count ? ((dayNumber % count) + count) % count : -1;
}
