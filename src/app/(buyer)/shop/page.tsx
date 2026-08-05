import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Shop — ${BRAND.name}` };

export default function ShopPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Shop</h1>
      <p className="mt-3 text-muted">
        Next up in the build: the premium storefront — search, condition reports, price history,
        scheduled price drops, offers, and checkout.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        Buyer storefront — scaffolded. Reads live `items` (status = listed) once inventory exists.
      </div>
    </main>
  );
}
