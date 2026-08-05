import { SiteHeader } from "@/components/SiteHeader";
import { getUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { CartContents } from "./CartContents";

export const metadata = { title: `Cart - ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const user = await getUser();
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight">Your cart</h1>
        <CartContents signedIn={Boolean(user)} />
      </main>
    </div>
  );
}
