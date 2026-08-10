import Link from "next/link";
import { Search, Tag } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "./store/CartButton";
import { AccountMenu } from "./store/AccountMenu";
import { ScanButton } from "./store/ScanButton";
import { NotificationBell } from "./store/NotificationBell";

/** Commerce header: logo · search · Sell · cart · account, with a category strip below. */
export async function SiteHeader() {
  const user = await getUser();
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Main row */}
        <div className="flex items-center gap-3 py-3">
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-brand">
            {BRAND.name}
          </Link>

          {/* Search — plain GET form, works without JS. Scan button reads a barcode/QR. */}
          <form action="/shop" method="get" className="hidden flex-1 sm:block">
            <div className="relative mx-auto max-w-xl">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                name="q"
                type="search"
                placeholder="Search products, brands…"
                className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-11 text-sm outline-none transition-colors focus:border-brand"
              />
              <ScanButton className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand/10 hover:text-brand" />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Sell — the core supply action, deliberately loud */}
            <Link
              href="/sell"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-fg shadow-sm transition-opacity hover:opacity-90"
            >
              <Tag size={14} /> Sell
            </Link>
            {user && <NotificationBell />}
            <CartButton />
            <AccountMenu signedIn={Boolean(user)} />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile search — scan button is especially useful here (customers in-store on phones) */}
        <form action="/shop" method="get" className="pb-3 sm:hidden">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              name="q"
              type="search"
              placeholder="Search or scan a tag…"
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-11 text-sm outline-none focus:border-brand"
            />
            <ScanButton className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand/10 hover:text-brand" />
          </div>
        </form>

        {/* Category strip */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryLink href="/shop" label="All" />
          {(categories ?? []).map((c) => (
            <CategoryLink key={c.id} href={`/shop?category=${c.id}`} label={c.name} />
          ))}
        </nav>
      </div>
    </header>
  );
}

function CategoryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 rounded-full px-3 py-1 text-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {label}
    </Link>
  );
}
