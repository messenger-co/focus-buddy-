# Triển khai trợ lý Groq

Giao diện tiếng Việt chạy trên GitHub Pages tại https://messenger-co.github.io/focus-buddy-/ với base `/focus-buddy-/`. Tiến trình và bạn đồng hành lưu cục bộ; không dùng bảng dữ liệu học tập hoặc bảng xếp hạng.

Chatbot dùng `openai/gpt-oss-120b` qua `https://api.groq.com/openai/v1/chat/completions`. Khi gửi câu hỏi cho AI, trình duyệt chỉ gọi Supabase Edge Function; khóa Groq chỉ được lưu phía máy chủ.

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

## Bạn đồng hành và trò chơi

Mở **Bạn đồng hành** để chọn nhân vật và đặt tên. Thẻ **Phong cách** đổi khăn và phụ kiện. Trong thẻ **Không gian**, chọn chủ đề Đồng cỏ, Thủy triều hoặc Chạng vạng cho ứng dụng và chọn riêng cảnh nền của bạn nhỏ. Các lựa chọn được lưu cùng tiến trình trên trình duyệt.

Trong **Trò chơi tập trung**, bạn điều khiển chính bạn đồng hành đã chọn, với màu khăn và phụ kiện đang đeo. Mỗi trò phiêu lưu có ba chặng.

- **Bước nhảy Đảo Mây** dùng phím trái/phải hoặc A/D để chạy. Nhấn phím Cách hoặc mũi tên lên để nhảy, nhấn lần nữa trên không để nhảy đôi. Bật nấm lò xo, đón đảo đang trôi và thu tinh thể trên đường đến cổng sao.
- **Cánh lượn ngân hà** dùng phím Cách hoặc mũi tên lên để điều khiển cánh diều. Giữ để bay lên, thả để hạ xuống. Bay qua các vòng sáng và tránh mây giông để tới vạch đích.

Điện thoại có các nút điều khiển ngay dưới khung chơi. Dùng nút tạm dừng hoặc phím Esc khi muốn nghỉ. Nếu trượt sau khi qua cờ giữa chặng, bạn sẽ tiếp tục ở cờ cùng số vật phẩm đã nhặt. Trình duyệt lưu kỷ lục riêng của mỗi chặng theo số vật phẩm, rồi theo thời gian về đích.

Mục **Thử thách nhanh** có năm trò luyện trí nhớ, quan sát, chú ý, suy luận và ngôn ngữ. Bạn có thể mở bất kỳ trò nào từ đồng hồ rồi quay về. Đồng hồ vẫn đếm đến thời điểm kết thúc của phiên học.

## Phòng thảo luận công khai

Trang `/#/thao-luan` có ba phòng tiếng Việt. Khi học sinh chọn **Vào phòng**, trình duyệt đăng ký một kênh Broadcast công khai của Supabase Realtime trên WebSocket. Bạn cần biến Vite công khai của dự án Supabase và bật quyền truy cập kênh công khai trong cấu hình Realtime. Các phòng dùng luôn khóa publishable. Không có bước SQL hay triển khai Edge Function riêng cho tính năng này.

Tin nhắn chỉ xuất hiện với người đang ở cùng phòng. Ứng dụng giữ tối đa 80 tin gần nhất trong bộ nhớ và xóa chúng khỏi màn hình khi rời phòng. Biệt danh được tạo cho lần mở trang. Trình duyệt ký từng tin bằng Web Crypto và kiểm tra chữ ký cùng tên phòng khi nhận. Một biệt danh đại diện cho một phiên trình duyệt. Phòng công khai cho phép mọi người có đường dẫn tham gia.

Mỗi tin dài tối đa 320 ký tự. Ứng dụng giãn cách các lượt gửi ba giây và cho phép ẩn người gửi trên thẻ trình duyệt của mình. Đây là giới hạn phía trình duyệt. Phiên bản này chưa có kiểm duyệt viên hay chức năng cấm một người trên toàn dịch vụ. Tiến trình học tập và thông tin tài khoản không xuất hiện trong phòng.

Để thử, mở cùng địa chỉ trong hai phiên trình duyệt độc lập, vào cùng một phòng, gửi rồi trả lời một câu hỏi. Đổi sang phòng khác để kiểm tra phân tách. Bản xem trước trên localhost dùng kênh riêng theo nguồn trang.
