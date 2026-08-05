import type { CardItem } from "@/components/store/ProductCard";

/** Shape returned by the standard card select (see CARD_SELECT). */
export const CARD_SELECT =
  "id, title, brand, list_price, retail_price, condition_grade, possession, listed_at, category_id, seller_id, item_photos(url, sort), price_history(price, created_at)";

type CardRow = {
  id: string;
  title: string;
  brand: string | null;
  list_price: number | null;
  retail_price: number | null;
  condition_grade: string | null;
  possession: "warehouse" | "in_place";
  listed_at: string | null;
  category_id: string | null;
  seller_id: string;
  item_photos: { url: string; sort: number }[] | null;
  price_history: { price: number; created_at: string }[] | null;
};

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

  return {
    id: row.id,
    title: row.title,
    brand: row.brand,
    listPrice: row.list_price,
    retailPrice: row.retail_price,
    discountPct,
    priceDropped,
    condition: row.condition_grade,
    possession: row.possession,
    categoryId: row.category_id,
    sellerId: row.seller_id,
    photo: photos[0]?.url ?? null,
  };
}

export function toCardItems(rows: CardRow[] | null): CardItem[] {
  return (rows ?? []).map(toCardItem).filter((x): x is CardItem => x !== null);
}
