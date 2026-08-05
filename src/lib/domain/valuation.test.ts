import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateValue } from "./valuation";

test("valuation: retail-anchored estimate is tighter and higher-confidence", () => {
  const v = estimateValue({ conditionGrade: "excellent", retailPrice: 4000, category: "Electronics" });
  assert.equal(v.confidence, 0.8);
  assert.ok(v.estimateMin < v.estimateMax);
  // excellent = 0.55 of retail, +/-12% band around 2200
  assert.ok(v.estimateMin >= 1800 && v.estimateMax <= 2600, `got ${v.estimateMin}-${v.estimateMax}`);
});

test("valuation: no-retail falls back to category norms with lower confidence", () => {
  const v = estimateValue({ conditionGrade: "good", category: "Small Appliances" });
  assert.equal(v.confidence, 0.5);
  assert.ok(v.estimateMin > 0 && v.estimateMax > v.estimateMin);
});

test("valuation: worse condition yields a lower estimate", () => {
  const good = estimateValue({ conditionGrade: "like_new", retailPrice: 3000 });
  const worn = estimateValue({ conditionGrade: "fair", retailPrice: 3000 });
  assert.ok(worn.estimateMax < good.estimateMin);
});

test("valuation: premium brand lifts the estimate", () => {
  const plain = estimateValue({ conditionGrade: "excellent", retailPrice: 2000, brand: "Generic" });
  const premium = estimateValue({ conditionGrade: "excellent", retailPrice: 2000, brand: "Apple" });
  assert.ok(premium.estimateMin > plain.estimateMin);
});
