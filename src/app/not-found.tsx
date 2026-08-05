import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center text-ink">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
        <PackageSearch size={28} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">This one found a new home</h1>
      <p className="mt-2 max-w-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist — or the item already sold. Good deals go fast around here.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-full bg-brand px-5 py-2.5 font-medium text-brand-fg transition-opacity hover:opacity-90">
          Browse deals
        </Link>
        <Link href="/sell" className="rounded-full border border-border bg-surface px-5 py-2.5 font-medium transition-colors hover:border-ink">
          Sell with {BRAND.name}
        </Link>
      </div>
    </div>
  );
}
