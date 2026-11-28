import test from "node:test";
import assert from "node:assert/strict";
import { parseItem, buildPosts, xLength, isLatin, pickIndex } from "./social-text.js";

const rt = [
  { plain_text: "ELEGOO Unveils Four-Printhead Centauri X Ultra", annotations: { bold: true } },
  { plain_text: " — ELEGOOがFormnext 2026で4ヘッド搭載のCentauri X Ultraを披露。色替え時の廃材を減らす設計。 · ", annotations: {} },
  { plain_text: "3D Printing Industry", href: "https://3dprintingindustry.com/x", annotations: {} },
];
const subject = { title: "3D printing & materials", url: "https://mkproductionlab.com/news/3d-printing-materials" };

test("parseItem splits headline, summary, source and link", () => {
  const i = parseItem(rt);
  assert.equal(i.headline, "ELEGOO Unveils Four-Printhead Centauri X Ultra");
  assert.equal(i.summary, "ELEGOOがFormnext 2026で4ヘッド搭載のCentauri X Ultraを披露。色替え時の廃材を減らす設計。");
  assert.equal(i.source, "3D Printing Industry");
  assert.equal(i.url, "https://3dprintingindustry.com/x");
});

test("posts fit each platform and link to our site", () => {
  const p = buildPosts(parseItem(rt), subject, "https://mkproductionlab.com");
  assert.ok(xLength(p.x) <= 280, `x is ${xLength(p.x)}`);
  assert.ok(p.x.includes("3Dプリント") && p.x.includes(subject.url));
  assert.ok([...p.threads].length <= 500 && p.threads.includes("ELEGOO Unveils") && p.threads.includes(subject.url));
  assert.ok(p.instagram.includes("ELEGOOがFormnext") && p.instagram.includes("ELEGOO Unveils") && p.instagram.includes("#3DPrinting"));
});

test("friendly phrases change from day to day and every variant fits", () => {
  const posts = [0, 1, 2, 3, 4, 5].map((d) => buildPosts(parseItem(rt), subject, "https://mkproductionlab.com", d));
  assert.ok(new Set(posts.map((p) => p.x.split("\n")[0])).size >= 3);
  for (const p of posts) assert.ok(xLength(p.x) <= 280 && [...p.threads].length <= 500);
});

test("long Japanese summary is cut for X", () => {
  const long = [{ plain_text: "見出し", annotations: { bold: true } }, { plain_text: " — " + "あ".repeat(300), annotations: {} }];
  const p = buildPosts(parseItem(long), subject, "https://mkproductionlab.com");
  assert.ok(xLength(p.x) <= 280 && p.x.includes("…"));
});

test("non-English headline is not used as the English line", () => {
  assert.equal(isLatin("聚焦APEC｜深圳智造"), false);
  assert.equal(isLatin("Siemens connects agentic AI"), true);
  const p = buildPosts(parseItem([{ plain_text: "聚焦APEC", annotations: { bold: true } }, { plain_text: " — 深圳製が9割。", annotations: {} }]), subject, "https://mkproductionlab.com");
  assert.ok(!p.threads.includes("聚焦"));
});

test("subjects take turns", () => {
  assert.deepEqual([0, 1, 2, 3].map((d) => pickIndex(3, d)), [0, 1, 2, 0]);
  assert.equal(pickIndex(0, 5), -1);
});
