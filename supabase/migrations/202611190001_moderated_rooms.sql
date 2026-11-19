begin;
create schema buddy_community;
revoke all on schema buddy_community from public, anon, authenticated;
set local search_path = buddy_community, pg_catalog;

create table settings (id boolean primary key default true check(id), enabled boolean not null default false);
insert into settings default values;
create table moderators (account uuid primary key references auth.users(id) on delete cascade);
create table profiles (
  account uuid primary key references auth.users(id) on delete cascade,
  alias text not null default 'Mây Nhỏ', buddy text not null default 'fox', theme text not null default 'forest',
  interest text not null default '', last_send timestamptz, last_report timestamptz, last_reaction timestamptz,
  send_window timestamptz not null default now(), sent_count integer not null default 0, suspended_until timestamptz
);
create table rooms (id text primary key, name text not null, description text not null, private boolean not null default false, last_send timestamptz);
insert into rooms(id,name,description) values
 ('tu-hoc','Bàn tự học','Cùng đặt mục tiêu học hôm nay.'),('toan','Toán học','Chia sẻ cách giải và kiểm tra kết quả.'),
 ('khoa-hoc','Khoa học','Cùng đặt giả thuyết và giải thích hiện tượng.'),('tieng-anh','Tiếng Anh','Luyện từ và cách diễn đạt.'),
 ('doc-sach','Góc văn học','Đọc, cảm nhận và phân tích tác phẩm.'),('go-bai','Cùng gỡ bài','Nói rõ bước mà bạn đang gặp khó.'),
 ('meo-hoc','Mẹo học','Chia sẻ cách học đã thử.'),('on-thi','Ôn thi','Lập kế hoạch ôn tập vừa sức.'),
 ('so-thich','Trò chơi và sở thích','Trao đổi sở thích trong giờ nghỉ.');
create table members (room text references rooms on delete cascade, account uuid references profiles on delete cascade, invited boolean not null default false, active boolean not null default true, seen timestamptz not null default now(), primary key(room,account));
create table messages (
  id uuid primary key default gen_random_uuid(), room text not null references rooms on delete cascade, author uuid not null references profiles on delete cascade,
  body text not null check(char_length(body) between 1 and 320), parent uuid references messages on delete set null,
  state text not null default 'pending' check(state in ('pending','approved','removed')), pinned boolean not null default false,
  created timestamptz not null default now(), unique(room,id)
);
create index fb_room_feed on messages(room,state,created desc);
create index fb_message_author on messages(author,created desc);
create table reports (id uuid primary key default gen_random_uuid(), message uuid not null references messages on delete cascade, reporter uuid not null references profiles on delete cascade, category text not null check(category in ('spam','contact','hurtful','other')), resolved boolean not null default false, created timestamptz not null default now(),unique(message,reporter));
create table blocks (owner uuid references profiles on delete cascade,target uuid references profiles on delete cascade,primary key(owner,target),check(owner<>target));
create table reactions (message uuid references messages on delete cascade,account uuid references profiles on delete cascade,emoji text not null check(emoji in ('🌱','💡','👏')),primary key(message,account));
create table moderation_actions (id bigint generated always as identity primary key, moderator uuid references auth.users on delete set null,message uuid references messages on delete set null, action text not null,created timestamptz not null default now());

-- Chỉ số phiên bản được phát qua Realtime. Nội dung phòng luôn lấy lại qua RPC có phân quyền.
create table public.fb_room_updates (room text primary key references rooms on delete cascade,revision bigint not null default 0);
insert into public.fb_room_updates(room) select id from rooms;
do $$ declare t text; begin
 foreach t in array array['settings','moderators','profiles','rooms','members','messages','reports','blocks','reactions','moderation_actions'] loop
   execute format('alter table buddy_community.%I enable row level security',t);
   execute format('revoke all on buddy_community.%I from public, anon, authenticated',t);
 end loop;
end $$;
alter table public.fb_room_updates enable row level security;
revoke all on public.fb_room_updates from public,anon,authenticated;
grant select on public.fb_room_updates to authenticated;

create function buddy_community.staff() returns boolean language sql stable security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
 select exists(select 1 from moderators where account=auth.uid());
$$;
create function buddy_community.verified() returns boolean language sql stable security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
 select exists(select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false) and email_confirmed_at is not null);
