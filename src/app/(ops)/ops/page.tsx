import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";

export const metadata = { title: `Ops — ${BRAND.name}` };

export default function OpsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Operations console</h1>
      <p className="mt-3 text-muted">
        Next up in the build: the internal ERP — intake queue, inspection & photography queues,
        pricing approvals, warehouse shelving, logistics jobs board, and settlement.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        Ops console — scaffolded. Runs server-side with the service role; staff-gated via
        `staff_roles`.
      </div>
    </main>
  );
}
