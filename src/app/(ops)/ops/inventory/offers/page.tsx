import { createClient } from "@/lib/supabase/server";
import { OfferRows, type AdminOffer } from "./OfferRows";

export const dynamic = "force-dynamic";

export default async function OpsOffersPage() {
  const supabase = await createClient();
  const { data: offers } = await supabase
    .from("offers")
    .select("id, amount, status, expires_at, created_at, items(title, list_price, seller_min_price, status, item_photos(url)), profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <p className="text-sm text-muted">
        Accepting an offer sells the item at that price and starts the seller&apos;s payout. Offers
        below the seller&apos;s minimum are blocked.
      </p>
      <OfferRows offers={(offers as unknown as AdminOffer[]) ?? []} />
    </div>
  );
}
