import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { qrSvg, code128Svg } from "@/lib/barcode";
import { BRAND, SITE_URL } from "@/lib/brand";
import { formatMoney } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: `Label - ${BRAND.name}` };

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Staff-only: SKUs and labels are internal warehouse tooling.
  const user = await getUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: staff } = await supabase.rpc("is_staff", { uid: user.id });
  if (!staff) redirect("/");

  const { data: item } = await supabase
    .from("items")
    .select("id, sku, title, brand, condition_grade, list_price, description")
    .eq("id", id)
    .maybeSingle();
  if (!item || !item.sku) notFound();

  const scanUrl = `${SITE_URL}/p/${item.sku}`;
  const qr = await qrSvg(scanUrl);
  const barcode = code128Svg(item.sku);

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-ink">
      <div className="mx-auto max-w-md">
        {/* Controls — hidden when printing */}
        <div className="mb-5 flex items-center justify-between print:hidden">
          <Link href="/ops/products" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} /> Products
          </Link>
          <PrintButton />
        </div>

        {/* The label itself */}
        <div className="label-card mx-auto w-full rounded-2xl border border-border bg-white p-6 text-center text-black shadow-card print:border-black print:shadow-none">
          <div className="text-lg font-extrabold tracking-tight">{BRAND.name}</div>

          <div className="mx-auto mt-3 w-40" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="mt-1 text-xs font-medium text-gray-500">Scan for live price &amp; details</div>

          <div className="mt-4 text-sm font-semibold leading-tight">
            {item.brand ? `${item.brand} · ` : ""}
            {item.title}
          </div>
          {item.condition_grade && (
            <div className="text-xs uppercase tracking-wide text-gray-500">{String(item.condition_grade).replace("_", " ")}</div>
          )}

          <div className="mx-auto mt-4 w-56" dangerouslySetInnerHTML={{ __html: barcode }} />

          <div className="mt-3 text-[11px] text-gray-500">
            Price updates automatically — always scan for the current price.
            {item.list_price != null && (
              <span className="mt-0.5 block text-gray-400">(listed today at {formatMoney(Number(item.list_price))})</span>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted print:hidden">
          SKU {item.sku} · QR opens {scanUrl}
        </p>
      </div>
    </div>
  );
}
