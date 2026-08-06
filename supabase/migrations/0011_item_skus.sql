-- Hoosa - permanent per-item SKU (the barcode value). Fixed for the item's whole life,
-- even as the price changes. A trigger assigns one on insert; existing items are backfilled.

create sequence if not exists public.item_sku_seq start 100001;

create or replace function public.set_item_sku()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.sku is null or new.sku = '' then
    new.sku := 'HSA-' || nextval('public.item_sku_seq');
  end if;
  return new;
end $$;

create trigger items_set_sku before insert on public.items
  for each row execute function public.set_item_sku();

-- Backfill anything created before the trigger existed.
update public.items set sku = 'HSA-' || nextval('public.item_sku_seq')
where sku is null or sku = '';
