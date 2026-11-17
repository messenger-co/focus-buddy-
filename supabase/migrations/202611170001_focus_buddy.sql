-- Focus Buddy 2.0 — dữ liệu học tập, phân quyền và phần thưởng do máy chủ xác minh.
-- Chạy một lần bằng Supabase SQL Editor hoặc `supabase db push`.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 3 and 24),
  companion text not null default 'fox' check (companion in ('fox','owl','cat')),
  color text not null default 'mint' check (color in ('mint','lavender','peach')),
  leaderboard_opt_in boolean not null default false,
  total_xp integer not null default 0 check (total_xp >= 0),
  level integer generated always as (total_xp / 100 + 1) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_check_ins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  mood text not null check (mood in ('great','okay','tired')),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  completed_at timestamptz,
  cancelled_at timestamptz,
  constraint focus_duration check (ends_at = started_at + interval '20 minutes'),
  constraint focus_status_dates check (
    (status = 'active' and completed_at is null and cancelled_at is null)
    or (status = 'completed' and completed_at is not null and cancelled_at is null)
    or (status = 'cancelled' and completed_at is null and cancelled_at is not null)
  )
);
create unique index one_active_focus_per_student on public.focus_sessions(user_id) where status = 'active';
create index focus_by_student on public.focus_sessions(user_id, started_at desc);

create table public.exercises (
  id text primary key,
  subject text not null,
  title text not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  reward_xp integer not null default 30 check (reward_xp between 1 and 100)
);
create table private.exercise_keys (
  exercise_id text primary key references public.exercises(id) on delete cascade,
  correct_answer integer not null check (correct_answer between 0 and 3),
  explanation text not null
);

insert into public.exercises(id,subject,title,question,options) values
('logic-1','Tư duy','Quy luật những con số','Số tiếp theo trong dãy 2, 4, 8, … là gì?','["10","12","16","18"]'),
('science-1','Khoa học','Nguồn năng lượng của cây','Cây cần nguồn năng lượng nào để quang hợp?','["Ôxy","Ánh sáng mặt trời","Cát","Âm thanh"]'),
('language-1','Tiếng Việt','Từ ngữ quanh em','Từ nào đồng nghĩa với “chăm chỉ”?','["Siêng năng","Vội vàng","Lười biếng","Chậm chạp"]');
insert into private.exercise_keys(exercise_id,correct_answer,explanation) values
('logic-1',2,'Mỗi số gấp đôi số đứng trước: 2 → 4 → 8 → 16.'),
('science-1',1,'Cây dùng năng lượng từ ánh sáng mặt trời để biến nước và khí cacbonic thành chất dinh dưỡng.'),
('language-1',0,'“Siêng năng” và “chăm chỉ” đều nói về sự cần mẫn, chịu khó học tập hoặc làm việc.');

create table public.exercise_assessments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null references public.exercises(id),
  last_answer integer not null check (last_answer between 0 and 3),
  last_correct boolean not null,
  attempts integer not null default 1 check (attempts > 0),
  first_correct_at timestamptz,
  last_attempt_at timestamptz not null default now(),
  primary key(user_id, exercise_id)
);

create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('checkin','focus','exercise')),
  source_id text not null,
  amount integer not null check (amount > 0 and amount <= 100),
  created_at timestamptz not null default now(),
  unique(user_id,source,source_id)
);
create index xp_by_student on public.xp_transactions(user_id,created_at desc);

create table public.missions (
  id text primary key,
  title text not null,
  description text not null,
  metric text not null check(metric in ('focus','exercise','checkin')),
  target integer not null check(target > 0),
  reward_xp integer not null check(reward_xp >= 0)
);
insert into public.missions values
('focus-first','Một khoảng tập trung','Hoàn thành một phiên tập trung 20 phút.','focus',1,50),
('exercise-first','Khám phá điều mới','Giải đúng một bài luyện tập.','exercise',1,30),
('checkin-first','Lắng nghe bản thân','Chia sẻ cảm xúc của bạn hôm nay.','checkin',1,10);

create table public.achievement_definitions (
  id text primary key,
  title text not null,
  description text not null,
  metric text not null check(metric in ('focus','exercise','checkin','xp')),
  target integer not null check(target > 0)
);
insert into public.achievement_definitions values
('first-step','Bước đầu tiên','Hoàn thành lần điểm danh đầu tiên.','checkin',1),
('deep-focus','Tập trung hết mình','Hoàn thành một phiên tập trung 20 phút.','focus',1),
('curious-mind','Nhà khám phá','Giải đúng cả ba bài luyện tập.','exercise',3),
('growing-star','Ngôi sao đang lớn','Tích lũy 100 điểm kinh nghiệm.','xp',100);
create table public.student_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievement_definitions(id),
  earned_at timestamptz not null default now(),
  primary key(user_id,achievement_id)
);

