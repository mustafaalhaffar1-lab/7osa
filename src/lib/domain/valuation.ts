/**
 * Valuation — the "AI values it in seconds" step.
 *
 * This is the BASELINE estimator: a transparent, deterministic model from category,
 * condition, brand, and (if known) original retail price. It exists so the whole intake
 * pipeline — gate, custody, payout preview — works end to end today. A real vision model
 * (image -> brand/model/condition -> comparable sales) drops in behind the same `Valuation`
 * contract later without touching callers.
 *
 * Everything downstream (intake gate, commission) consumes the {min,max} range, never a
 * single number — an estimate is a claim with uncertainty, and we never anchor a seller to a
 * figure we can't hit.
 */
import type { ConditionGrade } from "./enums";

export interface ValuationInput {
  /** Seeded category name, e.g. "Electronics". */
  category?: string;
  conditionGrade: ConditionGrade;
  brand?: string;
  /** Original retail price in AED, if the seller knows it. Sharpens the estimate. */
  retailPrice?: number;
}

export interface Valuation {
  estimateMin: number;
  estimateMax: number;
  /** 0..1 — higher when we anchor on a known retail price. */
  confidence: number;
  /** Human-readable explanation shown to the seller. */
  basis: string;
}

/** Fraction of original retail a used item fetches, by condition. */
const CONDITION_FACTOR: Record<ConditionGrade, number> = {
  new: 0.75,
  like_new: 0.65,
  excellent: 0.55,
  good: 0.42,
  fair: 0.28,
};

/** Fallback midpoint value (AED) when retail is unknown, by category. */
const CATEGORY_BASE: Record<string, number> = {
  Electronics: 1500,
  "Small Appliances": 750,
  "Home & Kitchen": 550,
  "Furniture (compact)": 900,
  "Sports & Outdoor": 650,
};
const DEFAULT_BASE = 700;

/** Brands that hold resale value — a modest premium. */
const PREMIUM_BRANDS = new Set([
  "apple", "sony", "dyson", "bose", "samsung", "bosch", "kitchenaid",
  "dji", "nintendo", "lego", "herman miller", "delonghi", "nespresso",
]);

function round5(n: number): number {
  return Math.round(n / 5) * 5; // round to nearest AED 5 — reads like a real price
}

export function estimateValue(input: ValuationInput): Valuation {
  const factor = CONDITION_FACTOR[input.conditionGrade];
  const premium = input.brand && PREMIUM_BRANDS.has(input.brand.trim().toLowerCase()) ? 1.15 : 1;

  let mid: number;
  let confidence: number;
  let basis: string;

  if (input.retailPrice && input.retailPrice > 0) {
    mid = input.retailPrice * factor * premium;
    confidence = 0.8;
    basis = `Based on AED ${Math.round(input.retailPrice)} retail, ${input.conditionGrade.replace("_", " ")} condition${premium > 1 ? ", premium brand" : ""}.`;
  } else {
    const base = (input.category && CATEGORY_BASE[input.category]) || DEFAULT_BASE;
    mid = base * (factor / CONDITION_FACTOR.excellent) * premium; // scale base (typical=excellent) by condition
    confidence = 0.5;
    basis = `Estimated from ${input.category ?? "category"} norms and ${input.conditionGrade.replace("_", " ")} condition. Add a retail price for a sharper quote.`;
  }

  // Wider band when we're less sure.
  const spread = confidence >= 0.8 ? 0.12 : 0.2;
  return {
    estimateMin: round5(mid * (1 - spread)),
    estimateMax: round5(mid * (1 + spread)),
    confidence,
    basis,
  };
}
