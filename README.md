# Focus Buddy 2.0 — Bạn đồng hành học tập

Ứng dụng học tập bằng tiếng Việt, với bạn đồng hành hoạt hình, phiên tập trung 20 phút, bài tập ngắn, nhiệm vụ, điểm kinh nghiệm, cấp độ và bảng xếp hạng. Giao diện được biên dịch thành các tệp tĩnh để chạy trực tiếp trên GitHub Pages.

Bản này được xây dựng mới từ bản yêu cầu đã cung cấp; tệp đính kèm không có mã nguồn ứng dụng cũ để đối chiếu. Chế độ dùng thử chạy ngay mà không cần khóa API. Các dịch vụ trực tuyến chỉ hoạt động sau khi chủ dự án hoàn thành cấu hình bên dưới.

## Kiến trúc

| Thành phần           | Công nghệ                              | Vai trò                                                            |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Giao diện            | React, TypeScript, Vite, Tailwind CSS  | Bản dựng tĩnh trong `dist/`, lưu trữ trên GitHub Pages             |
| Điều hướng           | HashRouter                             | Đường dẫn sau dấu `#`, tải lại trang không cần máy chủ chuyển tiếp |
| Dữ liệu và tài khoản | Supabase PostgreSQL, Supabase Auth     | Hồ sơ, tiến độ, phần thưởng đã xác thực, xếp hạng có sự đồng ý     |
| Trợ lý học tập       | Supabase Edge Function                      | Xác thực người dùng, giới hạn yêu cầu và truyền dần câu trả lời    |
| Mô hình AI           | OpenRouter, NVIDIA Nemotron            | Mô hình chọn qua cấu hình Edge Function                                   |
| Hoạt hình            | Motion for React, CSS, SVG tự thiết kế | Không cần dịch vụ hoạt hình trả phí                                |

GitHub Pages chỉ phục vụ tệp tĩnh; không chạy Express, Node.js thường trực hay kết xuất phía máy chủ. Supabase Edge Function là dịch vụ riêng, không nằm trong bản dựng giao diện.

## A. Chạy trên máy của bạn

Cài Node.js 22.12 trở lên và npm, sau đó mở thư mục mã nguồn trong thiết bị đầu cuối:

```bash
npm ci
npm run dev
```

Mở địa chỉ mà Vite in ra, thường là `http://localhost:5173/`. Lần cài đầu cũng có thể dùng `npm install`; tệp `package-lock.json` đã được cung cấp để `npm ci` cài đúng phiên bản thư viện.

Chế độ dùng thử không cần tệp `.env`: bạn có thể chọn và tùy chỉnh bạn đồng hành, điểm danh, bắt đầu phiên tập trung, làm bài tập, nhận điểm kinh nghiệm và xem nhiệm vụ. Tiến độ được lưu trong trình duyệt hiện tại. Bảng xếp hạng dùng thử được ghi rõ là dữ liệu hư cấu, không phải kết quả thật của trường học. Trợ lý dùng thử dùng nội dung có sẵn; kết nối AI thật cần cấu hình Edge Function và đăng nhập.

Xóa dữ liệu trang hoặc dùng một trình duyệt khác sẽ không giữ tiến độ dùng thử. Tiến độ dùng thử không phải bằng chứng học tập và không được tự chuyển thành điểm trực tuyến.

Kiểm tra bản dựng:

```bash
npm test
npm run build
npm run preview
```

`npm run build` tạo thư mục `dist/`. Phục vụ thư mục này bằng máy chủ HTTP; không mở trực tiếp `dist/index.html` bằng giao thức `file://`.

## B. Tạo kho GitHub

1. Đăng nhập GitHub, chọn **New repository** (kho mới).
2. Đặt tên, ví dụ `focus-buddy`. Với tài khoản GitHub Free, chọn kho **Public** (công khai) để dùng GitHub Pages miễn phí. Không đưa dữ liệu học sinh hay khóa bí mật vào kho.
3. Nếu đã có toàn bộ mã nguồn tại máy, tạo kho rỗng để tránh xung đột với README tự sinh.

