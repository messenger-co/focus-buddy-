begin;
create table private.ai_quotas (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null,
 requests integer not null check(requests between 1 and 20)
);
alter table private.ai_quotas enable row level security;
revoke all on private.ai_quotas from public, anon, authenticated;
create function public.consume_ai_quota(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare q private.ai_quotas; t timestamptz := clock_timestamp();
begin
 if p_user_id is null then raise exception 'Thiếu tài khoản.'; end if;
 insert into private.ai_quotas values(p_user_id,t,1)
 on conflict(user_id) do update set
 window_start = case when private.ai_quotas.window_start <= t - interval '1 hour' then t else private.ai_quotas.window_start end,
 requests = case when private.ai_quotas.window_start <= t - interval '1 hour' then 1 else private.ai_quotas.requests + 1 end
 where private.ai_quotas.window_start <= t - interval '1 hour' or private.ai_quotas.requests < 20
 returning * into q;
 if found then return jsonb_build_object('allowed',true,'retryAfter',0); end if;
 select * into q from private.ai_quotas where user_id=p_user_id;
 return jsonb_build_object('allowed',false,'retryAfter',greatest(1,ceil(extract(epoch from(q.window_start + interval '1 hour' - t)))));
end; $$;
revoke all on function public.consume_ai_quota(uuid) from public,anon,authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;
commit;
