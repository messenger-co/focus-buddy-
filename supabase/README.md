# Supabase chỉ phục vụ xác thực AI và Edge Function

Phiên bản hiện tại không dùng bảng dữ liệu học tập, migration SQL, RLS hoặc bộ đếm PostgreSQL. Tiến trình, điểm, nhiệm vụ và tùy chỉnh bạn đồng hành được lưu trong trình duyệt.

Supabase Auth quản lý phiên khách và cấp JWT để xác thực yêu cầu AI. Edge Function `chat` xác minh JWT qua Auth rồi gọi OpenRouter. Không cần khóa `service_role`.

## Triển khai

1. Bật **Authentication → Sign In / Providers → Anonymous Sign-Ins** trong dự án `lrihuhrfsnmkwcvouudd`.
2. Trong Edge Functions → Secrets, đặt `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=google/gemma-4-31b-it:free`, `ALLOWED_ORIGIN=https://messenger-co.github.io`.
3. Chạy từ thư mục gốc kho:

```bash
supabase login
supabase link --project-ref lrihuhrfsnmkwcvouudd
supabase functions deploy chat
```

Không chạy migration hoặc `supabase db push`. Tệp `.env.edge.example` chỉ mô tả tên biến, không chứa khóa thật. Nhập khóa trực tiếp qua trang quản trị secrets; không đưa vào Git.

`verify_jwt=false` trong `config.toml` tắt bộ kiểm tra cổng cũ để hỗ trợ các khóa ký hiện tại. Điều này không mở quyền gọi AI: handler vẫn yêu cầu Bearer JWT hợp lệ, kiểm tra qua `/auth/v1/user` và chấp nhận phiên khách đã được xác minh. CORS kiểm tra đúng nguồn nhưng không thay thế JWT.

## Endpoint

- `GET /functions/v1/chat/health`: thông báo dịch vụ có đủ cấu hình hay chưa; không trả khóa và không chứng minh nhà cung cấp AI đang đáp ứng.
- `POST /functions/v1/chat`: cần JWT; nhận `{messages:[{role:"user"|"assistant",content:string}]}` và trả nội dung SSE.

Hàm chỉ dùng `google/gemma-4-31b-it:free` được danh mục OpenRouter xác nhận có giá bằng 0. Danh mục lưu tối đa năm phút; yêu cầu nhà cung cấp đặt giá tối đa bằng 0 và không có chuyển đổi sang mô hình trả phí.

Hạn mức RAM là 20 lượt/người/giờ và 200 lượt/giờ trong từng isolate. Các isolate không dùng chung bộ đếm; khởi động lại làm mất bộ đếm. Không coi đây là giới hạn bền vững trên toàn dịch vụ. Giới hạn đầu ra là 1.800 token và thời gian chờ 60 giây.

Kiểm thử handler từ gốc kho bằng `npm run test:edge`. Hướng dẫn đầy đủ nằm trong [README chính](../README.md).
