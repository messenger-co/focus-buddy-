# Kiểm thử Focus Buddy 3.0

## Các lệnh kiểm tra

| Lệnh | Phạm vi |
| --- | --- |
| `npm test` | Giao diện, tiến trình đã lưu, đồng hồ, trò chơi theo chặng, đường đi trong năm thế giới 3D, điều khiển, âm nhạc và thử thách |
| `npm run test:edge` | JWT, xác thực nguồn gọi, mô hình Groq, chế độ học, giới hạn, hủy và xử lý lỗi với nhà cung cấp mô phỏng |
| `npm run test:community` | Áp dụng migration lên PostgreSQL cục bộ, kiểm tra quyền của từng vai trò, tư cách thành viên, kiểm duyệt, chặn, báo cáo, hạn mức và dọn dữ liệu |
| `VITE_BASE_PATH=/focus-buddy-/ npm run build` | Kiểm tra TypeScript và đóng gói trang tĩnh với đường dẫn của kho |

## Kiểm tra trên trình duyệt

- Mở `/#/tro-choi/dao-xanh`. Địa chỉ phải chuyển về `/#/tro-choi`. Kiểm tra kệ vẫn mở được Buddy Runner, vườn, các trò có sáu chặng và hoạt động sáng tạo.
- Mở một phiên học, chuyển trang và tải lại. Kiểm tra thời điểm kết thúc, tạm dừng, tiếp tục, lưu ghi chú và quay về từ trò chơi trong giờ nghỉ.
- Chọn Buddy, thay phụ kiện, lưu trang phục rồi tải lại. Thử đổi chủ đề, ngôn ngữ và tắt chuyển động. Kiểm tra bằng bàn phím và kích thước điện thoại.
- Chơi một chặng bằng bàn phím rồi bằng nút chạm, kiểm tra kỷ lục và chơi lại. Trong câu lạc bộ, thử hoạt động vận động, giải đố và lưu tranh, khu vườn, cách bài trí.
- Mở phòng 3D, xoay camera, đổi đèn và thử năm trò. Chọn bản đồ 2D hoặc tắt WebGL rồi tải lại. Sau khi đã ghé một trò và service worker đã sẵn sàng, tải lại khi ngoại tuyến.
- Với trợ lý, kiểm tra health trả đúng mô hình. Để xác nhận hoạt động thật của Groq, gửi một câu hỏi ngắn, kiểm tra văn bản trả về và nút dừng. Health kiểm tra cấu hình. Một lượt sinh thật sử dụng hạn mức của tài khoản.
- Dùng hai tài khoản học sinh và một kiểm duyệt viên trên dự án thử nghiệm để xác nhận Realtime, email đã xác minh và quyền điều hành trước khi mở phòng chính. Xem [các bước quản trị](supabase/README.md).