$$;
create function buddy_community.gate() returns uuid language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=auth.uid();
begin
 if not (select enabled from settings) then raise exception 'Phòng đang đóng.';end if;
 if not verified() then raise exception 'Hãy đăng nhập bằng email đã xác minh trong Cài đặt.';end if;
 if exists(select 1 from profiles where account=uid and suspended_until>now()) then raise exception 'Tài khoản đang tạm ngừng thảo luận.';end if;
 return uid;
end $$;
create function buddy_community.accessible(r text) returns boolean language sql stable security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
 select coalesce((select enabled from settings),false) and verified() and exists(
  select 1 from members m join profiles p on m.account=p.account join rooms rm on rm.id=m.room
  where m.account=auth.uid() and m.room=r and m.active and (not rm.private or m.invited) and (p.suspended_until is null or p.suspended_until<=now()));
$$;
create function public.fb_room_visible(p_room text) returns boolean language sql stable security definer set search_path=pg_catalog,buddy_community,pg_temp as $$select accessible(p_room)$$;
create policy member_revision on public.fb_room_updates for select to authenticated using(public.fb_room_visible(room));
create function buddy_community.touch(r text) returns void language sql set search_path=pg_catalog,buddy_community,pg_temp as $$ update public.fb_room_updates set revision=revision+1 where room=r $$;
create function buddy_community.can_read(m messages) returns boolean language sql stable set search_path=pg_catalog,buddy_community,pg_temp as $$
 select accessible(m.room) and (m.state='approved' or (m.author=auth.uid() and m.state='pending'))
 and not exists(select 1 from blocks where (owner=auth.uid() and target=m.author) or (target=auth.uid() and owner=m.author));
$$;
create function buddy_community.safe_body(input text) returns text language plpgsql immutable set search_path=pg_catalog as $$
declare v text:=trim(input); compact text:=regexp_replace(lower(v),'[[:space:]().+_-]','','g');
begin
 if v is null or length(v) not between 1 and 320 or v ~ '[[:cntrl:]]' or v ~ U&'[\200B-\200F\202A-\202E\2060-\206F\FEFF]' then raise exception 'Tin cần từ 1 đến 320 ký tự hiển thị.';end if;
 if v ~* '(@|://|www[.]|[a-z0-9-]+[.][[:alpha:]]{2,}([/?#:[:space:]]|$)|https?:|[[:alnum:]][[:space:]]*[/]{2})'
   or compact ~ '[0-9]{7}' then raise exception 'Hãy bỏ liên kết và thông tin liên hệ khỏi tin nhắn.';end if;
 return v;
end $$;
create function public.fb_community_status() returns jsonb language sql stable security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
 select jsonb_build_object('enabled',s.enabled,'verified',verified(),'moderator',staff(),'rooms',
 (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'description',r.description,'private',r.private) order by r.id),'[]') from rooms r
 where not r.private or (s.enabled and exists(select 1 from members m where m.room=r.id and m.account=auth.uid() and m.invited))))
 from settings s;
$$;
create function public.fb_room_join(p_room text) returns jsonb language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=gate(); result jsonb;
begin
 if not exists(select 1 from rooms r where r.id=p_room and (not r.private or exists(select 1 from members m where m.room=r.id and m.account=uid and m.invited))) then raise exception 'Phòng này không khả dụng.';end if;
 insert into profiles(account) values(uid) on conflict do nothing;
 insert into members(room,account) values(p_room,uid) on conflict (room,account) do update set active=true,seen=now();
 select jsonb_build_object('alias',alias,'buddy',buddy,'theme',theme,'interest',interest) into result from profiles where account=uid;
 return result;
end $$;
create function public.fb_room_leave(p_room text) returns void language sql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$update members set active=false where account=auth.uid() and room=p_room$$;
create function public.fb_room_profile(p_alias text,p_buddy text,p_theme text,p_interest text) returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=gate();
begin
 if p_alias is null or p_alias !~ '^(Mây|Trúc|Lá|Sao|Mầm|Nắng) (Nhỏ|Xanh|Vui|Hiền|Sáng|Ấm)$'
  or p_buddy not in ('fox','owl','cat','rabbit','panda','dragon','axolotl','penguin') or p_theme not in ('forest','ocean','sunset')
  or p_interest not in ('','Toán','Văn học','Ngoại ngữ','Khoa học','Nghệ thuật') then raise exception 'Hãy chọn trong danh mục hồ sơ.';end if;
 update profiles set alias=p_alias,buddy=p_buddy,theme=p_theme,interest=p_interest where account=uid;