Bạn có hai dạng địa chỉ:

| Tên kho              | Địa chỉ trang                             | Đường dẫn gốc   |
| -------------------- | ----------------------------------------- | --------------- |
| `focus-buddy`        | `https://USERNAME.github.io/focus-buddy/` | `/focus-buddy/` |
| `USERNAME.github.io` | `https://USERNAME.github.io/`             | `/`             |

Thay `USERNAME` bằng tên tài khoản hoặc tổ chức GitHub của bạn.

## C. Đưa mã nguồn lên GitHub

Trong thư mục dự án:

```bash
git init
git add .
git commit -m "Khởi tạo Focus Buddy tiếng Việt"
git branch -M main
git remote add origin https://github.com/USERNAME/focus-buddy.git
git push -u origin main
```

Thay địa chỉ kho bằng địa chỉ thực tế. Nếu thư mục đã là một kho Git, kiểm tra `git remote -v` trước khi thêm `origin`. Tệp `.gitignore` loại trừ thư viện, bản dựng và các tệp chứa biến môi trường cá nhân.

## D. Bật GitHub Pages

1. Mở kho trên GitHub → **Settings** (cài đặt) → **Pages**.
2. Tại **Build and deployment** (biên dịch và triển khai), chọn nguồn **GitHub Actions**.
3. Mở thẻ **Actions**, chọn **Triển khai GitHub Pages** → **Run workflow** (chạy quy trình), hoặc đẩy một thay đổi mới lên nhánh `main`.
4. Khi công việc triển khai thành công, mở địa chỉ hiển thị trong môi trường `github-pages`.

Không chọn xuất bản trực tiếp thư mục mã nguồn React. GitHub Actions sẽ biên dịch và tải đúng nội dung `dist/` lên Pages.

## E. Cấu hình GitHub Actions và đường dẫn

Quy trình `.github/workflows/deploy.yml` chạy khi có thay đổi trên `main` và hỗ trợ chạy thủ công. Nó cài Node.js, chạy `npm ci`, kiểm thử, chạy `npm run build` rồi triển khai bằng các Actions chính thức của GitHub. Công việc biên dịch chỉ được đọc mã nguồn; công việc triển khai có quyền `pages: write` và `id-token: write` cần thiết.

Vite tự suy ra đường dẫn từ `GITHUB_REPOSITORY` do GitHub Actions cung cấp: kho dự án dùng `/TÊN-KHO/`, kho `USERNAME.github.io` dùng `/`. Khi triển khai tên miền riêng hoặc cần ghi đè, đặt biến `VITE_BASE_PATH=/` hoặc đường dẫn phù hợp, có dấu `/` ở đầu và cuối.

Tại **Settings → Secrets and variables → Actions → Variables**, tạo các **Repository variables** (biến của kho) sau nếu sử dụng dịch vụ trực tuyến:

| Biến công khai                  | Ví dụ                                               |
| ------------------------------- | --------------------------------------------------- |
| `VITE_SUPABASE_URL`             | `https://PROJECT.supabase.co`                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Khóa publishable của dự án Supabase                 |
| `VITE_BASE_PATH`                | Không bắt buộc; để trống để tự suy ra               |

Các biến `VITE_*` được nhúng vào JavaScript công khai. **Không đặt khóa OpenRouter, khóa Supabase `service_role` hoặc khóa `secret` vào bất kỳ biến `VITE_*` nào.** Khóa publishable được phép công khai khi các chính sách bảo vệ dữ liệu đã được bật.

Thay đổi biến trong GitHub không cập nhật bản dựng hiện có. Hãy chạy lại quy trình triển khai. Để cấu hình khi phát triển trên máy, sao chép `.env.example` thành `.env.local`, điền các biến công khai và khởi động lại Vite.

## F. Cấu hình Supabase

