# CHRISTMAS WISHES – Điều Ước Mùa Giáng Sinh

Website giới thiệu sự kiện và tiếp nhận đăng ký tham gia talkshow **“CHRISTMAS WISHES – Điều Ước Mùa Giáng Sinh”** do **CLB Thuyết trình** tổ chức vào **20h00 tối ngày 25/12/2026** tại **Trường Đại học Công Nghệ – ĐHQGHN, cơ sở Hoà Lạc**.

---

## 1. Mục đích

- **Quảng bá và truyền tải tinh thần sự kiện:** Giới thiệu chủ đề, thông điệp nhân văn của talkshow mùa Giáng sinh (sẻ chia điều ước, lắng nghe câu chuyện, lan tỏa sự đồng cảm), kèm thông tin thời gian, địa điểm và đồng hồ đếm ngược trực tiếp tới đêm tổ chức.
- **Thu thập đăng ký tham dự thuận tiện:** Cung cấp biểu mẫu đăng ký gọn nhẹ ngay trên cùng một trang để sinh viên đăng ký giữ chỗ, gửi trước câu hỏi cho khách mời/Ban Tổ Chức và lưu trực tiếp vào bảng Google Sheets quản lý danh sách.
- **Tối ưu triển khai cho CLB sinh viên:** Xây dựng hoàn toàn bằng web tĩnh (HTML/CSS/JS thuần) kết hợp Google Apps Script, không cần thuê server hay cấu hình backend phức tạp.

---

## 2. Bố cục và giao diện

### Chủ đề & bảng màu
- Lấy cảm hứng từ **thiệp Giáng sinh thủ công**, sử dụng 4 tông màu chủ đạo: **Đỏ đô** (nền chính có vân giấy nhung), **Xanh lá thông**, **Trắng kem** (nền giấy thư & đơn đăng ký) và **Vàng ánh kim**.
- Bộ font hỗ trợ đầy đủ dấu tiếng Việt: `Playfair Display` (tiêu đề), `Be Vietnam Pro` (nội dung & form), `Dancing Script` (chữ viết tay tạo điểm nhấn).
- Toàn bộ hoạ tiết trang trí (cây thông Noel, xe trượt tuyết, đàn tuần lộc, nơ lụa, chuông vàng, lá nhựa ruồi, kẹo gậy, quả cầu tuyết, con dấu sáp) được vẽ bằng **SVG** thay vì lạm dụng icon máy.

### Cấu trúc trang (2 phần trọng tâm)
1. **Thanh điều hướng (Navbar) dính phía trên, căn giữa:**
   - Góc trái đặt logo CLB (`logo.png`) trong suốt trực tiếp trên nền navbar.
   - Chính giữa gồm 2 nút anchor link `Giới thiệu` và `Đăng ký tham gia` với thanh trượt nền vàng ánh kim và hiệu ứng cuộn mượt (`requestAnimationFrame`).
   - Trang trí lá nhựa ruồi tràn góc và dây đèn Giáng sinh nhấp nháy dọc mép dưới.
2. **Phần Giới thiệu (`#gioi-thieu`):**
   - **Hero mở đầu:** Tên talkshow, lời mời, khung Thời gian & Địa điểm, đồng hồ đếm ngược đến 20h00 ngày 25/12/2026, 2 nút kêu gọi hành động, 2 quả châu tương tác (bấm để mở lời chúc), rừng cây thông tuyết dưới chân Hero và hiệu ứng **Ông già Noel cùng tuần lộc lướt qua mỗi 5 giây** (giới hạn riêng trong phần giới thiệu).
   - **Thư ngỏ & Thẻ quả cầu tuyết:** Trình bày câu chuyện chủ đề talkshow và những điểm nổi bật của đêm sự kiện.
   - **Ý nghĩa chủ đề:** 3 thẻ nội dung cùng khung trích dẫn chuyển mạch tự nhiên xuống khu vực đăng ký.
3. **Phần Đơn đăng ký tham gia (`#dang-ky`):**
   - **Form bưu thiếp Giáng sinh:** Gồm 3 trường bắt buộc (`*Họ và tên`, `*Hiện tại đang học trường gì?`, `*Mã số sinh viên là gì?`), 1 trường tùy chọn (`Câu hỏi muốn gửi tới ban tổ chức (nếu có)` có bộ đếm 2000 ký tự) và nút **`Đăng ký`** được trang trí xe trượt tuyết Ông già Noel cùng 3 chú tuần lộc chạy dọc mép trên nút.
   - **Thiệp mời tham dự xem trước trực tiếp (Live Ticket Preview):** Tự động cập nhật theo thông tin người dùng đang gõ và đóng dấu mộc **`ĐÃ ĐĂNG KÝ`** khi gửi đơn thành công.
4. **Hiệu ứng toàn trang & Responsive:** Tuyết rơi phủ nhẹ kèm nút `Tuyết rơi: Bật / Tắt` ở góc dưới phải, tự tôn trọng cài đặt giảm chuyển động (`prefers-reduced-motion`) và tương thích cả desktop lẫn điện thoại.

---

## 3. Cách vận hành

