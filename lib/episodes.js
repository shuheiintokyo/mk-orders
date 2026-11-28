// YouTube episodes ("Behind the Headlines / ニュースの裏側") and which news story each one explains.
// Pure functions, no network, so they can be tested.

const decode = (s) => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? "").trim();

/** Parse the channel's public Atom feed (youtube.com/feeds/videos.xml?channel_id=...). Newest first. */
export function parseFeed(xml) {
  return [...(xml || "").matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const id = tag(e, "yt:videoId");
    return {
      id,
      title: tag(e, "title"),
      published: tag(e, "published"),
      description: tag(e, "media:description"),
      url: `https://www.youtube.com/watch?v=${id}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }).filter((v) => v.id);
}

const STOP = new Set("the a an and or of to in on for with by from at is are was were be as its it this that new how why what now your you behind headlines".split(" "));
/** Word tokens for Latin text, character pairs for Japanese/Chinese/Korean. */
export function tokens(text) {
  const t = (text || "").toLowerCase();
  const words = (t.match(/[a-z0-9][a-z0-9.+#-]*/g) || []).filter((w) => w.length > 1 && !STOP.has(w));
  const grams = [];
  for (const run of t.replace(/[^぀-ヿ㐀-鿿가-힯]+/g, " ").split(" ")) for (let i = 0; i + 1 < run.length; i++) grams.push(run.slice(i, i + 2));
  return new Set([...words, ...grams]);
}

const norm = (u) => (u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();

/** The episode that explains this story, if any: the description links the same article, or the episode's
 *  title and description share most of the story headline's words. */
export function matchEpisode(story, episodes) {
  const url = norm(story.url);
  for (const v of episodes) {
    const links = (v.description.match(/https?:\/\/\S+/g) || []).map(norm);
    if (url && !url.startsWith("news.google.com") && links.includes(url)) return v;
  }
  const head = tokens(story.headline);
  if (head.size < 3) return null;
  let best = null, bestScore = 0;
  for (const v of episodes) {
    const text = tokens(`${v.title} ${v.description}`);
    const shared = [...head].filter((t) => text.has(t)).length;
    const score = shared / head.size;
    if (shared >= 3 && score >= 0.6 && score > bestScore) { best = v; bestScore = score; }
  }
  return best;
}