-- Mặc định không cấp quyền ghi trực tiếp. Mọi thay đổi đi qua hàm đã kiểm tra auth.uid().
alter table public.profiles enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.exercise_assessments enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.student_achievements enable row level security;
alter table public.exercises enable row level security;
alter table public.missions enable row level security;
alter table public.achievement_definitions enable row level security;
alter table private.exercise_keys enable row level security;

create policy profiles_read_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy checkins_read_own on public.daily_check_ins for select to authenticated using (user_id = (select auth.uid()));
create policy focus_read_own on public.focus_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy assessments_read_own on public.exercise_assessments for select to authenticated using (user_id = (select auth.uid()));
create policy xp_read_own on public.xp_transactions for select to authenticated using (user_id = (select auth.uid()));
create policy achievements_read_own on public.student_achievements for select to authenticated using (user_id = (select auth.uid()));
create policy exercises_read on public.exercises for select to anon, authenticated using (true);
create policy missions_read on public.missions for select to anon, authenticated using (true);
create policy achievement_definitions_read on public.achievement_definitions for select to anon, authenticated using (true);

revoke all on public.profiles, public.daily_check_ins, public.focus_sessions, public.exercise_assessments,
  public.xp_transactions, public.student_achievements, public.exercises, public.missions,
  public.achievement_definitions from public, anon, authenticated;
grant select on public.profiles, public.daily_check_ins, public.focus_sessions, public.exercise_assessments,
  public.xp_transactions, public.student_achievements to authenticated;
grant select on public.exercises, public.missions, public.achievement_definitions to anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

create function public.ensure_profile() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_profile public.profiles;
begin
  if v_user is null then raise exception 'Bạn cần đăng nhập.' using errcode = '28000'; end if;
  insert into public.profiles(id,display_name) values(v_user,'Bạn nhỏ ' || substr(v_user::text,1,8)) on conflict(id) do nothing;
  select * into v_profile from public.profiles where id = v_user;
  return v_profile;
end; $$;

