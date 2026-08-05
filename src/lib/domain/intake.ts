/**
 * Intake gate — decides whether an item is accepted for concierge, and how we take custody.
 *
 * Two hard gates:
 *  1. Size/weight — launch scope is "any home good EXCEPT oversized furniture" (no couches,
 *     beds, wardrobes). One driver + a van, no 2-person crews. Oversized => declined.
 *  2. Value floor — even the optimistic estimate must clear VALUE_FLOOR, else self-serve.
 *
 * Possession mode is then chosen: small/high-value items come into the warehouse
 * (fast delivery + authentication); larger items stay with the seller until sold
 * (collect-on-sale) to avoid storage cost.
 */
import { VALUE_FLOOR } from "./commission";
import type { PossessionMode } from "./item-state";

/** One-driver logistics ceiling. Above this we don't accept at launch. */
export const MAX_ITEM_WEIGHT_KG = 40;
export const MAX_ITEM_LONGEST_SIDE_CM = 180;

/** Above these, keep the item at the seller's home until it sells (collect-on-sale). */
export const WAREHOUSE_MAX_WEIGHT_KG = 15;
export const WAREHOUSE_MAX_LONGEST_SIDE_CM = 80;

export interface IntakeInput {
  estimatedValueMin: number;
  estimatedValueMax: number;
  weightKg?: number;
  longestSideCm?: number;
}

export type IntakeRoute = "concierge" | "self_serve" | "declined";

export interface IntakeDecision {
  eligible: boolean;
  route: IntakeRoute;
  possession: PossessionMode | null;
  reasons: string[];
}

/** Choose custody model from physical size. Small => warehouse, larger => collect-on-sale. */
export function defaultPossession(input: IntakeInput): PossessionMode {
  const heavy = (input.weightKg ?? 0) > WAREHOUSE_MAX_WEIGHT_KG;
  const bulky = (input.longestSideCm ?? 0) > WAREHOUSE_MAX_LONGEST_SIDE_CM;
  return heavy || bulky ? "in_place" : "warehouse";
}

export function assessIntake(input: IntakeInput): IntakeDecision {
  const reasons: string[] = [];

  const tooHeavy = (input.weightKg ?? 0) > MAX_ITEM_WEIGHT_KG;
  const tooLarge = (input.longestSideCm ?? 0) > MAX_ITEM_LONGEST_SIDE_CM;
  if (tooHeavy) reasons.push(`Over ${MAX_ITEM_WEIGHT_KG}kg — outside launch logistics.`);
  if (tooLarge)
    reasons.push(`Longer than ${MAX_ITEM_LONGEST_SIDE_CM}cm — outside launch logistics.`);

  if (tooHeavy || tooLarge) {
    return { eligible: false, route: "declined", possession: null, reasons };
  }

  // Even the best-case estimate must clear the floor to be worth concierge handling.
  if (input.estimatedValueMax < VALUE_FLOOR) {
    return {
      eligible: false,
      route: "self_serve",
      possession: null,
      reasons: [`Below the AED ${VALUE_FLOOR} concierge value floor.`],
    };
  }

  return {
    eligible: true,
    route: "concierge",
    possession: defaultPossession(input),
    reasons: [],
  };
}