1. Tạo dự án Supabase và chờ cơ sở dữ liệu sẵn sàng.
2. Mở **SQL Editor**, chạy lần lượt hai tệp trong `supabase/migrations/` theo thứ tự tên. Với các bản cập nhật sau, áp dụng các migration mới theo thứ tự tên. Không bỏ qua phần quyền truy cập, chính sách RLS hoặc dữ liệu bài tập ban đầu.
3. Tại phần API của dự án, lấy URL và khóa **publishable**. Điền vào các biến giao diện tương ứng. Không dùng khóa `service_role` hay `secret`.
4. Trong **Authentication → Providers**, bật đăng nhập bằng email. Cấu hình gửi email/SMTP cho môi trường sử dụng thật; dịch vụ email mặc định của Supabase có hạn mức.
5. Trong **Authentication → URL Configuration**, đặt **Site URL** là URL trang của bạn, gồm đường dẫn kho và dấu `/` cuối, ví dụ `https://USERNAME.github.io/focus-buddy/`.
6. Thêm đúng URL đó vào **Redirect URLs**. Khi phát triển, thêm `http://localhost:5173/`. Không thêm dấu `#` hay đường dẫn điều hướng nội bộ vào URL chuyển hướng đăng nhập.
7. Biên dịch lại giao diện, đăng nhập bằng đường dẫn được gửi qua email, sau đó kiểm tra cập nhật tiến độ.

Đăng nhập sử dụng luồng PKCE: mở đường dẫn trong email bằng **chính trình duyệt đã yêu cầu đăng nhập** để trình duyệt có thể hoàn tất xác minh. Đường dẫn chuyển hướng không có dấu `#`; sau đăng nhập, ứng dụng mới sử dụng các đường dẫn HashRouter.

Ứng dụng dùng tên hiển thị thay cho tên thật. Mỗi tài khoản chỉ đọc được dữ liệu riêng của mình. Điểm kinh nghiệm không được sửa trực tiếp từ trình duyệt: các hàm trong cơ sở dữ liệu xác minh điều kiện và ghi giao dịch thưởng một lần cho mỗi hoạt động hợp lệ.

Phiên tập trung trực tuyến được xác nhận bằng thời gian máy chủ, chỉ có một phiên đang hoạt động cho mỗi tài khoản và phiên quá 24 giờ không còn đủ điều kiện nhận thưởng. Điều này xác nhận đã đủ thời lượng của phiên, không chứng minh người học luôn chú ý. Bài tập được chấm tại máy chủ; bảng đáp án trong lược đồ `private` không được công khai. Một hoạt động đã nhận thưởng sẽ không tạo thêm thưởng khi gửi lại yêu cầu.

Ngày điểm danh được tính theo giờ Việt Nam (`Asia/Ho_Chi_Minh`). Điểm thưởng: 10 điểm cho lần điểm danh hợp lệ đầu tiên trong ngày, 50 điểm cho một phiên tập trung đủ 20 phút và 30 điểm cho lần đầu hoàn thành đúng mỗi bài tập. Mỗi 100 điểm tăng một cấp. Nhiệm vụ tổng hợp chính các hoạt động này; số điểm hiển thị không phải một phần thưởng thứ hai.

Bảng xếp hạng trực tuyến chỉ hiển thị tên giả, điểm và cấp độ của người đã bật tùy chọn tham gia. Người dùng có thể tắt tùy chọn để rút khỏi bảng xếp hạng. Không có kết quả dùng thử nào được ghi vào bảng xếp hạng thật.

Để kiểm thử phân quyền và phần thưởng, áp dụng migration trên một cơ sở dữ liệu **thử nghiệm** rồi chạy tệp sau bằng tài khoản quản trị PostgreSQL. Đặt `TEST_DATABASE_URL` trong phiên thiết bị đầu cuối của bạn; không ghi địa chỉ có mật khẩu vào Git.

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security.sql
```

Bộ kiểm thử tạo hai tài khoản mẫu, kiểm tra cách ly dữ liệu, ngăn sửa điểm, ngăn nhận thưởng lặp, xác minh thời lượng và quyền tham gia bảng xếp hạng. Dữ liệu kiểm thử được hoàn tác khi kết thúc giao dịch.

## G. Triển khai Supabase Edge Function

Cài Supabase CLI theo tài liệu chính thức, đăng nhập tài khoản sở hữu dự án:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set --env-file supabase/.env.edge.local
supabase functions deploy chat
```

