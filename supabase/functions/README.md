# Triển khai trợ lý Groq

Giao diện tiếng Việt chạy trên GitHub Pages tại https://messenger-co.github.io/focus-buddy-/ với base `/focus-buddy-/`. Tiến trình và bạn đồng hành lưu cục bộ; không dùng bảng dữ liệu học tập hoặc bảng xếp hạng.

Chatbot dùng `openai/gpt-oss-120b` qua `https://api.groq.com/openai/v1/chat/completions`. Trình duyệt chỉ gọi Supabase Edge Function; khóa Groq chỉ được lưu phía máy chủ.

Trong Supabase dự án `lrihuhrfsnmkwcvouudd`, bật Anonymous Sign-Ins và đặt Edge Function secrets:

- `GROQ_API_KEY`: khóa Groq riêng tư.
- `GROQ_MODEL`: `openai/gpt-oss-120b`.
- `ALLOWED_ORIGIN`: `https://messenger-co.github.io`.

Không đưa khóa Groq vào Git hoặc biến Vite. Khóa publishable Supabase được phép dùng ở frontend. Biến GitHub Actions: `VITE_BASE_PATH=/focus-buddy-/`, `VITE_SUPABASE_URL=https://lrihuhrfsnmkwcvouudd.supabase.co`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Từ thư mục gốc kho đã cập nhật:

```bash
npm ci
npm test
npm run test:edge
npm run build
supabase login
supabase functions deploy chat --project-ref lrihuhrfsnmkwcvouudd
```

GitHub Actions tự xuất bản giao diện khi push main; không tự triển khai Supabase. Người có quyền quản trị cần đặt secrets và triển khai hàm. Kiểm tra `/functions/v1/chat/health` trả đúng mô hình, sau đó thử câu hỏi thật bằng phiên khách.

Handler xác minh JWT qua Supabase Auth, kiểm tra nguồn và đầu vào, giới hạn 1.800 token, thời gian chờ 60 giây và che lỗi nhà cung cấp. Hạn mức RAM 20 lượt/người/giờ và 200 lượt/isolate/giờ không bền vững qua khởi động lại hoặc chia sẻ giữa isolate. Giới hạn và phí sử dụng phụ thuộc gói Groq; ứng dụng không bảo đảm miễn phí. Không tự chuyển mô hình hoặc nhà cung cấp.
