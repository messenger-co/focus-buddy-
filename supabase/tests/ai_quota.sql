begin;
insert into auth.users(id,email) values('11111111-1111-4111-8111-111111111111','quota-test@example.test');
do $$
declare i integer; result jsonb;
begin
 for i in 1..21 loop
  result := public.consume_ai_quota('11111111-1111-4111-8111-111111111111');
  if (result->>'allowed')::boolean <> (i <= 20) then raise exception 'Hạn mức sai ở lượt %',i; end if;
 end loop;
end $$;
set local role authenticated;
do $$
begin
 begin
  perform public.consume_ai_quota('11111111-1111-4111-8111-111111111111');
  raise exception 'Tài khoản học sinh gọi được bộ đếm';
 exception when insufficient_privilege then null;
 end;
end $$;
rollback;
