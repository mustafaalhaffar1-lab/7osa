-- Hoosa - "book a visit": a Hoosa agent comes to the seller's home, evaluates, and takes
-- whatever qualifies. AED 50 booking fee that is CREDITED BACK on the seller's first sale
-- (no-show protection without friction at the decision moment).

create table public.pickup_visits (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references public.profiles(id) on delete cascade,
  zone_id        uuid references public.zones(id) on delete set null,
  address        text not null,
  scheduled_date date not null,
  slot           text not null check (slot in ('morning','afternoon','evening')),
  notes          text,
  status         text not null default 'requested'
                   check (status in ('requested','scheduled','en_route','completed','cancelled')),
  agent_id       uuid references public.profiles(id) on delete set null,
  fee_amount     numeric(12,2) not null default 50,
  fee_status     text not null default 'pending'
                   check (fee_status in ('pending','credited','charged','waived')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index pickup_visits_seller_idx on public.pickup_visits(seller_id);
create index pickup_visits_status_idx on public.pickup_visits(status);

create trigger pickup_visits_set_updated_at before update on public.pickup_visits
  for each row execute function public.set_updated_at();

alter table public.pickup_visits enable row level security;

create policy visits_owner_read on public.pickup_visits for select using (seller_id = auth.uid());
create policy visits_staff_read on public.pickup_visits for select using (public.is_staff(auth.uid()));

-- Seller books a visit for themselves.
create or replace function public.book_pickup_visit(
  p_zone_id uuid, p_address text, p_date date, p_slot text, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_address is null or btrim(p_address) = '' then raise exception 'address required'; end if;
  if p_date < current_date then raise exception 'pick a future date'; end if;
  if p_slot not in ('morning','afternoon','evening') then raise exception 'invalid slot'; end if;

  insert into public.pickup_visits (seller_id, zone_id, address, scheduled_date, slot, notes)
    values (v_user, p_zone_id, btrim(p_address), p_date, p_slot, nullif(btrim(coalesce(p_notes,'')), ''))
    returning id into v_id;
  return v_id;
end $$;

-- Staff moves a visit through its lifecycle.
create or replace function public.ops_set_visit_status(p_visit_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  if p_status not in ('requested','scheduled','en_route','completed','cancelled') then
    raise exception 'invalid status';
  end if;
  update public.pickup_visits set status = p_status, agent_id = coalesce(agent_id, auth.uid())
    where id = p_visit_id;
  if not found then raise exception 'visit not found'; end if;
end $$;

revoke execute on function public.book_pickup_visit(uuid, text, date, text, text) from anon, public;
revoke execute on function public.ops_set_visit_status(uuid, text) from anon, public;
grant execute on function public.book_pickup_visit(uuid, text, date, text, text) to authenticated;
grant execute on function public.ops_set_visit_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Credit the visit fee back on the seller's first sale.
-- ---------------------------------------------------------------------------
create or replace function public.purchase_item(p_item_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_buyer   uuid := auth.uid();
  v_item    public.items;
  v_c       record;
  v_order   uuid;
  v_wallet  uuid;
  v_balance numeric;
  v_visit   public.pickup_visits;
begin
  if v_buyer is null then raise exception 'not authenticated'; end if;

  select * into v_item from public.items where id = p_item_id for update;
  if not found then raise exception 'item not found'; end if;
  if v_item.status <> 'listed' then raise exception 'item is not available'; end if;
  if v_item.seller_id = v_buyer then raise exception 'cannot buy your own item'; end if;
  if v_item.list_price is null then raise exception 'item has no price'; end if;

  select * into v_c from public.calc_commission(v_item.list_price);

  insert into public.orders (item_id, buyer_id, sale_price, commission_pct, commission_amount, seller_payout, status, payment_method)
    values (p_item_id, v_buyer, v_item.list_price, v_c.marketplace_pct, v_c.marketplace_amount, v_c.seller_payout, 'paid', 'card')
    returning id into v_order;

  update public.items set status = 'sold' where id = p_item_id;

  update public.wallets set balance = balance + v_c.seller_payout
    where user_id = v_item.seller_id
    returning id, balance into v_wallet, v_balance;
  insert into public.wallet_transactions (wallet_id, amount, type, reference_id, balance_after, memo)
    values (v_wallet, v_c.seller_payout, 'sale_credit', v_order, v_balance, 'Sale: ' || v_item.title);

  -- First sale? Refund the AED 50 visit fee as promised.
  select * into v_visit from public.pickup_visits
    where seller_id = v_item.seller_id and fee_status = 'pending' and status = 'completed'
    order by created_at limit 1;
  if found then
    update public.wallets set balance = balance + v_visit.fee_amount
      where id = v_wallet returning balance into v_balance;
    insert into public.wallet_transactions (wallet_id, amount, type, reference_id, balance_after, memo)
      values (v_wallet, v_visit.fee_amount, 'bonus', v_visit.id, v_balance, 'Pickup visit fee credited back');
    update public.pickup_visits set fee_status = 'credited' where id = v_visit.id;
  end if;

  insert into public.logistics_jobs (type, item_id, order_id, zone_id, status)
    values ('delivery', p_item_id, v_order, v_item.zone_id, 'unassigned');

  return v_order;
end $$;
