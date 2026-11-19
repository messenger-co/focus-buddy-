# Supabase cho Focus Buddy

GitHub Actions triển khai phần giao diện. Quản trị viên dự án Supabase quản lý Auth, khóa Groq, Edge Function và quyền mở phòng. Đồng hồ, XP, nhật ký học, trang phục và kỷ lục dùng bộ nhớ của trình duyệt.

## Trợ lý Groq

1. Trong **Authentication**, bật **Anonymous Sign-Ins** để trợ lý có thể cấp phiên khách. Đối với phòng thảo luận, bật đăng nhập email và xác minh địa chỉ email. Cấu hình Site URL/redirect của dự án cho `https://messenger-co.github.io/focus-buddy-/`.
2. Kiểm tra các **Edge Function Secrets** hiện có. `GROQ_API_KEY` là khóa riêng, `GROQ_MODEL` có giá trị `openai/gpt-oss-120b` và `ALLOWED_ORIGIN` có giá trị `https://messenger-co.github.io`. Điền khóa riêng trực tiếp trong Supabase. Tệp `.env.edge.example` minh họa định dạng. Khi thay khóa, cập nhật secret ở đây.
3. Dùng Supabase CLI với tài khoản có quyền triển khai. Thử trên dự án thử nghiệm trước. Lệnh dành cho dự án chính như sau.

```sh
supabase login
supabase functions deploy chat --project-ref lrihuhrfsnmkwcvouudd
curl -fsS https://lrihuhrfsnmkwcvouudd.supabase.co/functions/v1/chat/health
```

Bản hàm mới trả `ready: true`, `studyModes: true` và tên mô hình khi cấu hình hợp lệ. Kiểm tra thêm bằng một câu hỏi ngắn trong ứng dụng để xác nhận đường đi qua Auth và nhà cung cấp. Trang mới cũng có thể gửi tùy chọn học cho bản hàm cũ. Xem [chi tiết yêu cầu và hạn mức](functions/README.md).

## Phòng thảo luận có kiểm duyệt

1. Chạy `npm run test:community` tại thư mục gốc. Trên dự án thử nghiệm, duyệt và áp dụng toàn bộ [migration](migrations/202611190001_moderated_rooms.sql) trong SQL Editor bằng tài khoản quản trị. Migration chạy một giao dịch, tạo schema riêng và đóng phòng mặc định. Kiểm tra danh mục migration nếu dùng CLI để tránh áp dụng trùng.
2. Xác nhận Auth yêu cầu email đã xác minh. Trong Realtime, tắt **Allow public access** cho các kênh Broadcast cũ sau khi kiểm tra các ứng dụng cùng dùng dự án. Phòng mới dùng Postgres Changes trên `public.fb_room_updates`. Bảng chỉ phát số phiên bản. Các thiết bị lấy nội dung qua RPC có kiểm tra thành viên, trạng thái tin và danh sách chặn.
3. Chỉ định một tài khoản nhân sự có email đã xác minh. Thay phần giữ chỗ bằng UUID thực lấy từ Auth. Chỉ thực hiện các lệnh quản trị trong SQL Editor hoặc phiên quản trị tin cậy.

```sql
insert into buddy_community.moderators (account)
values ('<UUID của người điều hành>'::uuid)
on conflict do nothing;
```

4. Trên môi trường thử nghiệm, mở cổng bằng lệnh phía dưới. Dùng hai tài khoản học sinh và một tài khoản kiểm duyệt viên để thử gửi, duyệt, báo cáo, chặn và đình chỉ. Kiểm tra học sinh chỉ thấy tin của người khác sau khi duyệt, quyền phòng riêng và việc xóa dữ liệu của chính mình. Kiểm tra phiên ẩn danh chỉ truy cập đề tự học. Thử nhận cập nhật trên hai trình duyệt.
5. Kiểm tra lịch dọn dữ liệu. Migration đăng ký lịch hằng ngày nếu `pg_cron` đã bật. Nếu chưa có lịch, lên lịch chạy `select buddy_community.prune();` bằng tác vụ quản trị hằng ngày. Tin chờ duyệt giữ tối đa 7 ngày, tin khác 30 ngày và nhật ký điều hành 90 ngày tính đến lần dọn tiếp theo.
6. Sau khi có nhân sự trực và đã kiểm chứng các bước trên, quản trị viên có thể áp dụng cùng migration, gán quyền và mở dịch vụ trên dự án chính.

```sql
update buddy_community.settings set enabled = true where id;
```

Đặt `enabled = false` để đóng lại khi cần. Trang vẫn cung cấp đề tự học khi phòng đóng. Người điều hành có thể gỡ tin, ghim tài liệu bằng văn bản, xử lý báo cáo hoặc tạm ngừng tài khoản. Mọi tin mới chờ duyệt. Các tài khoản dùng biệt danh đã chọn sẵn. Phòng riêng yêu cầu quản trị viên tạo phòng và thêm lời mời trong bảng thành viên. Xem [quy trình kiểm thử](../KIEM-THU.md).
