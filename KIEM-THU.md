# Kiểm thử Groq

31 kiểm thử giao diện và 15 kiểm thử Edge Function đạt. Bản dựng production dùng `/focus-buddy-/`. Handler kiểm tra JWT, dữ liệu đầu vào, hạn mức, SSE và không trả khóa riêng tư.

Đã thử trực tiếp Groq: HTTP 200, đúng openai/gpt-oss-120b và nhận câu trả lời tiếng Việt. Yêu cầu gửi User-Agent FocusBuddy/2.0; yêu cầu Python mặc định trước đó nhận HTTP 403. Chưa kiểm thử qua Edge Function đã triển khai. Cần quyền quản trị Supabase để đặt GROQ_API_KEY, GROQ_MODEL và triển khai hàm mới. Không coi triển khai GitHub Pages là hoàn tất triển khai backend.

Kiểm thử giao diện dùng DOM mô phỏng; chưa kiểm tra trực quan bằng trình duyệt.
