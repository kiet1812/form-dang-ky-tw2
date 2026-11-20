/**
 * GOOGLE APPS SCRIPT WEB APP - ĐƠN ĐĂNG KÝ TALKSHOW
 * "CHRISTMAS WISHES – ĐIỀU ƯỚC MÙA GIÁNG SINH" (CLB Thuyết trình)
 *
 * Cách triển khai sau khi dán file này vào Google Apps Script (Code.gs):
 * 1. Lưu file (Ctrl + S).
 * 2. Bấm Deploy (Triển khai) -> Manage deployments (Quản lý các bản triển khai).
 * 3. Bấm biểu tượng bút chì (Edit) -> Version: chọn "New version" -> Deploy.
 * 4. Mở thử URL /exec trên trình duyệt (GET) để xác nhận `serverTimeVietnam` hiển thị đúng giờ Hà Nội (GMT+7).
 */

const SPREADSHEET_ID = '19tfDr-OaHG3VWVbIyNDV2vrqhQOHUv05XmwKoOcZ6Ls';
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'; // Múi giờ chuẩn Hà Nội / Việt Nam (GMT+7 quanh năm)
const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm:ss';
const LOCK_TIMEOUT_MS = 10000;

// Hàng tiêu đề bắt buộc ở dòng 1 của sheet đầu tiên
const EXPECTED_HEADERS = [
  'STT',
  'Thời gian đăng ký',
  'Họ và tên',
  'Trường đang học',
  'Mã số sinh viên',
  'Câu hỏi gửi ban tổ chức',
];

// Giới hạn độ dài khớp chính xác với đặc tả phía website
const FIELD_LIMITS = {
  name: 120,
  school: 200,
  studentId: 40,
  question: 2000,
};

/**
 * Tạo phản hồi HTTP dạng JSON cho Web App.
 * Cách hoạt động: Chuyển đối tượng JavaScript thành chuỗi JSON và gán MIME type `JSON`
 * qua `ContentService` để trình duyệt đọc trực tiếp `{ "ok": true }` hoặc mã lỗi.
 */
function createJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Lấy chuỗi thời gian hiện tại theo đúng múi giờ Hà Nội, Việt Nam (GMT+7).
 * Cách hoạt động: Ép cứng mã múi giờ IANA `Asia/Ho_Chi_Minh` trong `Utilities.formatDate`,
 * hoàn toàn độc lập với múi giờ mặc định của Google Sheet hay Apps Script Project.
 */
function getCurrentVietnamTimestamp() {
  return Utilities.formatDate(new Date(), VIETNAM_TIMEZONE, DATE_TIME_FORMAT);
}

/**
 * Chuẩn hoá khoảng trắng, cắt giới hạn ký tự và chống lỗi thực thi công thức (Formula Injection)
 * trên Google Sheets.
 * Cách hoạt động:
 * - Gộp khoảng trắng thừa (hoặc chuẩn hoá xuống dòng nếu `preserveNewlines = true`).
 * - Cắt chuỗi nếu vượt quá `maxLength`.
 * - Nếu ký tự đầu là `=`, `+`, `-`, `@`, tab hoặc xuống dòng thì thêm dấu `'` phía trước
 *   để Google Sheets luôn lưu như văn bản thuần an toàn.
 */
function sanitizeField(rawValue, maxLength, preserveNewlines) {
  let text = String(rawValue == null ? '' : rawValue);

  if (preserveNewlines) {
    text = text
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  } else {
    text = text.replace(/\s+/g, ' ').trim();
  }

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trim();
  }

  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }

  return text;
}

/**
 * Kiểm tra hàng tiêu đề dòng 1 của sheet có khớp chính xác 6 cột yêu cầu hay không.
 * Tác dụng: Ngăn ghi lệch cột nếu bảng tính bị sửa tên cột ngoài ý muốn.
 */
function hasMatchingHeaders(sheet) {
  const actualHeaders = sheet
    .getRange(1, 1, 1, EXPECTED_HEADERS.length)
    .getValues()[0]
    .map(function (cell) {
      return String(cell == null ? '' : cell).trim();
    });

  return EXPECTED_HEADERS.every(function (expected, index) {
    return actualHeaders[index] === expected;
  });
}

/**
 * Tính số thứ tự (STT) tiếp theo an toàn ngay cả khi bảng vừa có dòng bị xoá.
 * Cách hoạt động: Nếu sheet chỉ có hàng tiêu đề thì trả về 1; ngược lại đọc STT của dòng cuối
 * (nếu không phải số thì tính theo `lastRow - 1`) rồi cộng 1.
 */
