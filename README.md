# Focus Buddy 3.0

Học cùng một bạn nhỏ biết đọc sách, nhảy và ăn mừng khi bạn hoàn thành phiên tập trung. Mở [ứng dụng tiếng Việt](https://messenger-co.github.io/focus-buddy-/) trên máy tính hoặc điện thoại. Tiến trình, trang phục và kỷ lục trò chơi được lưu trong trình duyệt đang dùng.

- **Đồng hồ** có phiên mặc định 20 phút và chín chế độ khác, gồm bấm giờ và hẹn giờ tự chọn. Trang Tổng quan dùng đúng chế độ và mục tiêu của bạn. Biểu đồ tuần cộng số phút đã học. Khi tải lại trang, đồng hồ tính tiếp theo mốc thời gian đã lưu. Bạn có thể chọn âm nền và chỉnh âm lượng ngay trong phiên. Trong giờ nghỉ, mở mục **Trò chơi đã ghim** để tìm lại trò của mình.
- **Bạn đồng hành** có phòng thử đồ, các lớp phụ kiện, vị trí tùy chỉnh, bộ đồ lưu sẵn và phản ứng cục bộ. Ba bộ Nhà thực vật, Họa sĩ màu nước và Hoa tiêu nhí có dụng cụ riêng. Trong **Tủ đồ**, bật **Xem tư thế học** để thử. Bạn cũng có thể đổi dụng cụ ngay bên đồng hồ. Trang **Giao diện** cho đổi chủ đề, màu nhấn, nền và mức chuyển động.
- **Trò chơi** có thử thách nhảy đảo, lượn qua vòng, vượt suối, giải đố hang băng, nhảy theo nhạc, luyện gõ, săn kho báu và nhiều hoạt động khác. Trong **[Đường ray đom đóm](https://messenger-co.github.io/focus-buddy-/#/tro-choi/duong-ray)**, xoay các mảnh ray để đưa tàu Buddy qua đủ đèn rồi về ga qua sáu chặng. Kệ trò chơi hỗ trợ tìm không dấu và lọc theo nhóm. Mở một trò và chọn **Ghim trò này** để lưu vào danh sách riêng trên thiết bị. Các trò theo chặng lưu kỷ lục riêng. Phòng 3D có năm trò, camera xoay và chế độ bản đồ 2D.
- **Bảo vệ dữ liệu**: Trong **Cài đặt & tài khoản → Sao lưu & chuyển thiết bị**, bạn có thể tải tệp JSON chứa tiến trình và lựa chọn đã lưu, sau đó khôi phục trên trình duyệt khác. Không tự xuất mã đăng nhập/phiên xác thực; lịch sử chat AI chỉ được sao lưu nếu bạn chọn. Không đăng công khai bản sao lưu vì có thể chứa ghi chú riêng tư. Khôi phục ghi đè các mục trùng tên trên máy hiện tại; chỉ ảnh hưởng dữ liệu tại trình duyệt, không cập nhật tài khoản Supabase.
- **Cập nhật và ngoại tuyến**: Trang hiển thị thông báo mất kết nối và chỉ gợi ý tải lại khi phát hiện phiên bản mới của bộ nhớ ngoại tuyến. Không tự tải lại giữa giờ tập trung. Trong Cài đặt có nút **Kiểm tra cập nhật**.
- **Trợ lý** có 11 chế độ học, hỗ trợ trả lời bằng tiếng Việt hoặc tiếng Anh, dừng tạo câu trả lời và tùy chọn lưu lịch sử trên thiết bị. Groq chạy mô hình `openai/gpt-oss-120b` sau Supabase Edge Function. Phần điều hướng có tùy chọn tiếng Anh. Một số học liệu và trò chơi dùng tiếng Việt.
- **Phòng học sinh** mở sẵn các đề tự học. Khi phòng mở, vào **Cài đặt & tài khoản** để nhận liên kết đăng nhập qua email. Bạn học chỉ thấy biệt danh. Để tổ chức thảo luận trực tuyến, quản trị viên triển khai migration, phân công kiểm duyệt và mở dịch vụ theo hướng dẫn Supabase.

## Chạy tại máy

Dùng Node.js 22.12 trở lên. Từ thư mục gốc, chạy các lệnh sau.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Điền URL và khóa **publishable** của dự án Supabase trong `.env.local` để thử tính năng trực tuyến. Đồng hồ, nhật ký, Buddy và các trò chơi dùng được ở chế độ cục bộ. Sau lần mở trực tuyến, trình duyệt hỗ trợ service worker có thể tải lại giao diện và hoạt động đã ghé khi mất mạng.

## Xuất bản lên GitHub Pages

1. Chọn **GitHub Actions** ở **Settings → Pages → Build and deployment** của kho `messenger-co/focus-buddy-`.
2. Trong **Settings → Secrets and variables → Actions → Variables**, đặt `VITE_BASE_PATH` thành `/focus-buddy-/`, `VITE_SUPABASE_URL` thành `https://lrihuhrfsnmkwcvouudd.supabase.co` và `VITE_SUPABASE_PUBLISHABLE_KEY` thành khóa công khai của dự án. Mọi biến Vite đã biên dịch đều có thể đọc được trong trình duyệt.
3. Chạy các lệnh kiểm thử bên dưới rồi đẩy mã lên nhánh tính năng. Khi thay đổi vào `main`, workflow **Triển khai GitHub Pages** chạy kiểm thử, tạo bản dựng rồi xuất bản thư mục `dist`.
4. Mở trang, tải lại một đường dẫn như `/#/tro-choi/hang-bang`, rồi mở đồng hồ trên điện thoại. Đường dẫn cũ của trò Đảo Xanh chuyển về kệ trò chơi. Hướng dẫn cấp quyền và triển khai dịch vụ phía máy chủ có trong [tài liệu Supabase](supabase/README.md).

```sh
npm test
npm run test:edge
npm run test:community
VITE_BASE_PATH=/focus-buddy-/ npm run build
npm run preview
```

Xem các tình huống kiểm tra tương tác trong [hướng dẫn kiểm thử](KIEM-THU.md).
