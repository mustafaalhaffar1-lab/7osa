-- Reloop — core schema (Phase 6 data model, delivered as code)
-- Managed resale concierge for home goods. Category-agnostic item model with a
-- dual-possession lifecycle (warehouse vs collect-on-sale). Mirrors src/lib/domain/*.
--
-- Security posture: RLS ON everywhere; customer/seller clients use the anon key and are
-- constrained by the policies below. Internal ops/driver/admin surfaces run server-side with
-- the service role (bypasses RLS). A later migration adds column-level GRANT hardening.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum types (kept in lockstep with src/lib/domain/enums.ts + item-state.ts)
-- ---------------------------------------------------------------------------
create type app_role as enum ('buyer', 'seller', 'ops_agent', 'driver', 'admin');
create type condition_grade as enum ('new', 'like_new', 'excellent', 'good', 'fair');
create type possession_mode as enum ('warehouse', 'in_place');
create type item_status as enum (
  'draft','estimated','accepted','pickup_scheduled','collected','received',
  'inspected','listed','reserved','sold','collection_scheduled','in_transit',
  'delivered','completed','returned','unsold_expired','withdrawn','declined'
);
create type order_status as enum ('pending','paid','fulfilling','delivered','completed','refunded','cancelled');
create type offer_status as enum ('pending','accepted','auto_accepted','rejected','expired','withdrawn');
create type wallet_txn_type as enum ('sale_credit','payout','bonus','promotion_spend','adjustment','refund_reversal');
create type logistics_job_type as enum ('pickup_intake','pickup_on_sale','delivery');
create type logistics_job_status as enum ('unassigned','assigned','en_route','completed','failed');
create type price_change_reason as enum ('initial','markdown','manual','offer_accepted');
create type payment_method as enum ('card','apple_pay','google_pay','tabby','tamara','wallet');

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Staff privileges only. Every authenticated user can buy and sell implicitly.
create table public.staff_roles (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  role     app_role not null check (role in ('ops_agent','driver','admin')),
  primary key (user_id, role)
);

create or replace function public.is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = uid);
$$;

-- New auth user -> profile + wallet
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.wallets (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Config (admin-editable — nothing here should require a developer)
-- ---------------------------------------------------------------------------
create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.commission_tiers (
  id              uuid primary key default gen_random_uuid(),
  min_price       numeric(12,2) not null,
  max_price       numeric(12,2),               -- null = no cap
  marketplace_pct numeric(4,3) not null check (marketplace_pct between 0 and 1),
  active          boolean not null default true
);

create table public.zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  emirate    text not null default 'Dubai',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  parent_id          uuid references public.categories(id) on delete set null,
  -- default custody hint; final choice is per-item from actual size (see intake.ts)
  possession_default possession_mode not null default 'warehouse',
  active             boolean not null default true
);

-- ---------------------------------------------------------------------------
-- The spine: items
-- ---------------------------------------------------------------------------
create table public.items (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.profiles(id) on delete restrict,
  category_id       uuid references public.categories(id) on delete set null,

  title             text not null,
  brand             text,
  model             text,
  description       text,                       -- AI-generated, human-approved
  condition_grade   condition_grade,

  -- custody + lifecycle
  possession        possession_mode not null,
  status            item_status not null default 'draft',

  -- physical (drives intake gate + custody)
  weight_kg         numeric(7,2),
  longest_side_cm   numeric(7,1),

  -- AI valuation + pricing
  ai_estimate_min   numeric(12,2),
  ai_estimate_max   numeric(12,2),
  ai_confidence     numeric(4,3),
  retail_price      numeric(12,2),              -- original RRP if known
  list_price        numeric(12,2),
  seller_min_price  numeric(12,2),              -- markdown never drops below this
  auto_accept_above numeric(12,2),              -- auto-accept offers >= this

  -- location: warehouse shelf OR seller address (in_place)
  shelf_code        text,
  seller_address    text,
  zone_id           uuid references public.zones(id) on delete set null,

  -- identity / tracking
  sku               text unique,                -- human/QR/barcode code

  -- markdown clock
  listed_at         timestamptz,
  sell_by           timestamptz,                -- auto return/donate at expiry

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index items_status_idx     on public.items(status);
create index items_seller_idx     on public.items(seller_id);
create index items_category_idx   on public.items(category_id);
create index items_live_idx       on public.items(status) where status in ('listed','reserved');

create trigger items_set_updated_at before update on public.items
  for each row execute function public.set_updated_at();

create table public.item_photos (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  url        text not null,
  kind       text not null default 'professional' check (kind in ('ai_intake','professional','inspection')),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
create index item_photos_item_idx on public.item_photos(item_id);

-- Immutable audit / ownership chain / movement history
create table public.item_events (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  event_type  text not null,                   -- e.g. 'status_change','price_change','note'
  from_status item_status,
  to_status   item_status,
  actor_id    uuid references public.profiles(id) on delete set null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index item_events_item_idx on public.item_events(item_id, created_at);

-- Auto-log every status change to the audit trail
create or replace function public.log_item_status_change()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.item_events (item_id, event_type, from_status, to_status, metadata)
      values (new.id, 'status_change', old.status, new.status, '{}');
  end if;
  return new;
end $$;

create trigger items_log_status after update on public.items
  for each row execute function public.log_item_status_change();

create table public.inspections (
  id                    uuid primary key default gen_random_uuid(),
  item_id               uuid not null references public.items(id) on delete cascade,
  inspector_id          uuid references public.profiles(id) on delete set null,
  condition_grade       condition_grade,
  functional_test_passed boolean,              -- electronics
  data_wipe_certified   boolean,               -- electronics
  notes                 text,
  report                jsonb not null default '{}',
  created_at            timestamptz not null default now()
);

create table public.price_history (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  price      numeric(12,2) not null,
  reason     price_change_reason not null,
  created_at timestamptz not null default now()
);
create index price_history_item_idx on public.price_history(item_id, created_at);

-- ---------------------------------------------------------------------------
-- Demand side: offers + orders
-- ---------------------------------------------------------------------------
create table public.offers (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.items(id) on delete cascade,
  buyer_id   uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  status     offer_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index offers_item_idx  on public.offers(item_id);
create index offers_buyer_idx on public.offers(buyer_id);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null unique references public.items(id) on delete restrict, -- unique inventory: one sale per item
  buyer_id         uuid not null references public.profiles(id) on delete restrict,
  sale_price       numeric(12,2) not null,
  commission_pct   numeric(4,3) not null,
  commission_amount numeric(12,2) not null,
  seller_payout    numeric(12,2) not null,
  status           order_status not null default 'pending',
  payment_method   payment_method,
  payment_ref      text,
  delivery_zone_id uuid references public.zones(id) on delete set null,
  delivery_address text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_buyer_idx on public.orders(buyer_id);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Wallet + ledger (append-only; balance is derived + cached)
-- ---------------------------------------------------------------------------
create table public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.profiles(id) on delete cascade,
  balance    numeric(12,2) not null default 0,
  currency   text not null default 'AED',
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets(id) on delete cascade,
  amount        numeric(12,2) not null,        -- signed: credit positive, debit negative
  type          wallet_txn_type not null,
  reference_id  uuid,                          -- order_id, payout_id, etc.
  balance_after numeric(12,2) not null,
  memo          text,
  created_at    timestamptz not null default now()
);
create index wallet_txn_wallet_idx on public.wallet_transactions(wallet_id, created_at);

create table public.payouts (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references public.profiles(id) on delete restrict,
  amount     numeric(12,2) not null check (amount > 0),
  method     text not null default 'bank' check (method in ('bank','wallet')),
  status     text not null default 'requested' check (status in ('requested','processing','paid','failed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Logistics
-- ---------------------------------------------------------------------------
create table public.logistics_jobs (
  id              uuid primary key default gen_random_uuid(),
  type            logistics_job_type not null,
  item_id         uuid references public.items(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete cascade,
  driver_id       uuid references public.profiles(id) on delete set null,
  zone_id         uuid references public.zones(id) on delete set null,
  status          logistics_job_status not null default 'unassigned',
  scheduled_from  timestamptz,
  scheduled_to    timestamptz,
  address         text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index logistics_status_idx on public.logistics_jobs(status);
create index logistics_driver_idx on public.logistics_jobs(driver_id);
create trigger logistics_set_updated_at before update on public.logistics_jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications (multi-channel outbox)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  channel    text not null check (channel in ('push','sms','email','whatsapp','in_app')),
  template   text not null,
  payload    jsonb not null default '{}',
  status     text not null default 'queued' check (status in ('queued','sent','failed','read')),
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at);

-- ---------------------------------------------------------------------------
-- Commission function (reads admin-editable tiers; mirrors commission.ts)
-- ---------------------------------------------------------------------------
create or replace function public.calc_commission(sale_price numeric)
returns table (marketplace_pct numeric, marketplace_amount numeric, seller_payout numeric)
language plpgsql stable as $$
declare
  floor_val numeric;
  t record;
begin
  if sale_price is null or sale_price <= 0 then
    raise exception 'invalid sale price: %', sale_price;
  end if;

  select coalesce((value->>'amount')::numeric, 500) into floor_val
    from public.settings where key = 'value_floor';
  if floor_val is null then floor_val := 500; end if;

  if sale_price < floor_val then
    raise exception 'sale price % below value floor %', sale_price, floor_val;
  end if;

  -- smallest cap that still contains the price -> matches "2000 => 40%, 2000.01 => 35%"
  select * into t from public.commission_tiers
    where active
      and sale_price >= min_price
      and (max_price is null or sale_price <= max_price)
    order by coalesce(max_price, 1e18) asc
    limit 1;

  if not found then
    raise exception 'no commission tier for price %', sale_price;
  end if;

  marketplace_pct := t.marketplace_pct;
  marketplace_amount := round(sale_price * t.marketplace_pct, 2);
  seller_payout := round(sale_price - marketplace_amount, 2);
  return next;
end $$;

-- ---------------------------------------------------------------------------
-- Seed config
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('value_floor', '{"amount": 500}'),
  ('markdown_clock', '{"days_to_first_drop": 14, "drop_pct": 10, "interval_days": 10}'),
  ('launch_scope', '{"max_weight_kg": 40, "max_longest_side_cm": 180}');

insert into public.commission_tiers (min_price, max_price, marketplace_pct) values
  (500, 2000, 0.400),
  (2000, 5000, 0.350),
  (5000, null, 0.300);

insert into public.zones (name, emirate) values
  ('Dubai Marina', 'Dubai'),
  ('Downtown / Business Bay', 'Dubai'),
  ('Jumeirah', 'Dubai');

insert into public.categories (name, possession_default) values
  ('Electronics', 'warehouse'),
  ('Small Appliances', 'warehouse'),
  ('Home & Kitchen', 'warehouse'),
  ('Furniture (compact)', 'in_place'),
  ('Sports & Outdoor', 'in_place');

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.staff_roles         enable row level security;
alter table public.settings            enable row level security;
alter table public.commission_tiers    enable row level security;
alter table public.zones               enable row level security;
alter table public.categories          enable row level security;
alter table public.items               enable row level security;
alter table public.item_photos         enable row level security;
alter table public.item_events         enable row level security;
alter table public.inspections         enable row level security;
alter table public.price_history       enable row level security;
alter table public.offers              enable row level security;
alter table public.orders              enable row level security;
alter table public.wallets             enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payouts             enable row level security;
alter table public.logistics_jobs      enable row level security;
alter table public.notifications       enable row level security;

-- Public catalog config is world-readable
create policy zones_read      on public.zones            for select using (active);
create policy categories_read on public.categories       for select using (active);
create policy tiers_read      on public.commission_tiers for select using (active);

-- Profiles: you see and edit only yourself (sellers stay anonymous to buyers)
create policy profiles_self_read  on public.profiles for select using (id = auth.uid());
create policy profiles_self_write on public.profiles for update using (id = auth.uid());

-- Items: public sees only live listings; sellers see all of their own
create policy items_public_read on public.items for select
  using (status in ('listed','reserved'));
create policy items_owner_read  on public.items for select
  using (seller_id = auth.uid());
create policy items_owner_insert on public.items for insert
  with check (seller_id = auth.uid() and status = 'draft');
create policy items_owner_update on public.items for update
  using (seller_id = auth.uid());

-- Photos: visible if the parent item is live or owned
create policy item_photos_read on public.item_photos for select using (
  exists (
    select 1 from public.items i
    where i.id = item_photos.item_id
      and (i.status in ('listed','reserved') or i.seller_id = auth.uid())
  )
);

-- Price history is public for live items (buyers see the trend)
create policy price_history_read on public.price_history for select using (
  exists (select 1 from public.items i where i.id = price_history.item_id
          and (i.status in ('listed','reserved') or i.seller_id = auth.uid()))
);

-- Offers: buyer sees own; seller sees offers on own items; buyer may place offers
create policy offers_buyer_read on public.offers for select using (buyer_id = auth.uid());
create policy offers_seller_read on public.offers for select using (
  exists (select 1 from public.items i where i.id = offers.item_id and i.seller_id = auth.uid())
);
create policy offers_buyer_insert on public.offers for insert with check (buyer_id = auth.uid());

-- Orders: buyer sees own; seller sees orders for own items
create policy orders_buyer_read on public.orders for select using (buyer_id = auth.uid());
create policy orders_seller_read on public.orders for select using (
  exists (select 1 from public.items i where i.id = orders.item_id and i.seller_id = auth.uid())
);

-- Wallet + ledger: owner only
create policy wallets_self on public.wallets for select using (user_id = auth.uid());
create policy wallet_txn_self on public.wallet_transactions for select using (
  exists (select 1 from public.wallets w where w.id = wallet_transactions.wallet_id and w.user_id = auth.uid())
);
create policy payouts_self on public.payouts for select using (seller_id = auth.uid());

-- item_events / inspections / logistics / notifications: no anon-client access by default.
-- Ops surfaces read these server-side via the service role. Sellers get a curated view later.
create policy notifications_self on public.notifications for select using (user_id = auth.uid());

-- NOTE: staff_roles, settings writes, inspections, logistics_jobs, item_events are
-- intentionally left without permissive client policies — they are service-role only until
-- the ops console + column-level GRANT hardening migration lands.
