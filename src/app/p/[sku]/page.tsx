import { redirect } from "next/navigation";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: `Scan - ${BRAND.name}` };

/**
 * The permanent scan target printed on every item. Resolves the fixed SKU to the live
 * product page (current price + description). If the item has sold, it's no longer public,
 * so we show a friendly "sold" state instead of a 404.
 */
export default async function ScanResolvePage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("id")
    .eq("sku", sku)
    .in("status", ["listed", "reserved"])
    .maybeSingle();

  if (item?.id) redirect(`/shop/${item.id}`);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center text-ink">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
        <PackageCheck size={28} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">This one has found a new home</h1>
      <p className="mt-2 max-w-sm text-muted">
        Item <span className="font-mono text-ink">{sku}</span> has sold. Good deals move fast on {BRAND.name} —
        but there&apos;s plenty more, all professionally inspected.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand px-6 py-2.5 font-medium text-brand-fg transition-opacity hover:opacity-90"
      >
        Browse live deals
      </Link>
    </div>
  );
}