Tạo `supabase/.env.edge.local` từ `supabase/.env.edge.example`. Tệp thật bị Git bỏ qua. Lưu `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` và `ALLOWED_ORIGIN` tại Edge Function secrets. Các biến SUPABASE_URL, SUPABASE_ANON_KEY và SUPABASE_SERVICE_ROLE_KEY được nền tảng cấp cho hàm. Không đưa khóa đặc quyền vào Vite.

`ALLOWED_ORIGIN` là `https://USERNAME.github.io`, không gồm đường dẫn kho hay dấu `/` cuối. Khi phát triển cục bộ, dùng `http://localhost:5173`.

Cấu hình `verify_jwt=false` chỉ tắt bộ kiểm tra JWT cũ của cổng API: hàm vẫn bắt buộc Bearer JWT và xác minh với Supabase Auth `/auth/v1/user` trước khi dùng ID tài khoản. Hàm từ chối tài khoản ẩn danh. CORS không thay thế xác thực.

Migration thứ hai cung cấp hạn mức bền vững 20 lượt/tài khoản/giờ qua cập nhật PostgreSQL nguyên tử. Chỉ service_role được gọi hàm hạn mức; học sinh không thể đặt lại bộ đếm. Hạn mức đầu vào: 12 tin, 4.000 ký tự/tin, tổng 8.000 ký tự, 24.000 byte. Đầu ra tối đa 1.000 token, thời gian chờ 60 giây. Lỗi nhà cung cấp được thay bằng thông báo tiếng Việt không chứa bí mật.

## H. Khóa OpenRouter và NVIDIA Nemotron

Chỉ đặt khóa OpenRouter trong Supabase Edge Function secrets. Chọn mã mô hình NVIDIA Nemotron hiện có trong danh mục OpenRouter cho `OPENROUTER_MODEL`; mô hình và hạn mức có thể thay đổi. Không sử dụng nhà cung cấp AI khác.

Giao diện gọi `${VITE_SUPABASE_URL}/functions/v1/chat` với JWT tài khoản. Chỉ Edge Function gọi OpenRouter, truyền câu trả lời SSE về trình duyệt.

```bash
npm run test:edge
```

## I. Cập nhật ứng dụng

```bash
npm ci
npm test
npm run build
git add .
git commit -m "Cập nhật nội dung học tập"
git push origin main
```

GitHub Actions sẽ tự triển khai giao diện mới. Thay đổi trong `supabase/functions/` cần chạy `supabase functions deploy chat`. Thay đổi cơ sở dữ liệu cần một tệp migration mới và phải được chạy trên Supabase; không chỉnh sửa lịch sử migration đã áp dụng rồi kỳ vọng cơ sở dữ liệu tự thay đổi.

Khi thêm hình ảnh hoặc tài nguyên, nhập chúng từ mã nguồn qua Vite hoặc dùng `import.meta.env.BASE_URL`; tránh đường dẫn cố định bắt đầu từ `/assets/`. Các liên kết bên trong ứng dụng dùng điều hướng HashRouter. Hoạt hình phải tôn trọng lựa chọn giảm chuyển động và dừng chuyển động trang trí trong phiên tập trung.

## J. Khắc phục sự cố

