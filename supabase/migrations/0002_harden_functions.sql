-- 7osa - function hardening (addresses Supabase security advisors)
-- 1. Pin search_path on trigger/util functions (prevents search_path injection).
-- 2. Revoke RPC EXECUTE on internal SECURITY DEFINER functions. handle_new_user only ever
--    runs from the auth.users trigger (trigger execution does not need EXECUTE), and is_staff
--    is only needed by authenticated policy checks - never by anon.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.log_item_status_change() set search_path = public, pg_temp;
alter function public.calc_commission(numeric) set search_path = public, pg_temp;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.is_staff(uuid) from anon;
