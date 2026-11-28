import test from "node:test";
import assert from "node:assert/strict";
import { parseFeed, matchEpisode } from "./episodes.js";

const xml = `<feed><entry><yt:videoId>abc123</yt:videoId><title>MCP: how AI plugs into your apps | Behind the Headlines #1 ・ AIがアプリにつながるしくみ</title>
<published>2026-11-29T01:00:00+00:00</published><media:group><media:description>Google now offers official MCP servers for Gmail, Calendar and Drive.
Sources / 出典
- Google Workspace: Configure the Gmail MCP server — https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server</media:description></media:group></entry></feed>`;

test("parseFeed reads id, title, description and links", () => {
  const [v] = parseFeed(xml);
  assert.equal(v.id, "abc123");
  assert.equal(v.url, "https://www.youtube.com/watch?v=abc123");
  assert.ok(v.title.startsWith("MCP:") && v.description.includes("Gmail"));
});

test("matchEpisode finds the story by its link or its words, and not unrelated stories", () => {
  const eps = parseFeed(xml);
  assert.equal(matchEpisode({ headline: "Something else", url: "https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server/" }, eps)?.id, "abc123");
  assert.equal(matchEpisode({ headline: "Google launches official MCP servers for Gmail, Calendar and Drive", url: "https://news.google.com/x" }, eps)?.id, "abc123");
  assert.equal(matchEpisode({ headline: "Bambu Lab P3C: Technical Specifications and Pricing", url: "https://3dprintingindustry.com/x" }, eps), null);
  assert.equal(matchEpisode({ headline: "財務省が樹脂に関税", url: "https://news.google.com/y" }, eps), null);
});
