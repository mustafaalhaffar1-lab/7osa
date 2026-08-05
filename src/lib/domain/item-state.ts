/**
 * Item lifecycle — a dual-mode state machine.
 *
 * The same item table serves two custody models, and their happy paths differ:
 *
 *  warehouse (take it in up front):
 *    draft → estimated → accepted → pickup_scheduled → collected → received →
 *    inspected → listed → reserved → sold → in_transit → delivered → completed
 *
 *  in_place (collect-on-sale — item stays with the seller until it sells):
 *    draft → estimated → accepted → listed → reserved → sold →
 *    collection_scheduled → collected → inspected → in_transit → delivered → completed
 *
 * QC happens BEFORE listing for warehouse items, and AFTER the sale (on the way to the
 * buyer) for in_place items — which is why a failed in_place inspection can trigger a return.
 *
 * Every transition is validated here and logged to item_events in the DB. This module is the
 * single authority for "can this item move from A to B?".
 */

export type PossessionMode = "warehouse" | "in_place";

export const ITEM_STATUSES = [
  "draft",
  "estimated",
  "accepted",
  "pickup_scheduled",
  "collected",
  "received",
  "inspected",
  "listed",
  "reserved",
  "sold",
  "collection_scheduled",
  "in_transit",
  "delivered",
  "completed",
  "returned",
  "unsold_expired",
  "withdrawn",
  "declined",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** No outgoing transitions. */
export const TERMINAL_STATES: readonly ItemStatus[] = [
  "completed",
  "returned",
  "unsold_expired",
  "withdrawn",
  "declined",
];

const WAREHOUSE_FLOW: Partial<Record<ItemStatus, ItemStatus[]>> = {
  draft: ["estimated", "withdrawn"],
  estimated: ["accepted", "withdrawn", "declined"],
  accepted: ["pickup_scheduled", "withdrawn"],
  pickup_scheduled: ["collected", "withdrawn"],
  collected: ["received"],
  received: ["inspected"],
  inspected: ["listed", "declined"], // QC can reject before it ever lists
  listed: ["reserved", "unsold_expired", "withdrawn"],
  reserved: ["sold", "listed"], // checkout abandoned -> back to listed
  sold: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["completed", "returned"],
};

const IN_PLACE_FLOW: Partial<Record<ItemStatus, ItemStatus[]>> = {
  draft: ["estimated", "withdrawn"],
  estimated: ["accepted", "withdrawn", "declined"],
  accepted: ["listed", "withdrawn"], // photographed in place, then listed directly
  listed: ["reserved", "unsold_expired", "withdrawn"],
  reserved: ["sold", "listed"],
  sold: ["collection_scheduled"],
  collection_scheduled: ["collected"],
  collected: ["inspected"],
  inspected: ["in_transit", "returned"], // QC after sale; failure -> return/refund
  in_transit: ["delivered"],
  delivered: ["completed", "returned"],
};

const FLOWS: Record<PossessionMode, Partial<Record<ItemStatus, ItemStatus[]>>> = {
  warehouse: WAREHOUSE_FLOW,
  in_place: IN_PLACE_FLOW,
};

/** Valid next states from `from` under the given custody mode. */
export function nextStates(mode: PossessionMode, from: ItemStatus): ItemStatus[] {
  return FLOWS[mode][from] ?? [];
}

/** Whether `from -> to` is a legal transition for this custody mode. */
export function canTransition(
  mode: PossessionMode,
  from: ItemStatus,
  to: ItemStatus
): boolean {
  return nextStates(mode, from).includes(to);
}

export function isTerminal(status: ItemStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

/** True once the item is publicly visible / sellable in the storefront. */
export function isLive(status: ItemStatus): boolean {
  return status === "listed" || status === "reserved";
}