| Hiện tượng                                                | Cách kiểm tra và xử lý                                                                                                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trang trắng sau khi triển khai                            | Mở công cụ phát triển của trình duyệt, kiểm tra lỗi JavaScript và yêu cầu tài nguyên. Đảm bảo Actions đã hoàn tất và xuất bản `dist/`.                                  |
| JavaScript/CSS trả về 404                                 | Kiểm tra đường dẫn gốc. Kho dự án cần `/TÊN-KHO/`, kho `USERNAME.github.io` cần `/`. Sửa `VITE_BASE_PATH` nếu đã ghi đè sai rồi biên dịch lại.                          |
| Tải lại một trang con bị 404                              | URL điều hướng cần có dấu `#`, ví dụ `/focus-buddy/#/nhiem-vu`. Không dùng đường dẫn máy chủ `/focus-buddy/nhiem-vu`.                                                   |
| GitHub Actions không triển khai                           | Kiểm tra nhánh là `main`, Pages dùng nguồn GitHub Actions và Actions được phép chạy. Xem bước thất bại trong nhật ký công việc.                                         |
| Vẫn ở chế độ dùng thử                                     | Điền cả URL và khóa publishable Supabase, biên dịch lại rồi đăng nhập. Biến môi trường được đọc khi biên dịch, không phải khi mở trang.                                 |
| Không nhận được email đăng nhập                           | Kiểm tra thư rác, email provider, SMTP, hạn mức gửi và địa chỉ chuyển hướng cho phép trong Supabase.                                                                    |
| Đường dẫn đăng nhập quay về sai trang hoặc không hoàn tất | Đặt Site URL và Redirect URLs đúng cả giao thức, tên miền, đường dẫn kho và dấu `/` cuối; kiểm tra link chưa hết hạn và mở bằng chính trình duyệt đã yêu cầu đăng nhập. |
| Lỗi quyền hoặc tiến độ không lưu                          | Chạy đủ migration; kiểm tra tài khoản đã đăng nhập đúng dự án Supabase. Không tắt RLS để vượt lỗi.                                                                      |
| Lỗi CORS khi gọi AI                                       | `ALLOWED_ORIGIN` phải khớp nguồn trình duyệt, không chứa đường dẫn kho. Triển khai lại Edge Function sau khi sửa.                                                              |
| AI báo chưa đăng nhập hoặc 401                            | Đăng nhập lại; xác nhận Edge Function và giao diện dùng cùng dự án Supabase.                                                                                                   |
| AI báo quá nhiều yêu cầu hoặc 429                         | Chờ đến khi hết thời gian giới hạn. Kiểm tra giới hạn tại Edge Function và tài khoản OpenRouter.                                                                               |
| AI báo lỗi mô hình, hạn mức hoặc 502/503                  | Kiểm tra khóa Edge Function, số dư/hạn mức OpenRouter, mã mô hình và nhật ký Edge Function; không in khóa hoặc mã phiên đăng nhập vào nhật ký.                                        |
| Bảng xếp hạng trực tuyến trống                            | Chưa có người đồng ý tham gia hoặc chưa có tiến độ. Bật tham gia tại trang Cùng nhau tiến bộ rồi tải lại.                                                               |
| Tiến độ dùng thử không còn                                | Dữ liệu dùng thử thuộc trình duyệt và nguồn trang hiện tại; chế độ riêng tư, xóa dữ liệu hoặc đổi URL có thể tạo vùng lưu trữ khác.                                     |

## Kiểm tra trước khi sử dụng thật

- Chạy kiểm thử giao diện và Edge Function, rồi biên dịch thành công.
- Thử trang ở cả đường dẫn gốc và đường dẫn kho; tải lại trang con có `#`.
- Thử chế độ dùng thử khi chưa cấu hình dịch vụ, tải lại giữa phiên tập trung và kiểm tra tiến độ đã lưu.
- Với Supabase thật, dùng hai tài khoản để kiểm tra dữ liệu riêng, thưởng không lặp và xếp hạng chỉ có người đồng ý tham gia.
- Kiểm tra yêu cầu AI từ trình duyệt chỉ đến Edge Function; khóa OpenRouter và khóa Supabase đặc quyền không được có trong tệp JavaScript.
- Kiểm tra đăng nhập và truyền dần câu trả lời bằng chính các tài khoản dịch vụ sẽ dùng khi vận hành.

Mã nguồn và kiểm thử cục bộ không thay thế kiểm thử với tài khoản dịch vụ thực. Bản bàn giao không kèm khóa dịch vụ, không tự tạo dự án Supabase/Supabase và chưa xác nhận tích hợp trực tuyến bằng thông tin đăng nhập của bạn.