function getNextSequenceNumber(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return 1;
  }

  const lastSttValue = Number(sheet.getRange(lastRow, 1).getValue());
  if (!isNaN(lastSttValue) && lastSttValue > 0) {
    return Math.floor(lastSttValue) + 1;
  }

  return lastRow;
}

/**
 * Xử lý yêu cầu HTTP GET để kiểm tra nhanh tình trạng Web App và múi giờ Việt Nam
 * sau khi bấm Deploy phiên bản mới (không ghi dữ liệu vào Google Sheet).
 */
function doGet() {
  return createJsonResponse({
    ok: true,
    service: 'christmas-wishes-registration',
    timezone: VIETNAM_TIMEZONE,
    serverTimeVietnam: getCurrentVietnamTimestamp(),
  });
}

/**
 * Endpoint HTTP POST chính nhận đơn đăng ký dạng form-encoded (`e.parameter`) từ website
 * và ghi thành một hàng mới vào sheet đầu tiên của Google Sheets.
 * Cách hoạt động:
 * 1. Kiểm tra trường ẩn chống bot `website`; nếu có dữ liệu thì trả `{ ok: true }` và không ghi.
 * 2. Chuẩn hoá, kiểm tra bắt buộc (`name`, `school`, `studentId`) và giới hạn độ dài 4 trường.
 * 3. Dùng `LockService.getScriptLock()` để khoá ghi đồng thời, tránh 2 người đăng ký cùng lúc bị trùng STT.
 * 4. Xác minh hàng tiêu đề khớp chính xác 6 cột, định dạng các cột text (`@`) để Google Sheets
 *    không tự đổi múi giờ hay cắt số 0 đầu của mã số sinh viên, sau đó ghi dữ liệu theo giờ Hà Nội (GMT+7).
 */
function doPost(e) {
  try {
    const params = (e && e.parameter) || {};

    // Bẫy honeypot chống bot: trả thành công giả nhưng không ghi vào bảng
    if (String(params.website || '').trim() !== '') {
      return createJsonResponse({ ok: true });
    }

    const name = sanitizeField(params.name, FIELD_LIMITS.name, false);
    const school = sanitizeField(params.school, FIELD_LIMITS.school, false);
    const studentId = sanitizeField(params.studentId, FIELD_LIMITS.studentId, false);
    const question = sanitizeField(params.question, FIELD_LIMITS.question, true);

    if (!name || !school || !studentId) {
      return createJsonResponse({
        ok: false,
        error: 'missing_required_fields',
      });
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
      return createJsonResponse({
        ok: false,
        error: 'try_again',
      });
    }

    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = spreadsheet.getSheets()[0];

      if (!sheet || !hasMatchingHeaders(sheet)) {
        return createJsonResponse({
          ok: false,
          error: 'sheet_headers_do_not_match',
        });
      }

      const nextRow = Math.max(2, sheet.getLastRow() + 1);
      const nextStt = getNextSequenceNumber(sheet);
      const registeredAtVietnam = getCurrentVietnamTimestamp();

      // Đặt định dạng văn bản thuần ('@') cho cột thời gian & thông tin để Google Sheets
      // không tự chuyển lại sang múi giờ UTC hoặc đảo định dạng ngày/tháng kiểu Mỹ
      const targetRange = sheet.getRange(nextRow, 1, 1, EXPECTED_HEADERS.length);
      targetRange.setNumberFormats([['0', '@', '@', '@', '@', '@']]);
      targetRange.setValues([
        [nextStt, registeredAtVietnam, name, school, studentId, question],
      ]);

      return createJsonResponse({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error('Registration doPost error:', err);
    return createJsonResponse({
      ok: false,
      error: 'server_error',
    });
  }
}

/**
 * Hàm kiểm thử nhanh chạy trực tiếp trong trình soạn thảo Apps Script (không ghi dữ liệu mẫu).
 * Tác dụng: In ra Execution Log giờ Việt Nam hiện tại và trạng thái khớp tiêu đề của Google Sheet.
 */
function testSetupWithoutWriting() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];
  Logger.log('Giờ Hà Nội (GMT+7): ' + getCurrentVietnamTimestamp());
  Logger.log('Tên sheet đầu tiên: ' + (sheet ? sheet.getName() : 'Không tìm thấy'));
  Logger.log('Tiêu đề khớp chuẩn: ' + (sheet ? hasMatchingHeaders(sheet) : false));
}
