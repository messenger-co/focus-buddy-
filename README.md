# Bạn Đồng Hành 2.0 — góc học tập bằng tiếng Việt

Ứng dụng React chạy trên GitHub Pages. Bạn có thể tập trung 20 phút, làm bài tập, hoàn thành nhiệm vụ, nhận điểm kinh nghiệm và tùy chỉnh một người bạn nhỏ. **Tiến trình được lưu trên thiết bị; ứng dụng không dùng cơ sở dữ liệu học tập và không có bảng xếp hạng.**

Tài khoản Supabase chỉ dùng để xác thực khi trò chuyện với AI. Supabase Edge Function gọi OpenRouter bằng khóa riêng tư. Các tính năng học tập và bạn đồng hành hoạt động ngay cả khi chưa cấu hình AI hoặc chưa đăng nhập.

## Tính năng

- Đồng hồ 20 phút tiếp tục theo thời điểm kết thúc đã lưu khi tải lại trang; hoàn thành đủ phiên nhận 50 điểm.
- Điểm danh cảm xúc mỗi ngày theo giờ Việt Nam: 10 điểm; lần đầu trả lời đúng mỗi bài tập: 30 điểm. Mỗi 100 điểm tăng một cấp.
- Nhiệm vụ, thành tích và biểu đồ hành trình dựa trên tiến trình của thiết bị hiện tại.
- Sáu người bạn: Cáo Mây, Cú Mơ, Mèo Mít, Thỏ Bông, Gấu Trúc và Rồng Đậu.
- Sáu màu khăn, bốn lựa chọn phụ kiện, ba cảnh nền và tên riêng cho bạn nhỏ.
- Tương tác vuốt ve, cho ăn và chơi đùa. Các tương tác này tạo phản ứng vui, không tự cộng điểm học tập.
- Hoạt ảnh tôn trọng tùy chọn giảm chuyển động; chuyển động trang trí dừng trong phiên tập trung.
- Gợi ý trò chuyện ngoại tuyến có nhãn rõ ràng; AI trực tuyến cần đăng nhập và Edge Function đã triển khai.

## Chạy và kiểm tra trên máy

Cài Node.js 22.12 trở lên, rồi chạy trong thư mục dự án:

```bash
npm ci
npm run dev
```

Mở URL Vite in ra. Không cần khóa dịch vụ để dùng các chức năng cục bộ.

```bash
npm test
npm run test:edge
npm run build
npm run preview
```

Bản dựng tĩnh nằm trong `dist/`. Không mở `dist/index.html` qua `file://`; dùng máy chủ HTTP như `npm run preview`.

## Tiến trình và quyền riêng tư

Tiến trình nằm trong `localStorage`, khóa `focus-buddy-demo-v2`. Bản lưu từ phiên bản trước được giữ lại và bổ sung giá trị mặc định cho các tùy chỉnh mới. Đăng nhập, đăng xuất hoặc đổi tài khoản AI không thay thế tiến trình cục bộ và không tải điểm lên máy chủ.

Xóa dữ liệu trang, chuyển trình duyệt hoặc đổi nguồn trang có thể làm bạn không còn thấy tiến trình cũ. Những người dùng chung một trình duyệt và nguồn trang cũng dùng chung tiến trình này. Điểm cục bộ có thể sửa bằng công cụ trình duyệt nên không được dùng làm bằng chứng thành tích của trường học.

Không có migration SQL, bảng hồ sơ, RLS cho dữ liệu học tập hay bộ đếm hạn mức trong PostgreSQL cần triển khai. Supabase Auth vẫn quản lý tài khoản trong hệ thống xác thực riêng của nền tảng. Nếu bạn từng tự tạo bảng học tập từ một bản cũ, việc cập nhật mã nguồn này không tự xóa dữ liệu đó; hãy sao lưu và xử lý riêng nếu cần.

## GitHub Pages

Kho hiện tại: `https://github.com/messenger-co/focus-buddy-`

Địa chỉ trang: `https://messenger-co.github.io/focus-buddy-/`

**Tên kho có dấu gạch nối ở cuối. Đường dẫn Vite phải là `/focus-buddy-/`.**

Quy trình `.github/workflows/deploy.yml` chạy khi đẩy mã lên `main` hoặc chạy thủ công. Nó cài thư viện, chạy kiểm thử giao diện và Edge Function, biên dịch rồi xuất bản `dist/` bằng GitHub Actions chính thức.

Trong **Settings → Pages**, chọn nguồn **GitHub Actions**. Trong **Settings → Secrets and variables → Actions → Variables**, cấu hình:

