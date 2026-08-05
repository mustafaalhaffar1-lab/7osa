import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcCommission,
  BelowFloorError,
  VALUE_FLOOR,
  roundMoney,
} from "./commission";
import { assessIntake, defaultPossession } from "./intake";
import { canTransition, nextStates, isTerminal } from "./item-state";

test("commission: 40% tier splits AED 1500 sofa correctly", () => {
  const r = calcCommission(1500);
  assert.equal(r.marketplacePct, 0.4);
  assert.equal(r.marketplaceAmount, 600);
  assert.equal(r.sellerPayout, 900);
});

test("commission: tier boundaries (2000 -> 40%, 2000.01 -> 35%, 5000 -> 35%, 5001 -> 30%)", () => {
  assert.equal(calcCommission(2000).marketplacePct, 0.4);
  assert.equal(calcCommission(2000.01).marketplacePct, 0.35);
  assert.equal(calcCommission(5000).marketplacePct, 0.35);
  assert.equal(calcCommission(5001).marketplacePct, 0.3);
});

test("commission: payout + commission always reconstruct the sale price", () => {
  for (const price of [500, 733.33, 1999.99, 4200, 12345.67]) {
    const r = calcCommission(price);
    assert.equal(roundMoney(r.marketplaceAmount + r.sellerPayout), roundMoney(price));
  }
});

test("commission: below the value floor is a hard error, never a silent loss", () => {
  assert.throws(() => calcCommission(VALUE_FLOOR - 1), BelowFloorError);
  assert.throws(() => calcCommission(0), RangeError);
});

test("intake: oversized item is declined (no couches/beds at launch)", () => {
  const d = assessIntake({
    estimatedValueMin: 800,
    estimatedValueMax: 1200,
    longestSideCm: 210,
  });
  assert.equal(d.eligible, false);
  assert.equal(d.route, "declined");
});

test("intake: below-floor item is routed to self-serve, not declined", () => {
  const d = assessIntake({ estimatedValueMin: 100, estimatedValueMax: 300 });
  assert.equal(d.route, "self_serve");
  assert.equal(d.eligible, false);
});

test("intake: small high-value item -> concierge, warehouse custody", () => {
  const d = assessIntake({
    estimatedValueMin: 900,
    estimatedValueMax: 1400,
    weightKg: 0.5,
    longestSideCm: 20,
  });
  assert.equal(d.route, "concierge");
  assert.equal(d.possession, "warehouse");
});

test("intake: bulky-but-eligible item -> concierge, collect-on-sale", () => {
  const d = assessIntake({
    estimatedValueMin: 700,
    estimatedValueMax: 1100,
    weightKg: 25,
    longestSideCm: 120,
  });
  assert.equal(d.route, "concierge");
  assert.equal(d.possession, "in_place");
});

test("possession: a microwave goes to the warehouse, a dining table stays in place", () => {
  assert.equal(
    defaultPossession({ estimatedValueMin: 500, estimatedValueMax: 700, weightKg: 12, longestSideCm: 50 }),
    "warehouse"
  );
  assert.equal(
    defaultPossession({ estimatedValueMin: 900, estimatedValueMax: 1500, weightKg: 30, longestSideCm: 160 }),
    "in_place"
  );
});

test("state: warehouse QC happens before listing", () => {
  assert.ok(canTransition("warehouse", "inspected", "listed"));
  assert.ok(!canTransition("warehouse", "received", "listed"));
});

test("state: in_place collects only after the sale", () => {
  assert.ok(canTransition("in_place", "sold", "collection_scheduled"));
  assert.ok(!canTransition("in_place", "accepted", "pickup_scheduled"));
  assert.ok(canTransition("in_place", "accepted", "listed"));
});

test("state: a failed in_place inspection can trigger a return", () => {
  assert.ok(canTransition("in_place", "inspected", "returned"));
});

test("state: terminal states have no exits", () => {
  for (const s of ["completed", "withdrawn", "declined", "returned", "unsold_expired"] as const) {
    assert.ok(isTerminal(s));
    assert.equal(nextStates("warehouse", s).length, 0);
    assert.equal(nextStates("in_place", s).length, 0);
  }
});