-- Chỉ các hàm nội bộ gọi được hàm này. Khóa hồ sơ ngăn hai yêu cầu cộng điểm đồng thời.
create function private.award_xp(p_user uuid,p_source text,p_source_id text,p_amount integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_inserted integer;
begin
  perform 1 from public.profiles where id = p_user for update;
  insert into public.xp_transactions(user_id,source,source_id,amount)
    values(p_user,p_source,p_source_id,p_amount) on conflict(user_id,source,source_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    update public.profiles set total_xp = total_xp + p_amount, updated_at = now() where id = p_user;
    return p_amount;
  end if;
  return 0;
end; $$;

create function private.sync_achievements(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.student_achievements(user_id,achievement_id)
  select p_user,a.id from public.achievement_definitions a where a.target <=
    case a.metric
      when 'focus' then (select count(*) from public.focus_sessions where user_id = p_user and status = 'completed')
      when 'exercise' then (select count(*) from public.exercise_assessments where user_id = p_user and first_correct_at is not null)
      when 'checkin' then (select count(*) from public.daily_check_ins where user_id = p_user)
      when 'xp' then (select total_xp from public.profiles where id = p_user)
    end
  on conflict(user_id,achievement_id) do nothing;
end; $$;

create function public.update_preferences(p_display_name text,p_companion text,p_color text,p_leaderboard_opt_in boolean)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_profile public.profiles;
begin
  perform public.ensure_profile();
  if p_display_name is null or char_length(trim(p_display_name)) not between 3 and 24
    or p_display_name ~ '[[:cntrl:]]'
    or p_companion is null or p_companion not in ('fox','owl','cat')
    or p_color is null or p_color not in ('mint','lavender','peach')
    or p_leaderboard_opt_in is null then
    raise exception 'Vui lòng chọn biệt danh từ 3–24 ký tự và tùy chọn hợp lệ.' using errcode = '22023';
  end if;
  update public.profiles set display_name = trim(p_display_name), companion = p_companion, color = p_color,
    leaderboard_opt_in = p_leaderboard_opt_in, updated_at = now() where id = v_user returning * into v_profile;
  return v_profile;
end; $$;

create function public.daily_check_in(p_mood text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_day date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_awarded integer; v_inserted integer; v_profile public.profiles;
begin
  perform public.ensure_profile();
  if p_mood is null or p_mood not in ('great','okay','tired') then
    raise exception 'Cảm xúc chưa hợp lệ.' using errcode = '22023';
  end if;
  perform 1 from public.profiles where id = v_user for update;
  insert into public.daily_check_ins(user_id,day,mood) values(v_user,v_day,p_mood) on conflict(user_id,day) do nothing;
  get diagnostics v_inserted = row_count;
  v_awarded := case when v_inserted = 1 then private.award_xp(v_user,'checkin',v_day::text,10) else 0 end;
  perform private.sync_achievements(v_user);
  select * into v_profile from public.profiles where id = v_user;
  return jsonb_build_object('awarded_xp',v_awarded,'total_xp',v_profile.total_xp,'level',v_profile.level);
end; $$;

create function public.start_focus_session() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_session public.focus_sessions;
begin
  perform public.ensure_profile();
  perform 1 from public.profiles where id = v_user for update;
  -- Tự đóng phiên bị bỏ quên quá một ngày; không thưởng cho phiên hết hạn.
  update public.focus_sessions set status = 'cancelled', cancelled_at = now()
    where user_id = v_user and status = 'active' and started_at < now() - interval '24 hours';
  select * into v_session from public.focus_sessions where user_id = v_user and status = 'active';
  if not found then
    insert into public.focus_sessions(user_id,started_at,ends_at) values(v_user,now(),now() + interval '20 minutes') returning * into v_session;
  end if;
  return jsonb_build_object('id',v_session.id,'started_at',v_session.started_at,'ends_at',v_session.ends_at);
end; $$;

create function public.complete_focus_session(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_session public.focus_sessions; v_awarded integer := 0; v_profile public.profiles;
begin
  perform public.ensure_profile();
  perform 1 from public.profiles where id = v_user for update;
  select * into v_session from public.focus_sessions where id = p_session_id and user_id = v_user for update;
  if not found then raise exception 'Không tìm thấy phiên tập trung của bạn.' using errcode = '22023'; end if;
  if v_session.status = 'cancelled' then raise exception 'Phiên này đã được kết thúc sớm.' using errcode = '22023'; end if;
  if v_session.status = 'active' then
    if now() < v_session.ends_at then raise exception 'Phiên tập trung chưa đủ 20 phút.' using errcode = '22023'; end if;
    if now() > v_session.started_at + interval '24 hours' then raise exception 'Phiên đã hết hạn. Hãy bắt đầu phiên mới.' using errcode = '22023'; end if;
    update public.focus_sessions set status = 'completed', completed_at = now() where id = p_session_id;
    v_awarded := private.award_xp(v_user,'focus',p_session_id::text,50);
    perform private.sync_achievements(v_user);
  end if;
  select * into v_profile from public.profiles where id = v_user;
  return jsonb_build_object('awarded_xp',v_awarded,'total_xp',v_profile.total_xp,'level',v_profile.level);
end; $$;

create function public.cancel_focus_session(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  perform public.ensure_profile();
  perform 1 from public.profiles where id = v_user for update;
  if not exists(select 1 from public.focus_sessions where id = p_session_id and user_id = v_user) then
    raise exception 'Không tìm thấy phiên tập trung của bạn.' using errcode = '22023';
  end if;
  update public.focus_sessions set status = 'cancelled', cancelled_at = now()
    where id = p_session_id and user_id = v_user and status = 'active';
  return jsonb_build_object('cancelled',exists(select 1 from public.focus_sessions where id = p_session_id and user_id = v_user and status = 'cancelled'));
end; $$;

create function public.submit_exercise(p_exercise_id text,p_answer integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_key private.exercise_keys; v_correct boolean;
  v_awarded integer := 0; v_reward integer; v_profile public.profiles;
begin
  perform public.ensure_profile();
  if p_answer is null or p_answer not between 0 and 3 then raise exception 'Vui lòng chọn một đáp án hợp lệ.' using errcode = '22023'; end if;
  perform 1 from public.profiles where id = v_user for update;
  select * into v_key from private.exercise_keys where exercise_id = p_exercise_id;
  if not found then raise exception 'Không tìm thấy bài luyện tập.' using errcode = '22023'; end if;
  select reward_xp into v_reward from public.exercises where id = p_exercise_id;
  v_correct := p_answer = v_key.correct_answer;
  insert into public.exercise_assessments(user_id,exercise_id,last_answer,last_correct,first_correct_at)
    values(v_user,p_exercise_id,p_answer,v_correct,case when v_correct then now() else null end)
  on conflict(user_id,exercise_id) do update set last_answer = excluded.last_answer,
    last_correct = excluded.last_correct, attempts = public.exercise_assessments.attempts + 1,
    first_correct_at = coalesce(public.exercise_assessments.first_correct_at,excluded.first_correct_at), last_attempt_at = now();
  if v_correct then
    v_awarded := private.award_xp(v_user,'exercise',p_exercise_id,v_reward);
    perform private.sync_achievements(v_user);
  end if;
  select * into v_profile from public.profiles where id = v_user;
  return jsonb_build_object('correct',v_correct,'awarded_xp',v_awarded,'total_xp',v_profile.total_xp,
    'level',v_profile.level,'explanation',v_key.explanation);
end; $$;

create function public.get_progress() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_profile public.profiles; v_focus integer; v_exercise integer; v_checkin integer;
begin
  v_profile := public.ensure_profile();
  select count(*) into v_focus from public.focus_sessions where user_id = v_user and status = 'completed';
  select count(*) into v_exercise from public.exercise_assessments where user_id = v_user and first_correct_at is not null;
  select count(*) into v_checkin from public.daily_check_ins where user_id = v_user;
  return jsonb_build_object(
    'profile',to_jsonb(v_profile),
    'focus_sessions',coalesce((select jsonb_agg(to_jsonb(s) - 'user_id' order by s.started_at desc) from
      (select * from public.focus_sessions where user_id = v_user order by started_at desc limit 200) s),'[]'::jsonb),
    'completed_exercises',coalesce((select jsonb_agg(exercise_id order by exercise_id) from public.exercise_assessments
      where user_id = v_user and first_correct_at is not null),'[]'::jsonb),
    'check_ins',coalesce((select jsonb_agg(to_jsonb(c) - 'user_id' order by c.day desc) from
      (select * from public.daily_check_ins where user_id = v_user order by day desc limit 90) c),'[]'::jsonb),
    'achievements',(select jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'description',a.description,
      'earned',sa.earned_at is not null,'earned_at',sa.earned_at) order by a.id)
      from public.achievement_definitions a left join public.student_achievements sa on sa.achievement_id = a.id and sa.user_id = v_user),
    'missions',(select jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'description',m.description,
      'target',m.target,'progress',least(m.target,case m.metric when 'focus' then v_focus when 'exercise' then v_exercise else v_checkin end),
      'reward_xp',m.reward_xp,'completed',m.target <= case m.metric when 'focus' then v_focus when 'exercise' then v_exercise else v_checkin end) order by m.id)
      from public.missions m),
    'counts',jsonb_build_object('focus',v_focus,'exercise',v_exercise,'checkin',v_checkin)
  );
end; $$;

-- Chỉ hàm này được phép tổng hợp dữ liệu giữa nhiều học sinh; không trả mã tài khoản.
create function public.get_leaderboard() returns table(display_name text,total_xp integer,level integer,rank bigint)
language sql stable security definer set search_path = '' as $$
  select p.display_name,p.total_xp,p.level,rank() over(order by p.total_xp desc)
  from public.profiles p where p.leaderboard_opt_in = true
  order by p.total_xp desc,p.display_name asc limit 100;
$$;

-- PostgreSQL tự cấp EXECUTE cho PUBLIC khi tạo hàm: thu hồi rõ ràng ở mọi hàm.
revoke all on function public.ensure_profile() from public, anon, authenticated;
revoke all on function public.update_preferences(text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.daily_check_in(text) from public, anon, authenticated;
revoke all on function public.start_focus_session() from public, anon, authenticated;
revoke all on function public.complete_focus_session(uuid) from public, anon, authenticated;
revoke all on function public.cancel_focus_session(uuid) from public, anon, authenticated;
revoke all on function public.submit_exercise(text,integer) from public, anon, authenticated;
revoke all on function public.get_progress() from public, anon, authenticated;
revoke all on function public.get_leaderboard() from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function public.ensure_profile(),public.update_preferences(text,text,text,boolean),
  public.daily_check_in(text),public.start_focus_session(),public.complete_focus_session(uuid),
  public.cancel_focus_session(uuid),public.submit_exercise(text,integer),public.get_progress() to authenticated;
grant execute on function public.get_leaderboard() to anon, authenticated;

comment on table public.profiles is 'Hồ sơ riêng tư; bảng xếp hạng chỉ công bố biệt danh khi học sinh đồng ý.';
comment on table public.xp_transactions is 'Nhật ký điểm chỉ máy chủ được ghi; mỗi nguồn phần thưởng chỉ được cộng một lần.';
comment on function public.complete_focus_session(uuid) is 'Xác minh thời gian trên máy chủ, không xác minh sự chú ý thực tế của người học.';
comment on table public.missions is 'Các nhiệm vụ tóm tắt phần thưởng hoạt động; không cộng thêm điểm lần thứ hai.';

commit;
