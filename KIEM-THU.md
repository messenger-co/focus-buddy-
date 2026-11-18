# Kiểm thử Bạn Đồng Hành

33 kiểm thử giao diện, tiến trình và tin nhắn và 15 kiểm thử Edge Function đạt. Bản dựng production dùng `/focus-buddy-/`. Handler kiểm tra JWT, dữ liệu đầu vào, hạn mức, SSE và không trả khóa riêng tư.

Đã thử trực tiếp Groq: HTTP 200, đúng openai/gpt-oss-120b và nhận câu trả lời tiếng Việt. Yêu cầu gửi User-Agent FocusBuddy/2.0; yêu cầu Python mặc định trước đó nhận HTTP 403. Chưa kiểm thử qua Edge Function đã triển khai. Cần quyền quản trị Supabase để đặt GROQ_API_KEY, GROQ_MODEL và triển khai hàm mới. Không coi triển khai GitHub Pages là hoàn tất triển khai backend.

Ngoài các kiểm thử tự động trong kho, đã chạy bản dựng production bằng Chromium ở kích thước máy tính và điện thoại:

- Chơi đến khi hoàn thành cả năm trò, mở lại ván mới và quay về đồng hồ đang chạy. Thời điểm kết thúc của phiên và số điểm vẫn chính xác.
- Chọn Kỳ giông Đào và Cánh Cụt Băng, thử động tác vẫy tay, bốn phụ kiện mới và đổi chủ đề. Đã kiểm tra lựa chọn sau khi tải lại và khi bật giảm chuyển động.
- Ba phiên trình duyệt độc lập kết nối Supabase Realtime qua kênh của bản xem trước. Đã gửi và nhận hai chiều, ẩn tin, chuyển giữa hai phòng và vào lại cùng phòng. Tin của hai phòng được tách riêng và không có lịch sử phát lại.
