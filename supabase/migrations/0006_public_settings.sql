-- 7osa - expose only the non-sensitive, buyer-facing config keys for the storefront
-- (markdown schedule + concierge value floor). All other settings stay service-role only.
create policy settings_public_read on public.settings for select
  using (key in ('markdown_clock', 'value_floor'));
