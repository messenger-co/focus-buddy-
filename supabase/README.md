# Dữ liệu trực tuyến của Focus Buddy

Chạy `migrations/202611170001_focus_buddy.sql` một lần bằng **SQL Editor** trong dự án Supabase mới. Không đưa khóa `service_role` hoặc khóa bí mật vào ứng dụng trình duyệt. Ứng dụng chỉ cần URL dự án và khóa công khai; các chính sách bảo mật cấp hàng vẫn được áp dụng cho từng học sinh.

## Giao diện gọi từ ứng dụng

Các hàm thay đổi dữ liệu yêu cầu phiên Supabase Auth hợp lệ. Chúng tự xác định tài khoản từ `auth.uid()`, không nhận mã tài khoản do trình duyệt gửi lên.

| Hàm                      | Tham số                                                            | Kết quả                                                                             |
| ------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `ensure_profile`         | Không có                                                           | Hồ sơ của tài khoản hiện tại, tạo mới nếu cần                                       |
| `update_preferences`     | `p_display_name`, `p_companion`, `p_color`, `p_leaderboard_opt_in` | Hồ sơ đã lưu                                                                        |
| `get_progress`           | Không có                                                           | Đối tượng JSON chứa toàn bộ tiến độ riêng tư cần cho giao diện                      |
| `daily_check_in`         | `p_mood`: `great`, `okay` hoặc `tired`                             | `awarded_xp`, `total_xp`, `level`                                                   |
| `start_focus_session`    | Không có                                                           | `id`, `started_at`, `ends_at`                                                       |
| `complete_focus_session` | `p_session_id`                                                     | `awarded_xp`, `total_xp`, `level`                                                   |
| `cancel_focus_session`   | `p_session_id`                                                     | `cancelled`                                                                         |
| `submit_exercise`        | `p_exercise_id`, `p_answer` (vị trí đáp án từ 0–3)                 | `correct`, `awarded_xp`, `total_xp`, `level`, `explanation`                         |
| `get_leaderboard`        | Không có                                                           | Danh sách tối đa 100 biệt danh đã đồng ý công khai, kèm `total_xp`, `level`, `rank` |

`ensure_profile` và `update_preferences` trả kiểu bản ghi PostgreSQL; có thể dùng `.single()` với Supabase để lấy một hồ sơ. `get_progress` trả JSON trực tiếp, gồm:

- `profile`: `id`, `display_name`, `companion`, `color`, `leaderboard_opt_in`, `total_xp`, `level`, thời điểm tạo và sửa.
- `focus_sessions`: tối đa 200 phiên gần nhất; mỗi phiên có `id`, `started_at`, `ends_at`, `status`, `completed_at`, `cancelled_at`.
- `completed_exercises`: danh sách mã bài đã trả lời đúng.
- `check_ins`: tối đa 90 ngày điểm danh gần nhất; mỗi mục có `day`, `mood`, `created_at`.
- `achievements`: định nghĩa thành tích kèm `earned` và `earned_at`.
- `missions`: định nghĩa nhiệm vụ kèm `target`, `progress`, `reward_xp`, `completed`.
- `counts`: tổng số phiên hoàn thành, bài giải đúng và ngày điểm danh trong `focus`, `exercise`, `checkin`.

Giá trị bạn đồng hành: `fox`, `owl`, `cat`. Giá trị màu: `mint`, `lavender`, `peach`. Các mã máy giữ ổn định; giao diện hiển thị tên tiếng Việt.

## Cách tính điểm và quyền riêng tư

Điểm danh được 10 điểm mỗi ngày theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`). Mỗi bài luyện tập được 30 điểm vào lần trả lời đúng đầu tiên. Mỗi phiên tập trung hoàn thành được 50 điểm. Mỗi 100 điểm tăng một cấp. Gửi lại cùng yêu cầu đã nhận thưởng không cộng thêm điểm.

Thời điểm bắt đầu và kết thúc phiên do máy chủ tạo. Mỗi tài khoản chỉ có một phiên đang chạy, phải đủ 20 phút mới được hoàn thành. Phiên quá 24 giờ không nhận thưởng; bắt đầu phiên mới sẽ đóng phiên cũ đã hết hạn. Cơ chế này xác minh thời gian trôi qua, không thể xác minh người học có thực sự chú ý trong suốt phiên.

Nhiệm vụ tóm tắt phần thưởng của hoạt động tương ứng, không cộng thêm lần thứ hai. Thành tích được ghi nhận sau các hoạt động có xác minh.

Không có quyền ghi trực tiếp từ vai trò `anon` hoặc `authenticated` vào bảng dữ liệu học sinh. Mọi bảng riêng tư chỉ cho phép học sinh đọc dữ liệu của chính mình. Đáp án chuẩn nằm trong lược đồ `private`, không được công khai qua API. Lời giải chỉ được trả sau khi nộp đáp án để hỗ trợ việc học.

Bảng xếp hạng công khai chỉ trả biệt danh và điểm của người đã đồng ý tham gia. Mặc định không tham gia. Không trả mã tài khoản, địa chỉ thư điện tử, cảm xúc hoặc kết quả bài tập riêng tư. Chọn một biệt danh, không dùng họ tên thật. Có thể rút sự đồng ý trong cài đặt; lần truy vấn tiếp theo sẽ không chứa tài khoản đó.

## Kiểm thử bảo mật

Dùng cơ sở dữ liệu thử nghiệm đã chạy migration, rồi chạy bằng tài khoản quản trị PostgreSQL:

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security.sql
```

Bộ kiểm thử tạo hai tài khoản tạm, kiểm tra RLS, quyền ghi điểm, bảo vệ đáp án, phần thưởng duy nhất, thời gian tập trung và quyền tham gia bảng xếp hạng. Giao dịch cuối cùng được hoàn tác. Không đặt chuỗi kết nối cơ sở dữ liệu trong kho mã nguồn hoặc biến `VITE_*`.

Migration và bộ kiểm thử đã chạy thành công trong PostgreSQL nhúng PGlite với lược đồ `auth` tối thiểu. Vẫn cần kiểm tra đăng nhập, lời gọi qua PostgREST và đồng bộ giữa hai trình duyệt trên dự án Supabase thực tế sau khi cấu hình.
