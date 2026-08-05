"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import type { AppRole } from "@/lib/domain/enums";
import { setStaffRole } from "../admin-actions";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  balance: number;
  items_count: number;
  orders_count: number;
  roles: string[];
};

const STAFF_ROLES: AppRole[] = ["ops_agent", "driver", "admin"];

export function UserRows({ users, amAdmin, myId }: { users: AdminUser[]; amAdmin: boolean; myId: string }) {
  return (
    <ul className="mt-4 space-y-2">
      {users.map((u) => (
        <Row key={u.id} user={u} amAdmin={amAdmin} isMe={u.id === myId} />
      ))}
    </ul>
  );
}

function Row({ user, amAdmin, isMe }: { user: AdminUser; amAdmin: boolean; isMe: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(role: AppRole) {
    setError(null);
    start(async () => {
      const has = user.roles.includes(role);
      const res = await setStaffRole(user.id, role, !has);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
          {(user.full_name || user.email)[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <div className="truncate text-sm font-medium">
            {user.full_name || "—"} {isMe && <span className="text-xs text-muted">(you)</span>}
          </div>
          <div className="truncate text-xs text-muted">{user.email}</div>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <Stat label="Items" value={String(user.items_count)} />
          <Stat label="Orders" value={String(user.orders_count)} />
          <Stat label="Wallet" value={formatMoney(user.balance)} />
        </div>
        <div className="flex gap-1.5">
          {STAFF_ROLES.map((r) => {
            const has = user.roles.includes(r);
            return (
              <button
                key={r}
                disabled={!amAdmin || pending}
                onClick={() => toggle(r)}
                title={amAdmin ? (has ? `Revoke ${r}` : `Grant ${r}`) : "Admins only"}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed ${
                  has
                    ? "bg-brand text-brand-fg"
                    : "border border-border text-muted hover:border-brand hover:text-brand disabled:hover:border-border disabled:hover:text-muted"
                }`}
              >
                {r.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="font-semibold text-ink">{value}</span> {label}
    </span>
  );
}
