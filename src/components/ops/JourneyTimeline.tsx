import {
  CalendarCheck,
  Car,
  PackageCheck,
  ClipboardCheck,
  Camera,
  Tag,
  ShoppingBag,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type StepState = "done" | "current" | "todo";

export type JourneyStep = {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  state: StepState;
};

/** The full Hoosa cycle, from "come get my stuff" to "seller paid". */
export const CYCLE: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "requested", label: "Visit requested", icon: CalendarCheck },
  { key: "en_route", label: "Agent on the way", icon: Car },
  { key: "collected", label: "Collected", icon: PackageCheck },
  { key: "inspected", label: "Inspected & cleaned", icon: ClipboardCheck },
  { key: "photographed", label: "Photographed", icon: Camera },
  { key: "listed", label: "Listed", icon: Tag },
  { key: "sold", label: "Sold", icon: ShoppingBag },
  { key: "delivered", label: "Delivered", icon: Truck },
  { key: "paid", label: "Seller paid", icon: Wallet },
];

/**
 * Horizontal journey rail. Purely presentational — callers decide which steps are
 * done/current so the same component narrates a visit, an item, or an order.
 */
export function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="flex gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = s.state === "done";
        const current = s.state === "current";
        return (
          <li key={s.key} className="flex min-w-[92px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : done || current ? "bg-brand" : "bg-border"}`} />
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? "border-brand bg-brand text-brand-fg"
                    : current
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface text-muted"
                } ${current ? "ring-4 ring-brand/15" : ""}`}
              >
                <Icon size={15} />
              </span>
              <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? "bg-transparent" : done ? "bg-brand" : "bg-border"}`} />
            </div>
            <div className={`mt-1.5 text-[11px] leading-tight ${done || current ? "font-medium text-ink" : "text-muted"}`}>
              {s.label}
            </div>
            {s.hint && <div className="text-[10px] text-muted">{s.hint}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/** Build the cycle for a visit + the items it produced. */
export function visitJourney(
  visitStatus: string,
  itemStates: { listed: number; sold: number; delivered: number; paid: number; inspected: number; collected: number }
): JourneyStep[] {
  const reached: Record<string, boolean> = {
    requested: true,
    en_route: ["en_route", "completed"].includes(visitStatus),
    collected: visitStatus === "completed" && itemStates.collected > 0,
    inspected: itemStates.inspected > 0,
    photographed: itemStates.listed > 0,
    listed: itemStates.listed > 0,
    sold: itemStates.sold > 0,
    delivered: itemStates.delivered > 0,
    paid: itemStates.paid > 0,
  };

  const order = CYCLE.map((c) => c.key);
  const lastDone = order.reduce((acc, k, i) => (reached[k] ? i : acc), 0);

  return CYCLE.map((c, i) => ({
    key: c.key,
    label: c.label,
    icon: c.icon,
    state: i < lastDone ? "done" : i === lastDone ? "current" : "todo",
  }));
}
