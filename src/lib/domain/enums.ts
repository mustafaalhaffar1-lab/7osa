/**
 * Shared domain enums. These mirror Postgres enum types 1:1 (see supabase migration).
 * Keep this file and the DB enums in lockstep — one is the type layer, the other is storage.
 */

export const APP_ROLES = ["buyer", "seller", "ops_agent", "driver", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const CONDITION_GRADES = ["new", "like_new", "excellent", "good", "fair"] as const;
export type ConditionGrade = (typeof CONDITION_GRADES)[number];

export const ORDER_STATUS = [
  "pending",
  "paid",
  "fulfilling",
  "delivered",
  "completed",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const OFFER_STATUS = [
  "pending",
  "accepted",
  "auto_accepted",
  "rejected",
  "expired",
  "withdrawn",
] as const;
export type OfferStatus = (typeof OFFER_STATUS)[number];

export const WALLET_TXN_TYPE = [
  "sale_credit", // seller payout credited on completed sale
  "payout", // withdrawal to bank
  "bonus", // loyalty / wallet-top-up bonus
  "promotion_spend", // seller pays to promote a listing
  "adjustment", // manual correction (ops)
  "refund_reversal", // claw back a credit after a return
] as const;
export type WalletTxnType = (typeof WALLET_TXN_TYPE)[number];

export const LOGISTICS_JOB_TYPE = [
  "pickup_intake", // warehouse mode: collect item from seller into warehouse
  "pickup_on_sale", // in_place mode: collect from seller AFTER it sells
  "delivery", // deliver to buyer
] as const;
export type LogisticsJobType = (typeof LOGISTICS_JOB_TYPE)[number];

export const LOGISTICS_JOB_STATUS = [
  "unassigned",
  "assigned",
  "en_route",
  "completed",
  "failed",
] as const;
export type LogisticsJobStatus = (typeof LOGISTICS_JOB_STATUS)[number];

export const PRICE_CHANGE_REASON = [
  "initial",
  "markdown",
  "manual",
  "offer_accepted",
] as const;
export type PriceChangeReason = (typeof PRICE_CHANGE_REASON)[number];

export const PAYMENT_METHOD = [
  "card",
  "apple_pay",
  "google_pay",
  "tabby",
  "tamara",
  "wallet",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];
