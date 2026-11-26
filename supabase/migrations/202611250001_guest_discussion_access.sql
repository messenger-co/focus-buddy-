begin;
set local search_path = buddy_community, pg_catalog;

-- Allow authenticated anonymous guest sessions to join public moderated rooms
-- without requiring email OTP, while keeping moderation strictly limited to
-- non-anonymous email-confirmed staff accounts.
create or replace function buddy_community.verified() returns boolean
language sql stable security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
  select exists(select 1 from auth.users where id = auth.uid());
$$;

create or replace function buddy_community.verified_staff() returns boolean
language sql stable security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
  select staff()
    and exists(
      select 1
      from auth.users
      where id = auth.uid()
        and not coalesce(is_anonymous, false)
        and email_confirmed_at is not null
    );
$$;

revoke all on function buddy_community.verified_staff() from public, anon, authenticated;

create or replace function buddy_community.gate() returns uuid
language plpgsql security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if not (select enabled from settings) then raise exception 'Phòng đang đóng.'; end if;
  if not verified() then raise exception 'Hãy vào bằng chế độ khách để thảo luận.'; end if;
  if exists(select 1 from profiles where account = uid and suspended_until > now()) then
    raise exception 'Tài khoản đang tạm ngừng thảo luận.';
  end if;
  return uid;
end $$;

create or replace function public.fb_community_status() returns jsonb
language sql stable security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
  select jsonb_build_object(
    'enabled', s.enabled,
    'verified', verified(),
    'moderator', verified_staff(),
    'rooms', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description,
            'private', r.private
          ) order by r.id
        ),
        '[]'
      )
      from rooms r
      where not r.private
        or (
          s.enabled
          and exists(
            select 1
            from members m
            where m.room = r.id and m.account = auth.uid() and m.invited
          )
        )
    )
  )
  from settings s;
$$;

create or replace function public.fb_moderation_queue() returns jsonb
language plpgsql security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
begin
  if not verified_staff() then raise exception 'Chỉ người điều hành được truy cập.'; end if;
  return (
    select coalesce(jsonb_agg(to_jsonb(q)), '[]')
    from (
      select
        m.id,
        m.room,
        m.body,
        m.state,
        m.created,
        p.alias,
        array(
          select category
          from reports r
          where r.message = m.id and not r.resolved
        ) reasons
      from messages m
      join profiles p on p.account = m.author
      where m.state = 'pending'
        or exists(select 1 from reports r where r.message = m.id and not resolved)
      order by exists(select 1 from reports r where r.message = m.id and not resolved) desc, m.created
      limit 100
    ) q
  );
end $$;

create or replace function public.fb_moderate(p_message uuid, p_action text) returns void
language plpgsql security definer
set search_path = pg_catalog, buddy_community, pg_temp as $$
declare m messages;
begin
  if not verified_staff() then raise exception 'Chỉ người điều hành được truy cập.'; end if;
  select * into m from messages where id = p_message for update;
  if m.id is null or p_action not in ('approve', 'remove', 'suspend', 'pin', 'unpin', 'resolve') or p_action is null then
    raise exception 'Thao tác không hợp lệ.';
  end if;
  if p_action = 'approve' then
    if m.state <> 'pending' or exists(select 1 from profiles where account = m.author and suspended_until > now()) then
      raise exception 'Tin không thể duyệt.';
    end if;
    perform safe_body(m.body);
    update messages set state = 'approved' where id = m.id;
  elsif p_action in ('remove', 'suspend') then
    update messages set state = 'removed', pinned = false where id = m.id;
    if p_action = 'suspend' then
      update profiles set suspended_until = now() + interval '7 days' where account = m.author;
    end if;
  elsif p_action in ('pin', 'unpin') then
    if m.state <> 'approved' then raise exception 'Hãy duyệt tin trước khi ghim.'; end if;
    update messages set pinned = (p_action = 'pin') where id = m.id;
  end if;
  update reports set resolved = true where message = m.id;
  insert into moderation_actions(moderator, message, action) values (auth.uid(), m.id, p_action);
  perform touch(m.room);
end $$;

commit;