### Kiến trúc luồng dữ liệu
```text
Người dùng (Trình duyệt)
   │  1. Điền form & kiểm tra hợp lệ phía client (script.js)
   │  2. Gửi HTTP POST dạng application/x-www-form-urlencoded (URLSearchParams)
   ▼
Google Apps Script Web App (Code.gs)
   │  3. Kiểm tra bẫy bot (website), chuẩn hoá & kiểm tra độ dài dữ liệu
   │  4. Khoá ghi đồng thời (LockService) & xác minh 6 cột tiêu đề
   │  5. Sinh STT tăng dần + thời gian đăng ký chuẩn giờ Hà Nội (Asia/Ho_Chi_Minh)
   ▼
Google Sheets (Sheet đầu tiên)
   │  6. Ghi 1 dòng mới & trả JSON { "ok": true } về trình duyệt
   ▼
Website hiển thị xác nhận "Đăng ký thành công!" & đóng dấu lên thiệp mời
```

### Các tệp chính trong thư mục
- `index.html`: Cấu trúc trang web và thư viện biểu tượng SVG Giáng sinh.
- `styles.css`: Giao diện, responsive và toàn bộ animation CSS.
- `script.js`: Xử lý cuộn mượt, đếm ngược, hiệu ứng tuyết/ông già Noel, xem trước thiệp, kiểm tra hợp lệ form và gọi API.
- `Code.gs`: Mã nguồn backend chạy trên Google Apps Script để ghi dữ liệu vào Google Sheets.
- `logo.png`, `icon.png`: Logo CLB Thuyết trình và favicon của website.

### Chạy & triển khai nhanh
- **Chạy website tĩnh:** Mở trực tiếp `index.html` trên trình duyệt, chạy server cục bộ (`python -m http.server 8000`) hoặc bật **GitHub Pages** trên nhánh `main`.
- **Cập nhật backend Google Sheets:** Dán nội dung `Code.gs` vào Google Apps Script → Lưu → chọn **Deploy → Manage deployments → Edit → Version: `New version` → Deploy** để kích hoạt phiên bản mới mà không đổi URL `/exec`.

---

## 4. Độ bảo mật và an toàn của dữ liệu

### Các cơ chế bảo vệ đã áp dụng
- **Truyền tải trực tiếp qua HTTPS:** Dữ liệu đăng ký gửi thẳng từ trình duyệt người dùng đến máy chủ Google Apps Script của Ban Tổ Chức, không đi qua bên trung gian thứ ba.
- **Thu thập tối thiểu thông tin:** Chỉ lưu các trường phục vụ tổ chức sự kiện (`Họ và tên`, `Trường đang học`, `Mã số sinh viên`, `Câu hỏi`), không thu thập mật khẩu hay thông tin nhạy cảm.
- **Kiểm tra dữ liệu 2 lớp (Client + Server):** Cả `script.js` và `Code.gs` đều kiểm tra trường bắt buộc, chuẩn hoá khoảng trắng và giới hạn độ dài tối đa (`120` / `200` / `40` / `2000` ký tự).
- **Chống XSS phía giao diện:** Mọi dữ liệu người dùng nhập khi hiển thị lên Thiệp mời xem trước hoặc thông báo kết quả đều gán bằng `textContent` và DOM API, không dùng `innerHTML`.
- **Chống bot spam cơ bản (Honeypot):** Sử dụng trường ẩn `website`; bot tự điền trường này sẽ nhận phản hồi `{ "ok": true }` giả và bị bỏ qua, không ghi rác vào Google Sheets.
- **Chống tiêm công thức bảng tính (Spreadsheet Formula Injection):** `Code.gs` chặn các chuỗi bắt đầu bằng `=`, `+`, `-`, `@`, tab hoặc xuống dòng bằng ký tự thoát `'` và ép định dạng văn bản thuần `@` cho các cột dữ liệu.
- **An toàn ghi đồng thời & chuẩn thời gian phía server:** Sử dụng `LockService.getScriptLock()` để tránh trùng `STT` khi nhiều người bấm đăng ký cùng lúc; cột `Thời gian đăng ký` được tạo từ phía server theo múi giờ cố định `Asia/Ho_Chi_Minh` (`GMT+7`) nên không bị phụ thuộc đồng hồ máy người dùng.

### Giới hạn thực tế & khuyến nghị vận hành cho Ban Tổ Chức
- **Quyền truy cập Google Sheet:** Luôn giữ file Google Sheets ở chế độ **Hạn chế (Restricted)**, chỉ chia sẻ quyền xem/sửa cho thành viên Ban Tổ Chức (không bật chế độ "Bất kỳ ai có đường liên kết đều xem được").
- **Giới hạn chống spam quy mô lớn:** Do là form công khai không gắn CAPTCHA/đăng nhập, hệ thống chỉ chặn bot tự động cơ bản qua honeypot và chống bấm đúp phía trình duyệt; nếu cần chống spam nâng cao khi sự kiện mở quy mô rất lớn, nên bổ sung Cloudflare Turnstile hoặc Google reCAPTCHA.
- **Thông tin cấu hình công khai:** Nếu repo GitHub đặt ở chế độ Public, `Code.gs` đang chứa `SPREADSHEET_ID` (người ngoài không có quyền chia sẻ vẫn không mở được file Sheet, nhưng có thể cân nhắc chuyển repo về Private hoặc lưu `SPREADSHEET_ID` trong `PropertiesService` của Apps Script).
