-- Hoosa - admin console: staff visibility across the business, admin-gated config writes,
-- and RPCs for the actions the ops UI needs (orders, pricing, users, roles).
-- Model: ops_agent/driver = operate; admin = operate + configure (settings, tiers, zones,
-- categories, staff roles).

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = uid and role = 'admin');
$$;
revoke execute on function public.is_admin(uuid) from anon;

-- ---------------------------------------------------------------------------
-- Staff read access for the dashboard/reports
-- ---------------------------------------------------------------------------
create policy orders_staff_read     on public.orders              for select using (public.is_staff(auth.uid()));
create policy wallets_staff_read    on public.wallets             for select using (public.is_staff(auth.uid()));
create policy wallet_txn_staff_read on public.wallet_transactions for select using (public.is_staff(auth.uid()));
create policy payouts_staff_read    on public.payouts             for select using (public.is_staff(auth.uid()));
create policy offers_staff_read     on public.offers              for select using (public.is_staff(auth.uid()));
create policy profiles_staff_read   on public.profiles            for select using (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- Admin config writes (settings, commission tiers, zones, categories)
-- ---------------------------------------------------------------------------
create policy settings_admin_update on public.settings for update
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy settings_admin_insert on public.settings for insert
  with check (public.is_admin(auth.uid()));

create policy tiers_admin_write on public.commission_tiers for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy zones_admin_write on public.zones for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy categories_admin_write on public.categories for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Staff can read ALL settings (public policy only exposes two keys)
create policy settings_staff_read on public.settings for select using (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- ops_set_price: manual reprice, logged to price_history
-- ---------------------------------------------------------------------------
create or replace function public.ops_set_price(p_item_id uuid, p_price numeric)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  if p_price is null or p_price <= 0 then raise exception 'invalid price'; end if;
  update public.items set list_price = p_price where id = p_item_id;
  insert into public.price_history (item_id, price, reason) values (p_item_id, p_price, 'manual');
end $$;

-- ---------------------------------------------------------------------------
-- ops_set_order_status: advance an order and keep the item lifecycle in sync
-- ---------------------------------------------------------------------------
create or replace function public.ops_set_order_status(p_order_id uuid, p_status order_status)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_item uuid;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  update public.orders set status = p_status where id = p_order_id returning item_id into v_item;
  if not found then raise exception 'order not found'; end if;
  if p_status = 'fulfilling' then
    update public.items set status = 'in_transit' where id = v_item;
    update public.logistics_jobs set status = 'en_route'
      where order_id = p_order_id and type = 'delivery' and status in ('unassigned','assigned');
  elsif p_status = 'delivered' then
    update public.items set status = 'delivered' where id = v_item;
    update public.logistics_jobs set status = 'completed'
      where order_id = p_order_id and type = 'delivery' and status <> 'completed';
  elsif p_status = 'completed' then
    update public.items set status = 'completed' where id = v_item;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ops_list_users: the user directory (auth emails + business stats)
-- ---------------------------------------------------------------------------
create or replace function public.ops_list_users()
returns table (
  id uuid, email text, full_name text, created_at timestamptz,
  balance numeric, items_count bigint, orders_count bigint, roles text[]
) language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  return query
    select u.id, u.email::text, p.full_name, u.created_at,
      coalesce(w.balance, 0),
      (select count(*) from public.items i where i.seller_id = u.id),
      (select count(*) from public.orders o where o.buyer_id = u.id),
      coalesce(array_agg(sr.role::text) filter (where sr.role is not null), '{}')
    from auth.users u
    join public.profiles p on p.id = u.id
    left join public.wallets w on w.user_id = u.id
    left join public.staff_roles sr on sr.user_id = u.id
    group by u.id, u.email, p.full_name, u.created_at, w.balance
    order by u.created_at desc;
end $$;

-- ---------------------------------------------------------------------------
-- ops_set_staff_role: grant/revoke staff roles (admins only)
-- ---------------------------------------------------------------------------
create or replace function public.ops_set_staff_role(p_user_id uuid, p_role app_role, p_grant boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admins only'; end if;
  if p_role not in ('ops_agent','driver','admin') then raise exception 'invalid staff role'; end if;
  if p_grant then
    insert into public.staff_roles (user_id, role) values (p_user_id, p_role) on conflict do nothing;
  else
    if p_user_id = auth.uid() and p_role = 'admin' then
      raise exception 'cannot remove your own admin role';
    end if;
    delete from public.staff_roles where user_id = p_user_id and role = p_role;
  end if;
end $$;

revoke execute on function public.ops_set_price(uuid, numeric) from anon, public;
revoke execute on function public.ops_set_order_status(uuid, order_status) from anon, public;
revoke execute on function public.ops_list_users() from anon, public;
revoke execute on function public.ops_set_staff_role(uuid, app_role, boolean) from anon, public;
grant execute on function public.ops_set_price(uuid, numeric) to authenticated;
grant execute on function public.ops_set_order_status(uuid, order_status) to authenticated;
grant execute on function public.ops_list_users() to authenticated;
grant execute on function public.ops_set_staff_role(uuid, app_role, boolean) to authenticated;
