import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Wallet,
  Package,
  ShoppingBag,
  History,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { BRAND } from "@/lib/brand";

export type PastVisit = {
  id: string;
  scheduled_date: string;
  slot: string;
  status: string;
  items_collected: number;
  fee_amount: number;
  fee_status: string;
  report_summary: string | null;
  declined_notes: string | null;
};

export type CustomerSummary = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string;
  joined: string | null;
  walletBalance: number;
  itemsListed: number;
  itemsSold: number;
  ordersPlaced: number;
};

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; tone: string }> = {
  completed: { icon: CheckCircle2, tone: "text-green-600 dark:text-green-400" },
  cancelled: { icon: XCircle, tone: "text-red-500" },
};

/** Who is this person, and what happened last time we went out to them? */
export function CustomerPanel({
  customer,
  pastVisits,
  currentVisitId,
}: {
  customer: CustomerSummary;
  pastVisits: PastVisit[];
  currentVisitId: string;
}) {
  const others = pastVisits.filter((v) => v.id !== currentVisitId);
  const totalCollected = pastVisits.reduce((s, v) => s + v.items_collected, 0);

  return (
    <div className="space-y-4">
      {/* Who */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-bold text-brand-fg">
            {(customer.name || customer.email || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{customer.name || "Unnamed customer"}</h2>
            {customer.joined && (
              <p className="text-xs text-muted">
                Customer since{" "}
                {new Date(customer.joined).toLocaleDateString(BRAND.locale, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <Link
            href={`/ops/customers/${customer.id}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            Profile <ExternalLink size={11} />
          </Link>
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-muted transition-colors hover:text-brand">
              <Phone size={13} /> {customer.phone}
            </a>
          )}
          {customer.email && (
            <span className="flex items-center gap-2 text-muted">
              <Mail size={13} /> <span className="truncate">{customer.email}</span>
            </span>
          )}
          <span className="flex items-start gap-2 text-muted">
            <MapPin size={13} className="mt-0.5 shrink-0" /> {customer.address}
          </span>
        </div>

        {/* Relationship at a glance — is this a good customer? */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
          <Stat icon={<Wallet size={12} />} label="Wallet" value={formatMoney(customer.walletBalance)} />
          <Stat icon={<History size={12} />} label="Visits" value={String(pastVisits.length)} />
          <Stat icon={<Package size={12} />} label="Items sold" value={`${customer.itemsSold} / ${customer.itemsListed}`} />
          <Stat icon={<ShoppingBag size={12} />} label="Bought" value={String(customer.ordersPlaced)} />
        </div>
      </section>

      {/* What happened before */}
      <section className="rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <History size={15} className="text-brand" /> Previous visits
          </h2>
          <span className="text-xs text-muted">
            {others.length === 0
              ? "First visit"
              : `${others.length} before · ${totalCollected} items all-time`}
          </span>
        </div>

        {others.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted">
            This is their first visit with {BRAND.name}.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {others.map((v) => {
              const meta = STATUS_ICON[v.status] ?? { icon: Clock, tone: "text-muted" };
              const Icon = meta.icon;
              return (
                <li key={v.id}>
                  <Link href={`/ops/visits/${v.id}`} className="block px-5 py-3 transition-colors hover:bg-bg">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={`shrink-0 ${meta.tone}`} />
                      <span className="text-sm font-medium">
                        {new Date(v.scheduled_date).toLocaleDateString(BRAND.locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs capitalize text-muted">{v.status.replace("_", " ")}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted">
                        {v.items_collected} item{v.items_collected === 1 ? "" : "s"}
                        {v.fee_status === "credited" ? " · fee credited" : ""}
                      </span>
                    </div>
                    {v.report_summary && (
                      <p className="mt-1 line-clamp-2 pl-6 text-xs italic text-muted">
                        “{v.report_summary}”
                      </p>
                    )}
                    {v.declined_notes && (
                      <p className="mt-0.5 line-clamp-1 pl-6 text-xs text-muted">
                        <span className="font-medium">Turned down:</span> {v.declined_notes}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg px-3 py-2">
      <div className="inline-flex items-center gap-1 text-[11px] text-muted">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}
