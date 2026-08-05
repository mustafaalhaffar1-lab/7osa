-- Hoosa - real engagement signals: views + saves per item.
-- These power "N viewed / N saved / selling fast" across the storefront. Counters are
-- public-writable via RPCs (anonymous browsing must count); acceptable for MVP - a
-- rate-limited edge proxy can front these later without changing callers.

create table public.item_metrics (
  item_id    uuid primary key references public.items(id) on delete cascade,
  views      integer not null default 0,
  saves      integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.item_metrics enable row level security;
create policy item_metrics_public_read on public.item_metrics for select using (true);

create or replace function public.record_item_view(p_item_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.item_metrics (item_id, views) values (p_item_id, 1)
  on conflict (item_id) do update
    set views = item_metrics.views + 1, updated_at = now();
end $$;

create or replace function public.record_item_save(p_item_id uuid, p_delta integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_delta not in (-1, 1) then
    raise exception 'delta must be -1 or 1';
  end if;
  insert into public.item_metrics (item_id, saves) values (p_item_id, greatest(p_delta, 0))
  on conflict (item_id) do update
    set saves = greatest(0, item_metrics.saves + p_delta), updated_at = now();
end $$;

grant execute on function public.record_item_view(uuid) to anon, authenticated;
grant execute on function public.record_item_save(uuid, integer) to anon, authenticated;
