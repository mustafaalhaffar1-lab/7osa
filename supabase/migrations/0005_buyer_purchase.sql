-- Hoosa - buyer storefront: let buyers read the inspection report on live items, and buy.

-- Condition reports are a core trust signal on the PDP - readable for live items.
create policy inspections_public_read on public.inspections for select using (
  exists (select 1 from public.items i where i.id = inspections.item_id and i.status in ('listed','reserved'))
);

-- ---------------------------------------------------------------------------
-- purchase_item: atomic checkout for the authenticated buyer.
-- Creates the order (commission split from calc_commission), marks the item sold,
-- credits the seller's wallet, and books a delivery job. SECURITY DEFINER so it can
-- write the seller's wallet + logistics while deriving the buyer from auth.uid().
-- MVP: settles the wallet instantly; real escrow releases on delivery confirmation.
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

  insert into public.logistics_jobs (type, item_id, order_id, zone_id, status)
    values ('delivery', p_item_id, v_order, v_item.zone_id, 'unassigned');

  return v_order;
end $$;

revoke execute on function public.purchase_item(uuid) from anon, public;
grant execute on function public.purchase_item(uuid) to authenticated;
