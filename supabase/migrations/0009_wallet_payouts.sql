-- Hoosa - seller cash-out. Sellers withdraw wallet balance; admins settle the payout.
-- Funds are RESERVED on request (wallet debited immediately) so a balance can't be
-- withdrawn twice; a failed payout refunds the reservation. Every movement is ledgered.

create or replace function public.request_payout(p_amount numeric, p_method text default 'bank')
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_user   uuid := auth.uid();
  v_wallet public.wallets;
  v_payout uuid;
  v_new    numeric;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;
  if p_method not in ('bank','wallet') then raise exception 'invalid method'; end if;

  select * into v_wallet from public.wallets where user_id = v_user for update;
  if not found then raise exception 'no wallet'; end if;
  if p_amount > v_wallet.balance then raise exception 'amount exceeds available balance'; end if;

  insert into public.payouts (seller_id, amount, method, status)
    values (v_user, p_amount, p_method, 'requested') returning id into v_payout;

  v_new := v_wallet.balance - p_amount;
  update public.wallets set balance = v_new where id = v_wallet.id;
  insert into public.wallet_transactions (wallet_id, amount, type, reference_id, balance_after, memo)
    values (v_wallet.id, -p_amount, 'payout', v_payout, v_new, 'Withdrawal request');

  return v_payout;
end $$;

create or replace function public.ops_process_payout(p_payout_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_payout public.payouts;
  v_wallet public.wallets;
  v_new    numeric;
begin
  if not public.is_staff(auth.uid()) then raise exception 'not authorized'; end if;
  if p_status not in ('processing','paid','failed') then raise exception 'invalid status'; end if;

  select * into v_payout from public.payouts where id = p_payout_id for update;
  if not found then raise exception 'payout not found'; end if;
  if v_payout.status in ('paid','failed') then raise exception 'payout already finalized'; end if;

  update public.payouts set status = p_status where id = p_payout_id;

  if p_status = 'failed' then
    select * into v_wallet from public.wallets where user_id = v_payout.seller_id for update;
    v_new := v_wallet.balance + v_payout.amount;
    update public.wallets set balance = v_new where id = v_wallet.id;
    insert into public.wallet_transactions (wallet_id, amount, type, reference_id, balance_after, memo)
      values (v_wallet.id, v_payout.amount, 'refund_reversal', p_payout_id, v_new, 'Withdrawal failed - refunded');
  end if;
end $$;

revoke execute on function public.request_payout(numeric, text) from anon, public;
revoke execute on function public.ops_process_payout(uuid, text) from anon, public;
grant execute on function public.request_payout(numeric, text) to authenticated;
grant execute on function public.ops_process_payout(uuid, text) to authenticated;
