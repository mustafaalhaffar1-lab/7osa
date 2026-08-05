# Reloop — Managed Resale Concierge (working codename)

Sell everything in your home; do nothing. We collect, inspect, photograph, price, sell, and
deliver — the seller just snaps a photo and gets paid. Concierge, not a marketplace.

**Launch market:** Dubai, UAE. **Launch scope:** any home good *except* oversized furniture
(no couches/beds) — one-driver logistics. **Categories:** electronics, small appliances,
home & kitchen, compact furniture, sports/outdoor.

## The three strategic decisions baked into the code

1. **Value floor (AED 500).** Handling cost is mostly fixed per item, so cheap items lose money
   at any commission. Below-floor items route to a future self-serve tier — never accepted at a loss.
   → `src/lib/domain/commission.ts`, `intake.ts`; DB `settings.value_floor`, `commission_tiers`.
2. **Hybrid possession.** Small/high-value items come into the warehouse (auth + fast delivery);
   bulky items stay with the seller until sold (collect-on-sale) to avoid storage cost.
   → `src/lib/domain/item-state.ts` dual state machine; `items.possession`.
3. **Markdown clock with a seller floor + auto return/donate at expiry.** No dead stock.
   → DB `settings.markdown_clock`, `items.sell_by` (engine wired in a later milestone).

## Stack

- **Next.js 15** (App Router) + **React 19** + **Tailwind** — modular monolith, not microservices
  (pre-PMF: velocity over premature distribution).
- **Supabase** (Postgres + RLS + Auth + Storage + Edge Functions).
- Search (Typesense/Meilisearch) and payments (Stripe/Tabby) land in their own milestones.

## Layout

```
src/
  app/
    page.tsx            landing (marketing)
    (seller)/sell       seller intake  → AI valuation, intake gate, pickup
    (buyer)/shop        buyer storefront → search, PDP, offers, checkout
    (ops)/ops           internal ERP (service-role, staff-gated)
  lib/
    brand.ts            single rename point
    domain/             PURE, TESTED business logic (mirrors the DB)
      commission.ts     tiers + value floor
      intake.ts         size/weight gate + custody choice
      item-state.ts     dual-possession lifecycle
      enums.ts          shared enums (lockstep with DB enum types)
    supabase/           browser + server + service-role clients
supabase/migrations/    0001_core_schema.sql  ← the spine
```

## Develop

```bash
npm install
npm run dev        # http://localhost:8110
npm test           # domain logic (money + lifecycle) — must stay green
npm run typecheck
```

Apply the schema to a Supabase project via the migration in `supabase/migrations/`, then set
`.env.local` from `.env.example`. **DB password never goes in chat or the repo.**

## Security posture

RLS is ON for every table (rows). Customer/seller clients use the anon key + policies; internal
ops/driver/admin surfaces run server-side with the service role. A later migration adds
column-level GRANT hardening. Sellers are anonymous to buyers.
