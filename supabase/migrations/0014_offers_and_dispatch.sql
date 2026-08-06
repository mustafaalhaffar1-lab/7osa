-- Hoosa - close three loops: accepting offers, working visits, dispatching logistics jobs.
--
-- settle_sale() is extracted so a direct purchase and an accepted offer settle through the
-- SAME code path (order + commission split + seller credit + visit-fee credit + delivery job).
-- Two implementations of money movement would inevitably drift; one cannot.

create or replace function public.settle_sale(p_item_id uuid, p_buyer uuid, p_price numeric)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_item public.items; v_c record; v_order uuid;
  v_wallet uuid; v_balance numeric; v_visit public.pickup_visits;
begin
  select * into v_item from public.items where id = p_item_id for update;
  if not found then raise exception 'item not found'; end if;
  if v_item.status <> 'listed' then raise exception 'item is not available'; end if;
  if v_item.seller_id = p_buyer then raise exception 'cannot buy your own item'; end if;
  if p_price is null or p_price <= 0 then raise exception 'invalid price'; end if;

  select * into v_c from public.calc_commission(p_price);

  insert into public.orders (item_id, buyer_id, sale_price, commission_pct, commission_amount, seller_payout, status, payment_method)
    values (p_item_id, p_buyer, p_price, v_c.marketplace_pct, v_c.marketplace_amount, v_c.seller_payout, 'paid', 'card')
    returning id into v_order;

  update public.items set status = 'sold' where id = p_item_id;

  update public.wallets set balance = balance + v_c.seller_payout
    where user_id = v_item.seller_id returning id, balance into v_wallet, v_balance;
  insert into public.wallet_transactions (wallet_id, amount, type, reference_id, balance_after, memo)
    values (v_wallet, v_c.seller_payout, 'sale_credit', v_order, v_balance, 'Sale: ' || v_item.title);

  -- First sale after a completed visit? Credit the AED 50 back as promised.
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
revoke execute on function public.settle_sale(uuid, uuid, numeric) from anon, authenticated, public;

create or replace function public.purchase_item(p_item_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_buyer uuid := auth.uid(); v_item public.items;
begin
  if v_buyer is null then raise exception 'not authenticated'; end if;
  select * into v_item from public.items where id = p_item_id;
  if not found then raise exception 'item not found'; end if;
  if v_item.list_price is null then raise exception 'item has no price'; end if;
  return public.settle_sale(p_item_id, v_buyer, v_item.list_price);
end $$;

-- ---------------------------------------------------------------------------
-- Offers: staff accept (sells at the offer price) or decline.
-- ---------------------------------------------------------------------------
create or replace function public.ops_accept_offer(p_offer_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_offer public.offers; v_item public.items; v_order uuid;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'offer not found'; end if;
  if v_offer.status <> 'pending' then raise exception 'offer is no longer pending'; end if;

  select * into v_item from public.items where id = v_offer.item_id;
  if v_item.seller_min_price is not null and v_offer.amount < v_item.seller_min_price then
    raise exception 'offer is below the seller''s minimum price';
  end if;

  v_order := public.settle_sale(v_offer.item_id, v_offer.buyer_id, v_offer.amount);

  update public.offers set status = 'accepted' where id = p_offer_id;
  update public.offers set status = 'rejected'
    where item_id = v_offer.item_id and id <> p_offer_id and status = 'pending';
  insert into public.price_history (item_id, price, reason)
    values (v_offer.item_id, v_offer.amount, 'offer_accepted');
  return v_order;
end $$;

create or replace function public.ops_decline_offer(p_offer_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  update public.offers set status = 'rejected' where id = p_offer_id and status = 'pending';
  if not found then raise exception 'offer not found or not pending'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Logistics dispatch: assign a job to a driver and move it along.
-- ---------------------------------------------------------------------------
create or replace function public.ops_assign_job(p_job_id uuid, p_driver_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  update public.logistics_jobs
    set driver_id = p_driver_id,
        status = case when status = 'unassigned' then 'assigned' else status end
    where id = p_job_id;
  if not found then raise exception 'job not found'; end if;
end $$;

create or replace function public.ops_set_job_status(p_job_id uuid, p_status logistics_job_status)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_job public.logistics_jobs;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  select * into v_job from public.logistics_jobs where id = p_job_id;
  if not found then raise exception 'job not found'; end if;

  update public.logistics_jobs set status = p_status where id = p_job_id;

  -- Keep the item lifecycle honest when a job completes.
  if p_status = 'completed' and v_job.item_id is not null then
    if v_job.type = 'pickup_intake' then
      update public.items set status = 'collected' where id = v_job.item_id and status = 'pickup_scheduled';
    elsif v_job.type = 'pickup_on_sale' then
      update public.items set status = 'collected' where id = v_job.item_id and status = 'collection_scheduled';
    elsif v_job.type = 'delivery' then
      update public.items set status = 'delivered' where id = v_job.item_id;
      update public.orders set status = 'delivered' where id = v_job.order_id and status <> 'completed';
    end if;
  end if;
end $$;

revoke execute on function public.ops_accept_offer(uuid) from anon, public;
revoke execute on function public.ops_decline_offer(uuid) from anon, public;
revoke execute on function public.ops_assign_job(uuid, uuid) from anon, public;
revoke execute on function public.ops_set_job_status(uuid, logistics_job_status) from anon, public;
grant execute on function public.ops_accept_offer(uuid) to authenticated;
grant execute on function public.ops_decline_offer(uuid) to authenticated;
grant execute on function public.ops_assign_job(uuid, uuid) to authenticated;
grant execute on function public.ops_set_job_status(uuid, logistics_job_status) to authenticated;

-- Drivers need to see the jobs assigned to them.
create policy logistics_driver_read on public.logistics_jobs for select using (driver_id = auth.uid());