| Biến công khai                  | Giá trị                                    |
| ------------------------------- | ------------------------------------------ |
| `VITE_BASE_PATH`                | `/focus-buddy-/`                           |
| `VITE_SUPABASE_URL`             | `https://lrihuhrfsnmkwcvouudd.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Khóa publishable của cùng dự án            |

Các biến Vite được nhúng vào tệp JavaScript công khai. **Không đặt khóa OpenRouter, khóa Supabase đặc quyền hoặc token quản trị vào biến Vite hay Git.** Chỉ khóa publishable được dùng ở giao diện.

Với một kho khác, Vite tự suy ra đường dẫn từ `GITHUB_REPOSITORY` khi `VITE_BASE_PATH` để trống. Kho `USERNAME.github.io` dùng `/`; kho dự án dùng `/TÊN-KHO/`. Các trang con dùng HashRouter, ví dụ `/focus-buddy-/#/ban-dong-hanh`, nên tải lại không cần máy chủ định tuyến.

Cấu hình phát triển cục bộ: sao chép `.env.example` thành `.env.local`, điền các biến công khai rồi khởi động lại Vite. Khi thay biến trong GitHub, chạy lại quy trình để tạo bản dựng mới.

## Bật AI: Supabase Auth và Edge Function

Chủ dự án cần quyền quản trị Supabase để hoàn tất phần này. Khóa publishable không cấp quyền triển khai hàm hoặc đặt secrets.

### 1. Cấu hình đăng nhập

Trong dự án `lrihuhrfsnmkwcvouudd`, mở **Authentication → Providers** và bật Email. Cấu hình SMTP phù hợp khi sử dụng thật.

Tại **Authentication → URL Configuration**, đặt cả **Site URL** và một mục trong **Redirect URLs** thành:

```text
https://messenger-co.github.io/focus-buddy-/
```

Khi phát triển, thêm `http://localhost:5173/` vào Redirect URLs. Không đưa phần `#` vào URL chuyển hướng. Luồng PKCE yêu cầu mở liên kết email bằng chính trình duyệt đã yêu cầu đăng nhập.

### 2. Đặt secrets phía máy chủ

Trong **Edge Functions → Secrets** của Supabase, thêm:

| Secret               | Giá trị                                       |
| -------------------- | --------------------------------------------- |
| `OPENROUTER_API_KEY` | Khóa riêng tư từ tài khoản OpenRouter của bạn |
| `OPENROUTER_MODEL`   | `nvidia/nemotron-3-ultra-550b-a55b:free`      |
| `ALLOWED_ORIGIN`     | `https://messenger-co.github.io`              |

Nhập khóa trực tiếp trong trang quản trị secrets; không gửi khóa vào hội thoại, mã nguồn hoặc tệp được đưa lên Git. `ALLOWED_ORIGIN` chỉ gồm giao thức và tên miền, không chứa đường dẫn kho hay dấu `/` cuối. Với thử nghiệm cục bộ, dùng `http://localhost:5173` và khôi phục nguồn thật trước khi vận hành.

Supabase tự cung cấp URL dự án và khóa công khai cần cho xác minh phiên bên trong Edge Function. Hàm không cần khóa `service_role` và không gọi PostgreSQL.

### 3. Triển khai hàm

Cài Supabase CLI theo hướng dẫn chính thức, rồi chạy trong thư mục kho:

```bash
supabase login
supabase link --project-ref lrihuhrfsnmkwcvouudd
supabase functions deploy chat
```

Không cần chạy SQL hoặc `supabase db push` cho phiên bản này. Cấu hình `supabase/config.toml` tắt bộ kiểm tra JWT cũ tại cổng API; **handler vẫn bắt buộc JWT và xác minh phiên qua Supabase Auth `/auth/v1/user`** trước khi gọi OpenRouter. Tài khoản ẩn danh không được gọi AI.

Giao diện chỉ gọi `https://lrihuhrfsnmkwcvouudd.supabase.co/functions/v1/chat`. Khóa OpenRouter chỉ được dùng trong yêu cầu từ Edge Function đến OpenRouter.

### 4. Kiểm tra sau triển khai

- Mở ứng dụng, mở trò chuyện và xác nhận dịch vụ đã sẵn sàng. Kiểm tra sức khỏe nằm tại `/functions/v1/chat/health`.
- Đăng nhập qua email trong cùng trình duyệt, gửi một câu hỏi tiếng Việt và xác nhận câu trả lời được truyền dần.
- Trong công cụ mạng của trình duyệt, yêu cầu AI phải đến Supabase Edge Function, không trực tiếp đến OpenRouter.
- Kiểm tra token bị thiếu hoặc không hợp lệ bị từ chối; thử đăng xuất và xác nhận điểm cục bộ vẫn còn.

