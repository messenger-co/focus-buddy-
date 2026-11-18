# Kiểm thử Groq

31 kiểm thử giao diện và 15 kiểm thử Edge Function đạt. Bản dựng production dùng `/focus-buddy-/`. Handler kiểm tra JWT, dữ liệu đầu vào, hạn mức, SSE và không trả khóa riêng tư.

Lần thử trực tiếp Groq từ môi trường phát triển nhận HTTP 403; chưa xác nhận câu trả lời thật. Cần quyền quản trị Supabase để đặt GROQ_API_KEY, GROQ_MODEL và triển khai hàm mới. Không coi triển khai GitHub Pages là hoàn tất triển khai backend.

Kiểm thử giao diện dùng DOM mô phỏng; chưa kiểm tra trực quan bằng trình duyệt.
