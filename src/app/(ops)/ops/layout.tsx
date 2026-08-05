import Link from "next/link";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { BRAND } from "@/lib/brand";
import { OpsNav } from "./OpsNav";

export const metadata = { title: `${BRAND.name} Ops` };
export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  let staff = false;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("is_staff", { uid: user.id });
    staff = Boolean(data);
  }

  // Standalone gate — no storefront chrome anywhere in the back office.
  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-ink">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-fg">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{BRAND.name} Operations</h1>
          <p className="mt-2 text-sm text-muted">
            Internal system — staff accounts only.
          </p>
          {user ? (
            <p className="mt-4 text-sm text-muted">
              Your account doesn&apos;t have staff access. Ask an admin to grant it.
            </p>
          ) : (
            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Left sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-brand-fg">
            {BRAND.name[0]}
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">{BRAND.name}</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">Operations</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <OpsNav orientation="vertical" />
        </div>

        <div className="border-t border-border px-3 py-3">
          <div className="truncate px-2 pb-2 text-xs text-muted">{user?.email}</div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <ExternalLink size={15} /> View storefront
          </Link>
          <form action={signOut}>
            <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
              {BRAND.name[0]}
            </div>
            <span className="text-sm font-bold">{BRAND.name} Ops</span>
          </div>
          <form action={signOut}>
            <button aria-label="Sign out" className="rounded-full border border-border p-2 text-muted">
              <LogOut size={14} />
            </button>
          </form>
        </div>
        <div className="px-2 pb-2">
          <OpsNav orientation="horizontal" />
        </div>
      </div>

      {/* Content */}
      <main className="p-4 sm:p-6 lg:ml-60 lg:p-8">{children}</main>
    </div>
  );
}
