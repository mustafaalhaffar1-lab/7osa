import type { CardItem } from "@/components/store/ProductCard";

/** Shape returned by the standard card select (see CARD_SELECT). */
export const CARD_SELECT =
  "id, title, brand, list_price, retail_price, condition_grade, possession, listed_at, sell_by, category_id, seller_id, item_photos(url, sort), price_history(price, created_at), item_metrics(views, saves)";

type CardRow = {
  id: string;
  title: string;
  brand: string | null;
  list_price: number | null;
  retail_price: number | null;
  condition_grade: string | null;
  possession: "warehouse" | "in_place";
  listed_at: string | null;
  sell_by: string | null;
  category_id: string | null;
  seller_id: string;
  item_photos: { url: string; sort: number }[] | null;
  price_history: { price: number; created_at: string }[] | null;
  item_metrics: { views: number; saves: number } | { views: number; saves: number }[] | null;
};

/** Days from now until an ISO date, rounded up; null when past or absent. */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const days = Math.ceil((+new Date(iso) - Date.now()) / 86_400_000);
  return days > 0 ? days : null;
}

/** Map a DB row to the precomputed card shape. Returns null for unpriced rows. */
export function toCardItem(row: CardRow): CardItem | null {
  if (row.list_price == null) return null;

  const photos = (row.item_photos ?? []).slice().sort((a, b) => a.sort - b.sort);
  const history = (row.price_history ?? [])
    .slice()
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  const priceDropped =
    history.length > 1 && history[history.length - 1].price < history[0].price;

  const discountPct =
    row.retail_price != null && row.retail_price > row.list_price
      ? Math.round((1 - row.list_price / row.retail_price) * 100)
      : null;

  // item_metrics is a 1:1 embed; supabase may hand back an object or a 1-length array.
  const m = Array.isArray(row.item_metrics) ? row.item_metrics[0] : row.item_metrics;

  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    listPrice: row.list_price,
    retailPrice: row.retail_price,
    discountPct,
    saveAmount:
      row.retail_price != null && row.retail_price > row.list_price
        ? row.retail_price - row.list_price
        : null,
    priceDropped,
    nextDropDays: daysUntil(row.sell_by),
    condition: row.condition_grade,
    possession: row.possession,
    categoryId: row.category_id,
    sellerId: row.seller_id,
    photo: photos[0]?.url ?? null,
    views: m?.views ?? 0,
    saves: m?.saves ?? 0,
  };
}

export function toCardItems(rows: CardRow[] | null): CardItem[] {
  return (rows ?? []).map(toCardItem).filter((x): x is CardItem => x !== null);
}

/**
 * Light natural-language query parsing: "office chair under AED 400" ->
 * { keywords: "office chair", under: 400 }. Understands under/below/over/above.
 */
export function parseQuery(q: string): { keywords: string; under: number | null; over: number | null } {
  let under: number | null = null;
  let over: number | null = null;

  let rest = q
    .replace(/(?:under|below|less than|cheaper than|max)\s*(?:aed)?\s*([\d,]+)/gi, (_m, n) => {
      under = parseInt(String(n).replace(/,/g, ""), 10) || null;
      return " ";
    })
    .replace(/(?:over|above|more than|min)\s*(?:aed)?\s*([\d,]+)/gi, (_m, n) => {
      over = parseInt(String(n).replace(/,/g, ""), 10) || null;
      return " ";
    })
    .replace(/\baed\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { keywords: rest, under, over };
}
