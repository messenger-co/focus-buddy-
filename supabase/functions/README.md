# Trợ lý AI không dùng cơ sở dữ liệu ứng dụng

Hàm `chat` chỉ dùng Supabase Auth để xác minh JWT và OpenRouter để trả lời. Không có yêu cầu tới SQL, bảng dữ liệu, RPC hoặc khóa `service_role`. Tiến trình học tập được giữ trong trình duyệt.

Mô hình mặc định: `google/gemma-4-31b-it:free`. Đây là lựa chọn Google Gemma 4 31B miễn phí; không phải khẳng định đứng đầu mọi bài đo. `OPENROUTER_MODEL` phải khớp chính xác mã trên; hàm từ chối mô hình khác và bản trả phí.

Trước khi gọi AI, hàm kiểm tra mô hình có trong danh mục OpenRouter với giá bằng 0; kết quả được lưu tối đa 5 phút trong bộ nhớ. Yêu cầu gửi `max_price` bằng 0 và tắt chuyển nhà cung cấp dự phòng. Khi không xác minh được miễn phí, hàm từ chối yêu cầu. Không chuyển sang mô hình trả phí.

Secrets cần đặt: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `ALLOWED_ORIGIN`. Supabase cung cấp `SUPABASE_URL` và `SUPABASE_ANON_KEY` cho môi trường hàm. `ALLOWED_ORIGIN` của bản GitHub Pages là `https://messenger-co.github.io`.

Hạn mức: 20 yêu cầu mỗi tài khoản mỗi giờ, tối đa 200 yêu cầu mỗi giờ trên mỗi isolate. Bộ đếm nằm trong RAM, mất khi isolate khởi động lại và không chia sẻ giữa các isolate. Đây là giới hạn hỗ trợ, không phải hạn mức toàn hệ thống bền vững. Không lưu hội thoại hoặc điểm số trên máy chủ.

Đầu vào tối đa 12 tin, 4.000 ký tự/tin, tổng 8.000 ký tự, 24.000 byte. Đầu ra tối đa 1.800 token bao gồm phần suy luận của mô hình. Giới hạn thời gian chờ 60 giây. Phản hồi SSE chỉ chứa nội dung trả lời và lỗi đã được chuyển sang tiếng Việt.

`GET /functions/v1/chat/health` trả `{ready, model, message}` khi cấu hình cơ bản hợp lệ; `model` là tên công khai, không phải khóa. Kết quả không chứng minh tài khoản OpenRouter đủ hạn mức hoặc mô hình trả lời được. `POST /functions/v1/chat` bắt buộc Bearer JWT hợp lệ kể cả phiên khách ẩn danh đã được Supabase xác minh.

Nếu OpenRouter báo lỗi liên quan chính sách dữ liệu của mô hình miễn phí, chủ tài khoản cần tự xem lại lựa chọn tại `https://openrouter.ai/settings/privacy`. Ứng dụng giữ `data_collection: deny` và không tự thay đổi sự đồng ý về dữ liệu. Một mô hình có tên trong danh mục có thể vẫn không dùng được với chính sách tài khoản hiện tại.

Triển khai bằng `supabase functions deploy chat` sau khi đăng nhập CLI và liên kết đúng dự án. Không cần chạy migration. Kiểm thử với `npm run test:edge`; kiểm tra đầu vào Deno bằng `deno check supabase/functions/chat/index.ts`.
