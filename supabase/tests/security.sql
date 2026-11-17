-- Kiểm thử trên cơ sở dữ liệu Supabase THỬ NGHIỆM, bằng tài khoản postgres.
-- Ví dụ: psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security.sql
-- Toàn bộ tài khoản và dữ liệu kiểm thử được ROLLBACK khi kết thúc.
begin;
insert into auth.users(id,email) values
('11111111-1111-4111-8111-111111111111','focus-buddy-test-a@example.invalid'),
('22222222-2222-4222-8222-222222222222','focus-buddy-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.ensure_profile();
select public.update_preferences('Mây Thử Nghiệm','fox','mint',false);
select public.daily_check_in('great');
select public.daily_check_in('tired');
do $$ begin
  if (select total_xp from public.profiles) <> 10 then raise exception 'FAIL: điểm danh bị cộng điểm hai lần'; end if;
  if (select count(*) from public.daily_check_ins) <> 1 then raise exception 'FAIL: trùng điểm danh'; end if;
  begin
    update public.profiles set total_xp = 9999;
    raise exception 'FAIL: học sinh có thể tự sửa XP';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.xp_transactions(user_id,source,source_id,amount)
      values('11111111-1111-4111-8111-111111111111','focus','fake',50);
    raise exception 'FAIL: học sinh có thể chèn phần thưởng';
  exception when insufficient_privilege then null; end;
  begin
    perform * from private.exercise_keys;
    raise exception 'FAIL: học sinh có thể đọc đáp án riêng tư';
  exception when insufficient_privilege then null; end;
  begin
    perform private.award_xp('11111111-1111-4111-8111-111111111111','focus','fake',50);
    raise exception 'FAIL: học sinh có thể gọi hàm cộng điểm nội bộ';
  exception when insufficient_privilege then null; end;
end; $$;
select public.submit_exercise('logic-1',0);
do $$ begin
  if (select total_xp from public.profiles) <> 10 then raise exception 'FAIL: đáp án sai được thưởng'; end if;
end; $$;
select public.submit_exercise('logic-1',2);
select public.submit_exercise('logic-1',2);
do $$ begin
  if (select total_xp from public.profiles) <> 40 then raise exception 'FAIL: thưởng bài tập không duy nhất'; end if;
end; $$;
select set_config('focus_buddy_test.session_id',public.start_focus_session()->>'id',true);
do $$ declare v_second jsonb; begin
  v_second := public.start_focus_session();
  if v_second->>'id' <> current_setting('focus_buddy_test.session_id') then raise exception 'FAIL: có hai phiên tập trung hoạt động'; end if;
  begin
    perform public.complete_focus_session(current_setting('focus_buddy_test.session_id')::uuid);
    raise exception 'FAIL: phiên chưa đủ 20 phút vẫn nhận điểm';
  exception when invalid_parameter_value then null; end;
end; $$;

-- Chỉ quản trị viên kiểm thử điều chỉnh đồng hồ dữ liệu; người học không có quyền này.
reset role;
update public.focus_sessions set started_at = now() - interval '21 minutes', ends_at = now() - interval '1 minute'
  where id = current_setting('focus_buddy_test.session_id')::uuid;
set local role authenticated;
select public.complete_focus_session(current_setting('focus_buddy_test.session_id')::uuid);
select public.complete_focus_session(current_setting('focus_buddy_test.session_id')::uuid);
do $$ begin
  if (select total_xp from public.profiles) <> 90 then raise exception 'FAIL: thưởng tập trung không duy nhất'; end if;
  if (select count(*) from public.xp_transactions) <> 3 then raise exception 'FAIL: sai số giao dịch XP'; end if;
  if exists(select 1 from public.get_leaderboard() where display_name = 'Mây Thử Nghiệm') then raise exception 'FAIL: học sinh chưa đồng ý đã xuất hiện trên bảng xếp hạng'; end if;
end; $$;
select public.update_preferences('Mây Thử Nghiệm','fox','mint',true);
do $$ begin
  if not exists(select 1 from public.get_leaderboard() where display_name = 'Mây Thử Nghiệm' and total_xp = 90) then
    raise exception 'FAIL: thiếu học sinh đã đồng ý tham gia bảng xếp hạng';
  end if;
end; $$;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select public.ensure_profile();
do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: RLS lộ hồ sơ người khác'; end if;
  if exists(select 1 from public.xp_transactions) then raise exception 'FAIL: RLS lộ giao dịch người khác'; end if;
  if exists(select 1 from public.focus_sessions) then raise exception 'FAIL: RLS lộ phiên người khác'; end if;
  if exists(select 1 from public.daily_check_ins) then raise exception 'FAIL: RLS lộ cảm xúc người khác'; end if;
  if exists(select 1 from public.exercise_assessments) then raise exception 'FAIL: RLS lộ kết quả bài tập người khác'; end if;
  if exists(select 1 from public.student_achievements) then raise exception 'FAIL: RLS lộ thành tích người khác'; end if;
  if jsonb_array_length(public.get_progress()->'completed_exercises') <> 0 then raise exception 'FAIL: RPC lộ tiến độ người khác'; end if;
  begin
    perform public.complete_focus_session(current_setting('focus_buddy_test.session_id')::uuid);
    raise exception 'FAIL: học sinh hoàn thành phiên của người khác';
  exception when invalid_parameter_value then null; end;
end; $$;

select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.update_preferences('Mây Thử Nghiệm','owl','lavender',false);
do $$ begin
  if exists(select 1 from public.get_leaderboard() where display_name = 'Mây Thử Nghiệm') then
    raise exception 'FAIL: rút đồng ý nhưng vẫn xuất hiện trên bảng xếp hạng';
  end if;
end; $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  begin
    perform public.ensure_profile();
    raise exception 'FAIL: khách chưa đăng nhập có thể tạo hồ sơ';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
rollback;
select 'Đã vượt qua kiểm thử phân quyền, quyền riêng tư, phần thưởng duy nhất và xác minh thời gian.' as ket_qua;
