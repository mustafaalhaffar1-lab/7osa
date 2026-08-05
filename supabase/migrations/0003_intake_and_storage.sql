-- Hoosa - seller intake: photo storage, photo insert policy, and the create_intake RPC.

-- ---------------------------------------------------------------------------
-- Storage: public bucket for item photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "item-photos public read" on storage.objects
  for select using (bucket_id = 'item-photos');
create policy "item-photos authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'item-photos');

-- ---------------------------------------------------------------------------
-- Sellers may attach photos to their own items
-- ---------------------------------------------------------------------------
create policy item_photos_owner_insert on public.item_photos for insert with check (
  exists (select 1 from public.items i where i.id = item_photos.item_id and i.seller_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- create_intake: atomically create the item (+ photos, + pickup job) for the
-- authenticated seller. SECURITY DEFINER so it can write logistics_jobs (which is
-- service-role-only under RLS) while still deriving the seller strictly from auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.create_intake(
  p_title            text,
  p_category_id      uuid,
  p_brand            text,
  p_model            text,
  p_condition        condition_grade,
  p_possession       possession_mode,
  p_weight_kg        numeric,
  p_longest_side_cm  numeric,
  p_estimate_min     numeric,
  p_estimate_max     numeric,
  p_confidence       numeric,
  p_retail_price     numeric,
  p_seller_min_price numeric,
  p_zone_id          uuid,
  p_address          text,
  p_photo_urls       text[],
  p_pickup_from      timestamptz,
  p_pickup_to        timestamptz
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_seller uuid := auth.uid();
  v_item   uuid;
  v_url    text;
  v_status item_status;
begin
  if v_seller is null then
    raise exception 'not authenticated';
  end if;

  insert into public.items (
    seller_id, category_id, title, brand, model, condition_grade, possession, status,
    weight_kg, longest_side_cm, ai_estimate_min, ai_estimate_max, ai_confidence,
    retail_price, seller_min_price, list_price, zone_id, seller_address
  ) values (
    v_seller, p_category_id, p_title, p_brand, p_model, p_condition, p_possession, 'draft',
    p_weight_kg, p_longest_side_cm, p_estimate_min, p_estimate_max, p_confidence,
    p_retail_price, p_seller_min_price, round((p_estimate_min + p_estimate_max) / 2, 2),
    p_zone_id, p_address
  ) returning id into v_item;

  if p_photo_urls is not null then
    foreach v_url in array p_photo_urls loop
      insert into public.item_photos (item_id, url, kind) values (v_item, v_url, 'ai_intake');
    end loop;
  end if;

  -- Warehouse items are collected up front; in-place items wait for a sale.
  if p_possession = 'warehouse' then
    v_status := 'pickup_scheduled';
    insert into public.logistics_jobs (type, item_id, zone_id, status, scheduled_from, scheduled_to, address)
      values ('pickup_intake', v_item, p_zone_id, 'unassigned', p_pickup_from, p_pickup_to, p_address);
  else
    v_status := 'accepted';
  end if;

  update public.items set status = v_status where id = v_item; -- logs to item_events

  return v_item;
end $$;

revoke execute on function public.create_intake(
  text, uuid, text, text, condition_grade, possession_mode, numeric, numeric,
  numeric, numeric, numeric, numeric, numeric, uuid, text, text[], timestamptz, timestamptz
) from anon, public;
grant execute on function public.create_intake(
  text, uuid, text, text, condition_grade, possession_mode, numeric, numeric,
  numeric, numeric, numeric, numeric, numeric, uuid, text, text[], timestamptz, timestamptz
) to authenticated;
