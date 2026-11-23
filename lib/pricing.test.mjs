import test from "node:test";
import assert from "node:assert/strict";
import { suggestedQuote, dataDeleteDate, materialCost, laborCost } from "./pricing.js";

test("example: 50 ml, default 10 yen/ml, 30 min, 185 yen shipping", () => {
  // 50*10*1.2 = 600, 30/60*1172 = 586, +185 = 1371 -> 1400
  assert.equal(materialCost({ resinMl: 50 }), 600);
  assert.equal(laborCost({ handsOnMinutes: 30 }), 586);
  assert.equal(suggestedQuote({ resinMl: 50, handsOnMinutes: 30, shippingYen: 185 }), 1400);
});
test("custom yen per ml", () => {
  // 100*20*1.2 = 2400, 60 min = 1172, 0 ship = 3572 -> 3600
  assert.equal(suggestedQuote({ resinMl: 100, yenPerMl: 20, handsOnMinutes: 60 }), 3600);
});
test("exact hundreds are not bumped", () => {
  // 100*10*1.2 = 1200
  assert.equal(suggestedQuote({ resinMl: 100 }), 1200);
});
test("empty order is 0", () => assert.equal(suggestedQuote({}), 0));
test("delete date is shipped + 90 days", () => {
  assert.equal(dataDeleteDate("2026-11-23"), "2027-02-21");
  assert.equal(dataDeleteDate(null), null);
});
