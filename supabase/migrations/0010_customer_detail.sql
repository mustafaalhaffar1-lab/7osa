-- Hoosa - customer CRM. Staff can open a full profile per customer; admins manage staff
-- access (system users) from Settings, including granting a role by email.

create or replace function public.ops_get_customer(p_user_id uuid)
returns table (
  id uuid, email text, full_name text, phone text, created_at timestamptz,
  balance numeric, roles text[]
) language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  return query
    select u.id, u.email::text, p.full_name, p.phone, u.created_at,
      coalesce(w.balance, 0),
      coalesce(array_agg(sr.role::text) filter (where sr.role is not null), '{}')
    from auth.users u
    join public.profiles p on p.id = u.id
    left join public.wallets w on w.user_id = u.id
    left join public.staff_roles sr on sr.user_id = u.id
    where u.id = p_user_id
    group by u.id, u.email, p.full_name, p.phone, u.created_at, w.balance;
end $$;

create or replace function public.ops_grant_staff_by_email(p_email text, p_role app_role)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid;
begin
  if not public.is_admin(auth.uid()) then raise exception 'admins only'; end if;
  if p_role not in ('ops_agent','driver','admin') then raise exception 'invalid staff role'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then raise exception 'no user with that email'; end if;
  insert into public.staff_roles (user_id, role) values (v_uid, p_role) on conflict do nothing;
end $$;

revoke execute on function public.ops_get_customer(uuid) from anon, public;
revoke execute on function public.ops_grant_staff_by_email(text, app_role) from anon, public;
grant execute on function public.ops_get_customer(uuid) to authenticated;
grant execute on function public.ops_grant_staff_by_email(text, app_role) to authenticated;
