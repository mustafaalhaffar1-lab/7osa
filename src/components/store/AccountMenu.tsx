"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

export function AccountMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm text-muted transition-colors hover:text-ink"
      >
        <User size={15} /> Sign in
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Account"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-ink"
      >
        <User size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          <MenuLink href="/my-items" label="My items" onClick={() => setOpen(false)} />
          <MenuLink href="/wallet" label="Wallet" onClick={() => setOpen(false)} />
          <MenuLink href="/purchases" label="Purchases" onClick={() => setOpen(false)} />
          <form action={signOut}>
            <button className="w-full px-4 py-2 text-left text-sm text-muted transition-colors hover:bg-bg hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink"
    >
      {label}
    </Link>
  );
}
