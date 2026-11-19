# Focus Buddy 3.0

Học cùng một bạn nhỏ biết đọc sách, nhảy và ăn mừng khi bạn hoàn thành phiên tập trung. Mở [ứng dụng tiếng Việt](https://messenger-co.github.io/focus-buddy-/) trên máy tính hoặc điện thoại. Tiến trình, trang phục và kỷ lục trò chơi được lưu trong trình duyệt đang dùng.

- **Đồng hồ** có chín chế độ, mục tiêu, ghi chú và giờ nghỉ. Khi tải lại trang, đồng hồ tính tiếp theo mốc thời gian đã lưu. Trong giờ nghỉ, bạn có thể chủ động mở trò chơi rồi quay lại học.
- **Bạn đồng hành** có phòng thử đồ, các lớp phụ kiện, vị trí tùy chỉnh, bộ đồ lưu sẵn và phản ứng cục bộ. Trang **Giao diện** cho đổi chủ đề, màu nhấn, nền và mức chuyển động.
- **Trò chơi** có thử thách nhảy đảo, lượn qua vòng, vượt suối, giải đố hang băng, nhảy theo nhạc, luyện gõ, săn kho báu và nhiều hoạt động khác. Các trò theo chặng lưu kỷ lục riêng. Phòng 3D có năm trò, camera xoay và chế độ bản đồ 2D.
- **Trợ lý** có 11 chế độ học, hỗ trợ trả lời bằng tiếng Việt hoặc tiếng Anh, dừng tạo câu trả lời và tùy chọn lưu lịch sử trên thiết bị. Groq chạy mô hình `openai/gpt-oss-120b` sau Supabase Edge Function. Phần điều hướng có tùy chọn tiếng Anh. Một số học liệu và trò chơi dùng tiếng Việt.
- **Phòng học sinh** mở sẵn các đề tự học. Để tổ chức thảo luận trực tuyến, quản trị viên triển khai migration, phân công kiểm duyệt và mở dịch vụ theo hướng dẫn Supabase.

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
