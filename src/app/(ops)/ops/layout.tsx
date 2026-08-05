import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { OpsNav } from "./OpsNav";

export const metadata = { title: `Operations - ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  let staff = false;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("is_staff", { uid: user.id });
    staff = Boolean(data);
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-bg text-ink">
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-xl font-semibold">Staff only</h1>
          <p className="mt-2 text-muted">
            This area is for {BRAND.name} operations staff.{" "}
            {!user && (
              <>
                <Link href="/login" className="text-brand hover:underline">
                  Sign in
                </Link>{" "}
                first.
              </>
            )}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <OpsNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
