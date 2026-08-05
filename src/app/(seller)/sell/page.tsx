import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Sell — ${BRAND.name}` };

export default function SellPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Sell an item</h1>
      <p className="mt-3 text-muted">
        Next up in the build: photo upload → AI valuation → intake gate (value floor + size check)
        → custody decision (warehouse vs collect-on-sale) → pickup booking.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        Seller intake flow — scaffolded. Wiring the AI valuation + intake gate is the next milestone.
      </div>
    </main>
  );
}
