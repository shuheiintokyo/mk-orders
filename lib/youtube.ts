import "server-only";
import { parseFeed } from "./episodes";

// The channel's public feed: free, no API key. Re-read at most every 30 minutes like the news pages.
export const YOUTUBE_URL = "https://www.youtube.com/@mkproductionlab";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID ?? "UCPlV1HvtNg-LGCGfRZl9cnw";
const FEED = process.env.YOUTUBE_FEED_URL ?? `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type Episode = { id: string; title: string; published: string; description: string; url: string; thumb: string };

/** Newest episodes first. Never throws: no feed (or no videos yet) just means no YouTube section. */
export async function getEpisodes(): Promise<Episode[]> {
  try {
    const res = await fetch(FEED, { next: { revalidate: 1800 } });
    return res.ok ? (parseFeed(await res.text()) as Episode[]) : [];
  } catch {
    return [];
  }
}
