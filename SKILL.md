# Project website giới thiệu & đơn đăng ký cho talkshow “CHRISTMAS WISHES – ĐIỀU ƯỚC MÙA GIÁNG SINH”
`Lưu ý: Mỗi lần chỉnh sửa, cần đọc lại file này. Tránh làm sai Rule.`

## Ngữ cảnh
Bạn là senior full-stack developer kiêm UI/UX designer, hãy  tạo một website để mọi người có thể vào và đọc phần giới thiệu & điền đơn đăng ký talkshow.
Trước mỗi lần bàn giao, hãy tự kiểm tra lại website xem có bị lỗi font, lỗi hiệu ứng, lỗi hoạ tiết(ông già noel, cây thông,...)

## 1. Bố cục
- Website có hai mục tiêu cần nhắm tới: Giới thiệu về sự kiện và đơn đăng ký tham gia(cho khách)
- Navbar xuất hiện phía trên, căn giữa. Góc trái navbar là logo `logo.png`, ở giữa là 2 button `Giới thiệu` và `đăng ký tham gia`. 2 button này là anchor link, yêu cầu xử lý smooth scroll mượt mà.
- Ở phần giới thiệu, cần có các hoạ tiết đến giáng sinh như cây thông noel,... nêu tên talkshow,các đoạn giới thiệu, ngày, địa chỉ tổ chức. Mục đích: kêu gọi, quảng cáo để mọi người có hứng thú và bắt đầu đăng ký tham gia.
- Ở phần đăng ký tham gia, Có các ô như: `*Họ và tên`, `*Hiện tại đang học trường gì?`, `*Mã số sinh viên là gì?`, `Câu hỏi muốn gửi tới ban tổ chức(nếu có)` và nút `Đăng ký`. đối với các ô có dấu "*" thì là bắt buộc phải nhập(nếu không thì khi bấm nút Đăng ký, yêu cầu điền đầy đủ). Khi bấm nút đăng ký thành công thì gửi api thông tin đăng ký, để thêm vào một bảng google sheet.

## 2. Website 
- là website tĩnh(thuần HTML/CSS/JS)
- Có thể sử dụng framework dạng CDN để hỗ trợ, ví dụ: CSSTailwind, GSAP, tsParticles, CSS animation,...(không cần dùng hết, hãy chọn lựa loại mà bạn muốn)
## 3. Giao diện
- Màu chủ đạo: `Đỏ đô` (lấy làm màu nền chính) – `Xanh lá` – `Trắng kem` – `Vàng ánh kim` (biểu trưng cho không khí Giáng sinh, sự ấm áp, hy vọng và niềm vui).
- Yêu cầu: không được lạm dụng các icon máy, thay vào đó hãy dùng các logo SVG.
- Cần có các hoạ tiết như Cây thông noel, tuần lộc, ông già noel,... các hoạ tiết liên quan đến giáng sinh.
- Website có nhiều hiệu ứng ví dụ: cứ 5s thì ông già noel cùng tuần lộc sẽ lướt qua giao diện 1 lần(chỉ ở phần giới thiệu), Hiệu ứng tuyết rơi(có thể dùng icon máy), Trang trí hiệu ứng ông già noel cưỡi tuần lộc di chuyển ở nút `Đăng ký`,...(nếu bạn có idea gì hay hãy gợi ý).
- Trang trí cho tất cả các element kể cả navbar cũng được trang trí theo phong cách giáng sinh.
## 4. Những điều không nên làm
- Tránh các TH hợp lỗi CSS cơ bản, đảm bảo các hiệu ứng động, animation chuyển động mượt mà.
- Giao diện website nhìn không được quá AI, yêu cầu giao diện khác với các project trước vì cần nâng cao tính con người hơn. 
- Ở các function cần comment rõ cách hoạt động và tác dụng của nó.
- Kiểm tra api google sheet thật kỹ, đảm bảo không có sai sót khi người dùng nhấn nút đăng ký.
- Sau khi đã hoàn thành code, hãy bàn giao báo cạo lại cách chạy, các yếu tố mà bạn đã thêm vào hay sáng tạo ra.
## 5. Thông tin về talkshow
Các đoạn giới thiệu được cung cấp bởi ban tổ chức
```
1. GIỚI THIỆU VỀ CHỦ ĐỀ TALKSHOW
- Talkshow được tổ chức nhân dịp Giáng sinh - mùa lễ hội của sự sẻ chia, yêu thương và những điều ước tốt đẹp. Đây cũng là khoảng thời gian để mỗi người tạm gác lại những bộn bề, nhìn lại một năm đã qua và dành thời gian cho những điều thực sự ý nghĩa.
- Giáng sinh không chỉ gắn liền với cây thông, những món quà hay ánh đèn rực rỡ, mà còn là dịp để mỗi người gửi gắm những mong ước, chia sẻ câu chuyện và trao đi những lời nhắn nhủ chưa có cơ hội bày tỏ.
- Thông qua talkshow, CLB Thuyết trình mong muốn tạo nên một không gian ấm áp, nơi các bạn trẻ có thể cùng chia sẻ về ước mơ, những điều tiếc nuối, kỳ vọng trong tương lai và những giá trị mà bản thân muốn lan tỏa. Qua đó, chương trình khuyến khích mọi người biết lắng nghe, thấu hiểu và trân trọng những kết nối xung quanh mình.

2. Ý NGHĨA CHỦ ĐỀ
- Giáng sinh là mùa của những điều ước: Mỗi người đều có những mong muốn riêng, từ những mục tiêu lớn lao đến những hy vọng giản dị trong cuộc sống. Talkshow là dịp để những điều ước ấy được chia sẻ và lắng nghe.
- “Christmas Wishes” – Điều ước mùa Giáng sinh: Không chỉ là những lời ước dành cho bản thân, đó còn có thể là lời chúc dành cho gia đình, bạn bè, những người đồng hành và cả những điều tốt đẹp mà chúng ta mong muốn gửi đến cộng đồng.
- Talkshow hướng tới xây dựng một không gian giao lưu gần gũi, nơi mỗi người được tự do thể hiện suy nghĩ, chia sẻ câu chuyện cá nhân và lắng nghe những góc nhìn khác biệt. Bởi đôi khi, món quà ý nghĩa nhất không nằm trong một chiếc hộp được gói cẩn thận, mà chính là sự đồng cảm và kết nối giữa con người với nhau.
```
Thời gian tổ chức: 20h tối ngày 25/12/2026
Địa điểm: Trường Đại học Công Nghệ - ĐHQGHN cơ sở Hoà Lạc.

