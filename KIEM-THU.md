# Kiểm tra bản lưu trên thiết bị

## Kết quả đã thực hiện

- 30/30 kiểm thử giao diện, tiến trình cục bộ, bộ đọc SSE và đường dẫn đạt.
- 16/16 kiểm thử Edge Function đạt; kiểm tra Deno cho điểm vào hàm đạt.
- Bản dựng production cho `/focus-buddy-/` thành công; tài nguyên và phông tiếng Việt tồn tại, gói tùy chỉnh bạn đồng hành tải riêng.
- Đã quét các tệp chuẩn bị commit và bản dựng, không phát hiện khóa riêng tư.
- Đã kiểm tra mô hình NVIDIA Nemotron Ultra miễn phí có trong danh mục OpenRouter. Yêu cầu thử thật bị tài khoản OpenRouter chặn bởi chính sách dữ liệu của mô hình miễn phí (HTTP 404); chưa xác nhận nhận được câu trả lời AI thật.
- Chưa xem trực quan bằng trình duyệt vì phiên này không cung cấp công cụ trình duyệt. Kiểm thử tương tác dùng DOM mô phỏng.
- Triển khai Edge Function vẫn cần quyền quản trị Supabase. Không có migration SQL cần chạy.

Các nhóm cần kiểm tra trước khi xuất bản:

- Tiến trình cũ được giữ lại, không còn trường tham gia bảng xếp hạng.
- Điểm danh, bài tập, phiên tập trung 20 phút, nhiệm vụ và thành tích hoạt động không cần tài khoản.
- Đăng nhập, đăng xuất và đổi tài khoản AI không chuyển hoặc xóa tiến trình cục bộ; không gọi RPC hay bảng dữ liệu học tập.
- Sáu nhân vật, màu khăn, phụ kiện, cảnh nền và tên riêng lưu được; tương tác chơi, cho ăn và vuốt ve không cộng điểm.
- Chuyển động dừng khi tập trung và tôn trọng tùy chọn giảm chuyển động.
- Chat có nhãn gợi ý ngoại tuyến; dịch vụ chưa triển khai hoặc cấu hình lỗi không được mô tả là AI đang hoạt động.
- Edge Function xác minh JWT, kiểm tra dữ liệu, giới hạn RAM, giới hạn token, truyền SSE và che lỗi nhà cung cấp.
- Chỉ mô hình NVIDIA `:free` có giá 0 được gọi; lỗi danh mục hoặc mô hình trả phí bị chặn.
- Bản dựng đúng `/focus-buddy-/`, không lộ khóa riêng tư và không chứa tài nguyên sai đường dẫn.

## Lệnh kiểm thử

```bash
npm test
npm run test:edge
npm run build
```

Kiểm thử DOM và kiểm thử handler dùng các phản hồi giả lập phù hợp; chúng không thay thế việc xem bố cục trong trình duyệt và thử đăng nhập, email, mô hình OpenRouter trên dịch vụ thật.

## Phần cần quyền quản trị dự án

Supabase Edge Function phải được triển khai và đặt secrets bởi người có quyền quản trị. Khóa publishable không làm được các thao tác đó. Không còn bước triển khai SQL hoặc kiểm thử RLS cho dữ liệu học tập.

Sau triển khai, kiểm tra endpoint sức khỏe, đăng nhập email, một câu trả lời AI thật và các lỗi phiên hết hạn. Kiểm tra sức khỏe chỉ xác nhận cấu hình cơ bản, không bảo đảm mô hình luôn khả dụng.

## Giới hạn đã biết

- Dữ liệu chỉ thuộc trình duyệt và nguồn trang hiện tại; không đồng bộ giữa thiết bị.
- Hạn mức AI lưu trong RAM theo từng isolate, không bền vững khi khởi động lại và không áp dụng chung cho mọi isolate.
- Mô hình miễn phí có hạn mức và khả năng cung cấp do OpenRouter quyết định; ứng dụng không tự chuyển sang mô hình trả phí.
- Các tương tác với bạn đồng hành chỉ là hoạt động vui, không xác nhận thành tích học tập.
