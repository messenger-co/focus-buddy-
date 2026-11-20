begin;

create function buddy_community.broadcast_room_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send(
    jsonb_build_object('revision', new.revision),
    'revision',
    'focus-buddy-room:' || new.room,
    true
  );
  return new;
end;
$$;

revoke all on function buddy_community.broadcast_room_revision() from public, anon, authenticated;
create trigger fb_notify_room_revision after update of revision on public.fb_room_updates
for each row when (old.revision is distinct from new.revision)
execute function buddy_community.broadcast_room_revision();

commit;