Lưu ý: nếu bạn cảm thấy thông tin ban tổ chức chưa đủ hấp hẫn để kêu gọi người tham gia thì bạn có thể chỉnh sửa(sửa ngắn lại hoặc tóm tắt đoạn ban tổ chức cung cấp) sau đó tự thêm vào các text mà bạn nghĩ nó có thể kêu gọi được mọi người.

## 6. API Google sheets(chatgpt cung cấp)
Lưu ý: thời gian đăng ký phải tính theo khung giờ Việt Nam.

Dự án dùng một Google Apps Script Web App làm API nhận đăng ký và ghi vào Google Sheets, không gọi trực tiếp Google Sheets REST API.

- Endpoint: `https://script.google.com/macros/s/AKfycbzwdpWgRFRzVKazinX5-qhk3mqXKrc3KNB2Pk_qpMdWdgYL1pBC6GonsC3AyIqsjWuo7g/exec`
- Phương thức: `POST`
- Phía website gửi dữ liệu dạng form-encoded qua `URLSearchParams(new FormData(form))`, không gửi JSON. Apps Script đọc các trường từ `e.parameter`.
- Các trường gửi lên:
  - `name`: họ và tên, tối đa 120 ký tự, bắt buộc
  - `school`: trường đang học, tối đa 200 ký tự, bắt buộc
  - `studentId`: mã số sinh viên, tối đa 40 ký tự, bắt buộc
  - `question`: câu hỏi gửi ban tổ chức, tối đa 2000 ký tự, không bắt buộc
  - `website`: trường ẩn chống bot; nếu có giá trị thì API trả `{ "ok": true }` nhưng không ghi dữ liệu
- Spreadsheet ID hiện được cấu hình trong Apps Script: `19tfDr-OaHG3VWVbIyNDV2vrqhQOHUv05XmwKoOcZ6Ls`. API ghi vào sheet đầu tiên trong spreadsheet.
- Hàng tiêu đề bắt buộc phải khớp chính xác: `STT`, `Thời gian đăng ký`, `Họ và tên`, `Trường đang học`, `Mã số sinh viên`, `Câu hỏi gửi ban tổ chức`.
- Mỗi đăng ký hợp lệ được thêm thành một hàng gồm số thứ tự, thời gian đăng ký, họ tên, trường, mã số sinh viên và câu hỏi. Script dùng khóa để tránh hai yêu cầu cùng lúc tạo số thứ tự trùng nhau.
- Apps Script kiểm tra các trường bắt buộc, giới hạn độ dài, chuẩn hóa khoảng trắng và xử lý ký tự đầu vào có thể bị Google Sheets hiểu thành công thức.
- Phản hồi JSON có dạng `{ "ok": true }` khi ghi thành công. Lỗi có thể gồm `missing_required_fields`, `sheet_headers_do_not_match`, `try_again` hoặc `server_error`.
- Lưu ý về phía trình duyệt: website gửi bằng `mode: "no-cors"`, nên không đọc được JSON phản hồi. Hiện tại, nếu `fetch` hoàn tất mà không ném lỗi mạng, giao diện báo yêu cầu đã gửi—even khi Apps Script trả JSON báo lỗi. Vì vậy đây chưa phải xác nhận chắc chắn rằng dữ liệu đã được ghi vào sheet.