end $$;
create function public.fb_room_feed(p_room text,p_search text default '') returns jsonb language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=gate(); result jsonb;
begin
 if not accessible(p_room) then raise exception 'Hãy vào phòng trước.';end if;
 update members set seen=now() where room=p_room and account=uid and seen<now()-interval '20 seconds';
 select jsonb_build_object('online',(select count(*) from members m join profiles p on p.account=m.account where m.room=p_room and m.active and m.seen>now()-interval '2 minutes' and coalesce(p.suspended_until,'-infinity')<=now()),
 'messages',coalesce(jsonb_agg(obj order by sent),'[]')) into result from(
   select m.created as sent,jsonb_build_object('id',m.id,'alias',p.alias,'buddy',p.buddy,'theme',p.theme,'interest',p.interest,'mine',m.author=uid,'body',m.body,'state',m.state,'pinned',m.pinned,'created',m.created,
     'reply',(select left(q.body,96) from messages q where q.id=m.parent and can_read(q)),
     'reactions',(select coalesce(jsonb_object_agg(emoji,n),'{}') from(select emoji,count(*) n from reactions t where t.message=m.id group by emoji) c),
     'myReaction',(select emoji from reactions where message=m.id and account=uid)) obj
   from messages m join profiles p on p.account=m.author where m.room=p_room and m.created>now()-interval '30 days' and can_read(m)
     and strpos(lower(m.body),lower(left(coalesce(p_search,''),80)))>0 order by m.pinned desc,m.created desc limit 80) items;
 return result;
end $$;

create function public.fb_room_send(p_room text,p_body text,p_reply uuid default null) returns uuid language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=gate(); msg text:=safe_body(p_body); mid uuid;
begin
 if not accessible(p_room) then raise exception 'Hãy vào phòng trước.';end if;
 perform 1 from profiles where account=uid for update;
 perform 1 from rooms where id=p_room for update;
 -- Kiểm tra lại sau khi chờ khóa để tôn trọng lệnh tạm ngừng và các lượt gửi đồng thời.
 perform gate();
 if not accessible(p_room) then raise exception 'Hãy vào phòng trước.';end if;
 if exists(select 1 from profiles where account=uid and last_send>clock_timestamp()-interval '12 seconds') or
    exists(select 1 from profiles where account=uid and send_window>now()-interval '1 hour' and sent_count>=15) then raise exception 'Bạn gửi hơi nhanh. Hãy chờ rồi thử lại.';end if;
 if exists(select 1 from rooms where id=p_room and last_send>clock_timestamp()-interval '1 second') or
    (select count(*) from messages where room=p_room and state='pending')>=100 then raise exception 'Phòng đang bận duyệt tin. Bạn quay lại sau nhé.';end if;
 if exists(select 1 from messages where author=uid and body=msg and created>now()-interval '1 hour') then raise exception 'Nội dung này đã được gửi.';end if;
 if p_reply is not null and not exists(select 1 from messages q where q.id=p_reply and q.room=p_room and q.state='approved' and can_read(q)) then raise exception 'Tin cần trả lời không khả dụng.';end if;
 insert into messages(room,author,body,parent) values(p_room,uid,msg,p_reply) returning id into mid;
 update profiles set last_send=clock_timestamp(), sent_count=case when send_window<=now()-interval '1 hour' then 1 else sent_count+1 end, send_window=case when send_window<=now()-interval '1 hour' then now() else send_window end where account=uid; update rooms set last_send=clock_timestamp() where id=p_room;
 return mid;
end $$;
create function public.fb_room_feedback(p_message uuid,p_action text,p_value text default '') returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=gate(); m messages;
begin
 select * into m from messages where id=p_message and state='approved';if m.id is null or not can_read(m) then raise exception 'Tin không khả dụng.';end if;
 perform 1 from profiles where account=uid for update;
 if p_action='block' and m.author<>uid then
   insert into blocks values(uid,m.author) on conflict do nothing;
 elsif p_action='report' and m.author<>uid then
   if exists(select 1 from profiles where account=uid and last_report>clock_timestamp()-interval '15 seconds') then raise exception 'Hãy chờ trước khi báo cáo tiếp.';end if;
   insert into reports(message,reporter,category) values(m.id,uid,p_value) on conflict do nothing;
   update profiles set last_report=clock_timestamp() where account=uid;
 elsif p_action='react' then
   if exists(select 1 from profiles where account=uid and last_reaction>clock_timestamp()-interval '2 seconds') then raise exception 'Hãy chờ trước khi bày tỏ cảm xúc tiếp.';end if;
   if p_value='' then delete from reactions where message=m.id and account=uid;
   else insert into reactions values(m.id,uid,p_value) on conflict (message,account) do update set emoji=excluded.emoji;end if;
   update profiles set last_reaction=clock_timestamp() where account=uid; perform touch(m.room);
 else raise exception 'Thao tác không hợp lệ.';end if;
