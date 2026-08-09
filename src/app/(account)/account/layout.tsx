import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { AccountNav } from "./AccountNav";

export const metadata = { title: `Your account - ${BRAND.name}` };
export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-8">
          <AccountNav />
          <div className="mt-4 lg:mt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