## Mô hình miễn phí và giới hạn

Mặc định chọn **NVIDIA Nemotron 3 Ultra 550B A55B (free)**, một mô hình suy luận tổng quát mạnh đang có trong danh mục OpenRouter tại thời điểm cấu hình. Không có một mô hình mạnh nhất cho mọi loại câu hỏi; chất lượng và khả năng cung cấp có thể thay đổi.

Handler chỉ chấp nhận ID NVIDIA có hậu tố `:free`, kiểm tra giá trong danh mục OpenRouter và lưu kết quả tối đa năm phút. Yêu cầu đến nhà cung cấp giới hạn giá bằng 0. Nếu mô hình không còn miễn phí hoặc không xác minh được danh mục, hàm báo lỗi; **không tự chuyển sang mô hình trả phí**. Miễn phí vẫn có hạn mức và có thể hết công suất.

Giới hạn một yêu cầu: 12 tin nhắn, tối đa 4.000 ký tự mỗi tin, tổng 8.000 ký tự và 24.000 byte; tối đa 1.800 token đầu ra; thời gian chờ OpenRouter 60 giây.

Bộ giới hạn dùng RAM: 20 yêu cầu mỗi tài khoản mỗi giờ và tổng 200 yêu cầu mỗi giờ **trong từng isolate đang chạy**. Bộ đếm mất khi isolate khởi động lại và không chia sẻ giữa các isolate. Đây là giới hạn hỗ trợ trong kiến trúc không cơ sở dữ liệu, không phải hạn mức bền vững toàn hệ thống. Hạn mức của OpenRouter vẫn áp dụng độc lập.

## Cập nhật và xử lý lỗi

```bash
npm ci
npm test
npm run test:edge
npm run build
git add .
git commit -m "Cập nhật Bạn Đồng Hành"
git push origin main
```

GitHub Actions cập nhật giao diện. Thay đổi mã Edge Function cần chạy lại `supabase functions deploy chat`.

| Hiện tượng                                      | Cách xử lý                                                                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trang trắng hoặc tài nguyên 404                 | Kiểm tra dấu gạch nối cuối của kho, `VITE_BASE_PATH=/focus-buddy-/`, và trạng thái Actions.                                                                                                       |
| Tải lại trang con bị 404                        | Dùng URL có dấu `#` do ứng dụng tạo.                                                                                                                                                              |
| AI báo chưa triển khai                          | Triển khai hàm `chat` trong đúng dự án Supabase; kiểm tra `/chat/health`.                                                                                                                         |
| AI chưa được cấu hình đầy đủ                    | Kiểm tra ba secrets và nguồn CORS đúng tên miền.                                                                                                                                                  |
| Email đăng nhập không đến                       | Kiểm tra thư rác, SMTP, hạn mức gửi và cấu hình Email provider.                                                                                                                                   |
| Đăng nhập không hoàn tất                        | Kiểm tra Site URL/Redirect URLs và mở email trên cùng trình duyệt đã yêu cầu.                                                                                                                     |
| AI báo phiên không hợp lệ                       | Đăng nhập lại; xác nhận giao diện và Edge Function dùng cùng dự án.                                                                                                                               |
| AI báo hết lượt                                 | Chờ hạn mức trong giờ mới hoặc hạn mức OpenRouter được phục hồi.                                                                                                                                  |
| AI báo chính sách dữ liệu chặn mô hình miễn phí | Chủ tài khoản tự xem lựa chọn tại https://openrouter.ai/settings/privacy. Ứng dụng không tự thay đổi sự đồng ý về sử dụng dữ liệu; một số mô hình miễn phí không phù hợp với chính sách hiện tại. |
| AI báo mô hình không khả dụng                   | Kiểm tra danh mục OpenRouter, chọn một ID NVIDIA `:free` có giá bằng 0 rồi cập nhật secret.                                                                                                       |
| Điểm hoặc bạn đồng hành không còn               | Kiểm tra đúng trình duyệt/nguồn trang; dữ liệu bị xóa hoặc chế độ riêng tư không bảo đảm lưu lâu dài.                                                                                             |

Trạng thái bàn giao và giới hạn kiểm thử nằm trong [KIEM-THU.md](KIEM-THU.md). Bản dựng thành công không đồng nghĩa Edge Function đã được triển khai bằng tài khoản của bạn.