end $$;
create function public.fb_room_delete(p_message uuid) returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare r text;begin delete from messages where author=auth.uid() and id=p_message returning room into r;perform touch(r);end $$;
create function public.fb_room_erase() returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare uid uuid:=auth.uid();r record;begin
 if uid is null then raise exception 'Cần đăng nhập.';end if;
 perform 1 from profiles where account=uid for update;
 for r in select distinct room from messages where author=uid loop perform touch(r.room);end loop;
 delete from messages where author=uid;
 delete from reports where reporter=uid;delete from blocks where owner=uid;delete from reactions where account=uid;delete from members where account=uid;
 update profiles set alias='Mây Nhỏ',buddy='fox',theme='forest',interest='' where account=uid;
end $$;
create function public.fb_moderation_queue() returns jsonb language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
begin
 if not staff() or not verified() then raise exception 'Chỉ người điều hành được truy cập.';end if;
 return (select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (
 select m.id,m.room,m.body,m.state,m.created,p.alias,array(select category from reports r where r.message=m.id and not r.resolved) reasons
 from messages m join profiles p on p.account=m.author
 where m.state='pending' or exists(select 1 from reports r where r.message=m.id and not resolved)
 order by exists(select 1 from reports r where r.message=m.id and not resolved) desc,m.created limit 100)q);
end $$;
create function public.fb_moderate(p_message uuid,p_action text) returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
declare m messages;begin
 if not staff() or not verified() then raise exception 'Chỉ người điều hành được truy cập.';end if;
 select * into m from messages where id=p_message for update;
 if m.id is null or p_action not in ('approve','remove','suspend','pin','unpin','resolve') or p_action is null then raise exception 'Thao tác không hợp lệ.';end if;
 if p_action='approve' then
   if m.state<>'pending' or exists(select 1 from profiles where account=m.author and suspended_until>now()) then raise exception 'Tin không thể duyệt.';end if;
   perform safe_body(m.body); update messages set state='approved' where id=m.id;
 elsif p_action in ('remove','suspend') then
   update messages set state='removed',pinned=false where id=m.id;
   if p_action='suspend' then update profiles set suspended_until=now()+interval '7 days' where account=m.author;end if;
 elsif p_action in ('pin','unpin') then
   if m.state<>'approved' then raise exception 'Hãy duyệt tin trước khi ghim.';end if;
   update messages set pinned=(p_action='pin') where id=m.id;
 end if;
 update reports set resolved=true where message=m.id;
 insert into moderation_actions(moderator,message,action) values(auth.uid(),m.id,p_action);
 perform touch(m.room);
end $$;
create function buddy_community.prune() returns void language plpgsql security definer set search_path=pg_catalog,buddy_community,pg_temp as $$
begin
 delete from messages where created<now()-interval '30 days' or (state='pending' and created<now()-interval '7 days');
 delete from moderation_actions where created<now()-interval '90 days';
 delete from members where not invited and seen<now()-interval '30 days';
end $$;
revoke all on all functions in schema buddy_community from public, anon, authenticated;
-- Quyền ghi chỉ đi qua các hàm RPC kiểm tra danh tính và quyền hạn.
do $$ declare fn regprocedure;begin
 for fn in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in
 ('fb_room_visible','fb_community_status','fb_room_join','fb_room_leave','fb_room_profile','fb_room_feed','fb_room_send','fb_room_feedback','fb_room_delete','fb_room_erase','fb_moderation_queue','fb_moderate')
 loop execute format('revoke all on function %s from public,anon,authenticated',fn);execute format('grant execute on function %s to authenticated',fn);end loop;
end $$;
grant execute on function public.fb_community_status() to anon;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime' and not puballtables) then
   execute 'alter publication supabase_realtime add table public.fb_room_updates';
 end if;
 if exists(select 1 from pg_extension where extname='pg_cron') then
   perform cron.schedule('focus-buddy-community-retention','15 3 * * *','select buddy_community.prune()');
 end if;
end $$;
commit;
