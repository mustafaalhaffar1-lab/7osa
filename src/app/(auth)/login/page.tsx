"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { signIn, signUp, type AuthState } from "../actions";

const initial: AuthState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const action = mode === "in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        {BRAND.name}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "in" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "in"
          ? "Sign in to sell your items or track your wallet."
          : "Start selling in minutes — no listing, no haggling."}
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {mode === "up" && (
          <Field label="Full name" name="full_name" type="text" autoComplete="name" />
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
        />

        {state.error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">{state.notice}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand px-5 py-3 font-medium text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-6 text-sm text-muted transition-colors hover:text-ink"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}
