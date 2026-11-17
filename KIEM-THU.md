# Kiểm tra bản Supabase Edge Functions

- 22 kiểm thử giao diện đạt.
- 11 kiểm thử Edge Function đạt: JWT qua Supabase Auth, CORS, kiểm tra nội dung, hạn mức, SSE và lỗi an toàn.
- Bản dựng TypeScript/Vite thành công.
- Kiểm thử SQL trên PostgreSQL nhúng: migration, RLS, phần thưởng duy nhất, hạn mức 20 lượt/giờ và cấm học sinh gọi bộ đếm.
- Chưa triển khai GitHub Pages hoặc Supabase thật. Chưa thử mô hình OpenRouter với tài khoản thật và chưa xem giao diện bằng trình duyệt.

Chạy `npm test`, `npm run test:edge`, `npm run build`. Với cơ sở dữ liệu thử đã áp dụng hai migration, chạy lần lượt `supabase/tests/security.sql` và `supabase/tests/ai_quota.sql` bằng tài khoản quản trị.
