/**
 * Commission engine — the money logic.
 *
 * Costs to handle an item are mostly FIXED per item (pickup, inspection, photography,
 * storage, delivery, support), so items below a value floor lose money at any commission.
 * Concierge intake therefore requires an expected sale value >= VALUE_FLOOR; cheaper items
 * are routed to a future self-serve tier (see intake.ts), never accepted at a loss.
 *
 * These defaults are also persisted in the DB (commission_tiers, settings) and are
 * admin-editable at runtime. This module is the pure reference implementation used
 * server-side for quoting and settlement.
 */

/** Minimum expected sale value (AED) for concierge intake. */
export const VALUE_FLOOR = 500;

export interface CommissionTier {
  /** inclusive lower bound (AED) */
  minPrice: number;
  /** inclusive upper bound (AED); null = no cap */
  maxPrice: number | null;
  /** marketplace share, 0..1 */
  marketplacePct: number;
}

/**
 * Default tiers. Boundary rule: a tier applies when price <= its maxPrice (ascending scan),
 * so AED 2000 -> 40%, AED 2000.01 -> 35%, matching "501–2000 / 2001–5000 / 5000+".
 */
export const DEFAULT_COMMISSION_TIERS: readonly CommissionTier[] = [
  { minPrice: 500, maxPrice: 2000, marketplacePct: 0.4 },
  { minPrice: 2000, maxPrice: 5000, marketplacePct: 0.35 },
  { minPrice: 5000, maxPrice: null, marketplacePct: 0.3 },
];

/** Round to fils (2 decimals) without float drift. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export interface CommissionResult {
  salePrice: number;
  marketplacePct: number;
  marketplaceAmount: number;
  sellerPayout: number;
  tier: CommissionTier;
}

export class BelowFloorError extends Error {
  constructor(public salePrice: number) {
    super(`Sale price ${salePrice} is below the concierge value floor (${VALUE_FLOOR}).`);
    this.name = "BelowFloorError";
  }
}

/**
 * Split a sale price into marketplace commission and seller payout.
 * Throws BelowFloorError below VALUE_FLOOR — a below-floor item should never reach settlement.
 */
export function calcCommission(
  salePrice: number,
  tiers: readonly CommissionTier[] = DEFAULT_COMMISSION_TIERS
): CommissionResult {
  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    throw new RangeError(`Invalid sale price: ${salePrice}`);
  }
  if (salePrice < VALUE_FLOOR) {
    throw new BelowFloorError(salePrice);
  }

  const ordered = [...tiers].sort((a, b) => a.minPrice - b.minPrice);
  const tier =
    ordered.find((t) => t.maxPrice === null || salePrice <= t.maxPrice) ??
    ordered[ordered.length - 1];

  const marketplaceAmount = roundMoney(salePrice * tier.marketplacePct);
  const sellerPayout = roundMoney(salePrice - marketplaceAmount);

  return {
    salePrice,
    marketplacePct: tier.marketplacePct,
    marketplaceAmount,
    sellerPayout,
    tier,
  };
}
