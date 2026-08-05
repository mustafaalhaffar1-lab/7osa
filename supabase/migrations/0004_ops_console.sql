-- 7osa - ops console: let staff read the whole board and advance items through the lifecycle.
-- Reads use staff RLS policies (is_staff); mutations use staff-gated SECURITY DEFINER RPCs,
-- so the internal console works on the anon key + a staff session (no service-role key needed).

-- ---------------------------------------------------------------------------
-- Staff read access across the operational tables
-- ---------------------------------------------------------------------------
create policy staff_roles_self_read on public.staff_roles for select using (user_id = auth.uid());
create policy items_staff_read      on public.items          for select using (public.is_staff(auth.uid()));
create policy item_photos_staff_read on public.item_photos   for select using (public.is_staff(auth.uid()));
create policy logistics_staff_read  on public.logistics_jobs for select using (public.is_staff(auth.uid()));
create policy inspections_staff_read on public.inspections   for select using (public.is_staff(auth.uid()));
create policy item_events_staff_read on public.item_events   for select using (public.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- Ops actions (staff only). Transition validity is enforced in the app layer
-- (item-state.ts); these guard authorization and keep side effects atomic.
-- ---------------------------------------------------------------------------
create or replace function public.ops_set_status(p_item_id uuid, p_to item_status)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  update public.items set status = p_to where id = p_item_id;
  -- Collecting an item closes its intake pickup job.
  if p_to = 'collected' then
    update public.logistics_jobs set status = 'completed'
      where item_id = p_item_id and type = 'pickup_intake' and status <> 'completed';
  end if;
end $$;

create or replace function public.ops_record_inspection(
  p_item_id uuid, p_condition condition_grade, p_functional boolean, p_data_wipe boolean, p_notes text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  insert into public.inspections (item_id, inspector_id, condition_grade, functional_test_passed, data_wipe_certified, notes)
    values (p_item_id, auth.uid(), p_condition, p_functional, p_data_wipe, p_notes);
  update public.items set condition_grade = p_condition, status = 'inspected' where id = p_item_id;
end $$;

create or replace function public.ops_list_item(p_item_id uuid, p_list_price numeric)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_days int;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  select coalesce((value->>'days_to_first_drop')::int, 14) into v_days
    from public.settings where key = 'markdown_clock';
  update public.items
    set list_price = p_list_price, status = 'listed', listed_at = now(),
        sell_by = now() + (coalesce(v_days, 14) || ' days')::interval
    where id = p_item_id;
  insert into public.price_history (item_id, price, reason) values (p_item_id, p_list_price, 'initial');
end $$;

revoke execute on function public.ops_set_status(uuid, item_status) from anon, public;
revoke execute on function public.ops_record_inspection(uuid, condition_grade, boolean, boolean, text) from anon, public;
revoke execute on function public.ops_list_item(uuid, numeric) from anon, public;
grant execute on function public.ops_set_status(uuid, item_status) to authenticated;
grant execute on function public.ops_record_inspection(uuid, condition_grade, boolean, boolean, text) to authenticated;
grant execute on function public.ops_list_item(uuid, numeric) to authenticated;
