# Edge Function cho trợ lý

Trình duyệt gửi lịch sử rút gọn, chế độ học và ngôn ngữ đến `/functions/v1/chat` kèm access token của phiên Supabase. Handler xác minh JWT qua Auth, kiểm tra nguồn được phép và chọn hướng dẫn hệ thống tương ứng trong danh mục phía máy chủ. Hàm gọi `https://api.groq.com/openai/v1/chat/completions` với mô hình `openai/gpt-oss-120b` và chuyển nội dung trả lời về giao diện dưới dạng luồng.

Một lượt có tối đa 12 tin nhắn, tổng cộng 8.000 ký tự và 1.800 token đầu ra. Thời gian đợi Groq tối đa 60 giây. Bộ đếm trong mỗi isolate cho phép 20 lượt/người/giờ và 200 lượt/isolate/giờ. Các isolate có bộ nhớ riêng và bộ đếm đặt lại khi khởi động. Hạn mức tài khoản Groq vẫn áp dụng.

Từ thư mục gốc, chạy `npm run test:edge` để kiểm tra xác thực, chính sách nguồn, giới hạn, chọn chế độ, truyền luồng và lỗi nhà cung cấp. Các kiểm thử dùng phản hồi mô phỏng. Xem [hướng dẫn triển khai và xác nhận kết nối thực tế](../README.md).
