begin;

-- Realtime kiểm tra quyền đọc Broadcast khi mở kênh riêng.
-- Ứng dụng chỉ nhận thay đổi trên bảng fb_room_updates.
create policy fb_room_channel_join on realtime.messages
for select to authenticated
using (starts_with(topic, 'focus-buddy-room:'));

create policy fb_room_channel_member on realtime.messages
as restrictive for select to authenticated using (
  not starts_with(topic, 'focus-buddy-room:') or (
    extension = 'broadcast'
    and topic = (select realtime.topic())
    and public.fb_room_visible(substr(topic, length('focus-buddy-room:') + 1))
  )
);

create policy fb_room_channel_guest on realtime.messages
as restrictive for select to anon
using (not starts_with(topic, 'focus-buddy-room:'));

-- Các ứng dụng khác trong cùng dự án có thể có chính sách permissive riêng.
-- Mọi thao tác gửi của học sinh trong phòng này vẫn phải qua RPC kiểm duyệt.
create policy fb_room_channel_no_insert on realtime.messages
as restrictive for insert to anon, authenticated
with check (not starts_with(topic, 'focus-buddy-room:'));

create policy fb_room_channel_no_update on realtime.messages
as restrictive for update to anon, authenticated
using (not starts_with(topic, 'focus-buddy-room:'))
with check (not starts_with(topic, 'focus-buddy-room:'));

create policy fb_room_channel_no_delete on realtime.messages
as restrictive for delete to anon, authenticated
using (not starts_with(topic, 'focus-buddy-room:'));

commit;
