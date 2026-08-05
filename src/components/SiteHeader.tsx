import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { getUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/shop" className="hidden transition-colors hover:text-ink sm:inline">Shop</Link>
          {user ? (
            <>
              <Link href="/sell" className="transition-colors hover:text-ink">Sell</Link>
              <Link href="/my-items" className="transition-colors hover:text-ink">My items</Link>
              <ThemeToggle />
              <form action={signOut}>
                <button className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/login"
                className="rounded-full bg-brand px-4 py-1.5 font-medium text-brand-fg transition-opacity hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
