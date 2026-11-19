/**
 * CHRISTMAS WISHES – ĐIỀU ƯỚC MÙA GIÁNG SINH
 * Xử lý tương tác giao diện Giáng sinh, cuộn mượt, đếm ngược, xem trước thiệp
 * và gửi đơn đăng ký tới Google Apps Script Web App (ghi vào Google Sheets).
 */

(() => {
  'use strict';

  /* =========================================================================
     HẰNG SỐ CẤU HÌNH
     ========================================================================= */
  const API_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbzwdpWgRFRzVKazinX5-qhk3mqXKrc3KNB2Pk_qpMdWdgYL1pBC6GonsC3AyIqsjWuo7g/exec';

  // Thời gian tổ chức talkshow: 20h00 tối ngày 25/12/2026 theo múi giờ Việt Nam (UTC+7)
  const EVENT_START_ISO = '2026-12-25T20:00:00+07:00';

  // Chu kỳ 5 giây cho hiệu ứng Ông già Noel & tuần lộc lướt qua phần giới thiệu
  const SANTA_FLY_INTERVAL_MS = 5000;

  // Giới hạn ký tự khớp chính xác đặc tả backend Apps Script
  const FIELD_RULES = {
    name: {
      required: true,
      maxLength: 120,
      emptyMsg: 'Vui lòng nhập họ và tên của bạn.',
      maxMsg: 'Họ và tên không được vượt quá 120 ký tự.',
    },
    school: {
      required: true,
      maxLength: 200,
      emptyMsg: 'Vui lòng nhập tên trường bạn đang theo học.',
      maxMsg: 'Tên trường không được vượt quá 200 ký tự.',
    },
    studentId: {
      required: true,
      maxLength: 40,
      emptyMsg: 'Vui lòng nhập mã số sinh viên của bạn.',
      maxMsg: 'Mã số sinh viên không được vượt quá 40 ký tự.',
    },
    question: {
      required: false,
      maxLength: 2000,
      emptyMsg: '',
      maxMsg: 'Câu hỏi không được vượt quá 2000 ký tự.',
    },
  };

  // Bản đồ thông báo lỗi tiếng Việt cho các mã lỗi JSON từ Apps Script
  const API_ERROR_MESSAGES = {
    missing_required_fields:
      'Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại Họ và tên, Trường đang học và Mã số sinh viên.',
    sheet_headers_do_not_match:
      'Hệ thống lưu danh sách đang được Ban Tổ Chức cập nhật tiêu đề bảng. Vui lòng thử lại sau hoặc nhắn tin cho CLB Thuyết trình.',
    try_again:
      'Hiện có nhiều bạn đăng ký cùng lúc. Vui lòng đợi vài giây rồi nhấn "Đăng ký" lại nhé.',
    server_error:
      'Máy chủ đăng ký vừa gặp trục trặc tạm thời. Bạn hãy thử gửi lại đơn sau ít phút nhé.',
  };

  /**
   * Kiểm tra người dùng có bật chế độ giảm chuyển động (Reduced Motion) trên hệ điều hành hay không.
   * Tác dụng: Tôn trọng khả năng tiếp cận (accessibility), tự động tắt hoặc giảm hiệu ứng động khi cần.
   */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Tính toán khoảng bù chiều cao của thanh navbar dính phía trên (sticky header).
   * Cách hoạt động: Đọc chiều cao thực tế của `#site-header` cộng thêm 18px đệm để khi cuộn mượt
   * tới anchor link, tiêu đề phần nội dung không bị thanh navbar che khuất.
   */
  function getNavbarScrollOffset() {
    const header = document.getElementById('site-header');
    return header ? header.getBoundingClientRect().height + 18 : 96;
  }

  // Trạng thái điều khiển animation cuộn trang bằng requestAnimationFrame
  let activeScrollRafId = null;
  let cancelActiveScroll = null;

  /**
   * Hàm gia tốc easeInOutCubic (bắt đầu êm, tăng tốc mượt giữa hành trình và hạ cánh nhẹ nhàng).
   * Tác dụng: Giúp thao tác cuộn từ "Giới thiệu" xuống "Đăng ký tham gia" (và ngược lại)
   * chuyển động tự nhiên, mềm mại hơn cuộn mặc định của trình duyệt.
   */
  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  /**
   * Cuộn mượt tới một phần tử đích theo bộ chọn CSS (ví dụ `#gioi-thieu`, `#dang-ky`)
   * bằng `requestAnimationFrame` với đường cong gia tốc mượt và tự huỷ nếu người dùng tự cuộn tay.
   * Cách hoạt động: Tính toạ độ đích chuẩn (trừ chiều cao navbar và giới hạn trong phạm vi cuộn của trang),
   * tự động tính thời lượng phù hợp theo khoảng cách (520ms–940ms), cập nhật `window.scrollTo` từng khung hình
   * và gọi callback `onComplete` khi hạ cánh xong.
   */
  function smoothScrollToTarget(selector, onComplete, onCancel) {
    const target = document.querySelector(selector);
    if (!target) return;

    if (typeof cancelActiveScroll === 'function') {
      cancelActiveScroll();
    }

    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const rawTargetY =
      selector === '#gioi-thieu'
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - getNavbarScrollOffset();
    const targetY = Math.min(maxScrollY, Math.max(0, rawTargetY));
    const startY = window.scrollY;
    const distance = targetY - startY;

    if (prefersReducedMotion() || Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    const durationMs = Math.min(940, Math.max(520, Math.abs(distance) * 0.42));
    let startTimestamp = null;

    /**
     * Gỡ toàn bộ listener lắng nghe thao tác cắt ngang của người dùng.
     */
    function cleanupInterruptListeners() {
      window.removeEventListener('wheel', handleUserInterrupt);
      window.removeEventListener('touchstart', handleUserInterrupt);
      window.removeEventListener('keydown', handleKeyInterrupt);
    }

    /**
     * Huỷ animation cuộn hiện tại ngay lập tức nếu người dùng chủ động lăn chuột hoặc chạm màn hình.
     */
    function handleUserInterrupt() {
      if (activeScrollRafId !== null) {
        window.cancelAnimationFrame(activeScrollRafId);
        activeScrollRafId = null;
      }
      cleanupInterruptListeners();
      cancelActiveScroll = null;
      if (typeof onCancel === 'function') onCancel();
    }

    /**
     * Huỷ cuộn tự động khi người dùng bấm phím điều hướng cuộn trang.
     */
    function handleKeyInterrupt(event) {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(event.key)) {
        handleUserInterrupt();
      }
    }

    cancelActiveScroll = () => {
      if (activeScrollRafId !== null) {
        window.cancelAnimationFrame(activeScrollRafId);
        activeScrollRafId = null;
      }
      cleanupInterruptListeners();
      cancelActiveScroll = null;
    };

    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
    window.addEventListener('touchstart', handleUserInterrupt, { passive: true });
    window.addEventListener('keydown', handleKeyInterrupt);

    /**
     * Bước cập nhật vị trí cuộn cho từng khung hình animation.
     */
    function step(timestamp) {
      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        activeScrollRafId = window.requestAnimationFrame(step);
      } else {
        activeScrollRafId = null;
        cleanupInterruptListeners();
        cancelActiveScroll = null;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    activeScrollRafId = window.requestAnimationFrame(step);
  }

  /**
   * Tạo ánh sáng viền vàng dịu nhẹ trên khung đơn đăng ký khi vừa cuộn mượt tới `#dang-ky`.
   * Tác dụng: Tạo điểm chạm thị giác tinh tế báo hiệu đã tới đúng khu vực điền đơn.
   */
  function triggerFormArrivalHighlight() {
    const formPaper = document.querySelector('#dang-ky .form-paper');
    if (!formPaper || prefersReducedMotion()) return;

    formPaper.classList.remove('is-arrived');
    void formPaper.offsetWidth;
    formPaper.classList.add('is-arrived');
  }

  /**
   * Khởi tạo thanh điều hướng với thanh trượt vàng ánh kim (`.nav-active-pill`),
   * cuộn mượt `requestAnimationFrame` và scroll-spy đồng bộ trạng thái mục đang xem.
   * Cách hoạt động:
   * - Khi người dùng bấm `Đăng ký tham gia` (hoặc `Giới thiệu`), thanh trượt vàng trên navbar
   *   lập tức lướt mượt sang nút đích và khoá scroll-spy trong lúc trang cuộn để không bị giật ngược.
   * - Khi cuộn trang bình thường, scroll-spy tự cập nhật vị trí thanh trượt mượt theo phần nội dung hiện tại.
   */
  function initSmoothNavigation() {
    const header = document.getElementById('site-header');
    const navLinksWrap = document.getElementById('nav-links');
    const activePill = document.getElementById('nav-active-pill');
    const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
    const scrollTriggers = document.querySelectorAll('[data-scroll-target]');
    const registerSection = document.getElementById('dang-ky');

    let currentActiveHref = '#gioi-thieu';
    let lockedActiveHref = null;

    /**
     * Đo vị trí và kích thước nút đang active để dịch chuyển thanh trượt vàng `.nav-active-pill`
     * bằng `transform: translate3d` (tăng tốc phần cứng GPU, chuyển động siêu mượt).
     */
    function moveActivePillToButton(targetBtn, instant) {
      if (!activePill || !navLinksWrap || !targetBtn) return;

      const leftOffset = targetBtn.offsetLeft;
      const pillWidth = targetBtn.offsetWidth;

      if (instant) {
        activePill.classList.remove('is-ready');
      }

      activePill.style.width = `${pillWidth}px`;
      activePill.style.transform = `translate3d(${leftOffset}px, 0, 0)`;

      if (instant) {
        void activePill.offsetWidth;
        activePill.classList.add('is-ready');
      }
    }

    /**
     * Cập nhật nút đang active trên navbar và trượt thanh nền vàng tới đúng nút đó.
     */
    function setActiveNavHref(activeHref, instant) {
      if (!instant && activeHref === currentActiveHref) return;
      currentActiveHref = activeHref;

      let matchedBtn = navButtons[0] || null;
      navButtons.forEach((btn) => {
        const isCurrent = btn.getAttribute('href') === activeHref;
        btn.classList.toggle('is-active', isCurrent);
        if (isCurrent) {
          btn.setAttribute('aria-current', 'page');
          matchedBtn = btn;
        } else {
          btn.removeAttribute('aria-current');
        }
      });

      moveActivePillToButton(matchedBtn, instant);
    }

    scrollTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        const selector = trigger.getAttribute('data-scroll-target');
        if (!selector || !selector.startsWith('#')) return;

        event.preventDefault();

        const targetNavHref = selector === '#dang-ky' ? '#dang-ky' : '#gioi-thieu';
        lockedActiveHref = targetNavHref;
        setActiveNavHref(targetNavHref, false);

        smoothScrollToTarget(
          selector,
          () => {
            lockedActiveHref = null;
            updateNavbarState();
            if (selector === '#dang-ky') {
              triggerFormArrivalHighlight();
            }
          },
          () => {
            lockedActiveHref = null;
            updateNavbarState();
          }
        );

        // Cập nhật URL hash gọn gàng mà không gây nhảy giật trang
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', selector);
        }
      });
    });

    /**
     * Đồng bộ trạng thái bóng navbar và nút mục đang xem dựa trên vị trí cuộn hiện tại.
     */
    function updateNavbarState() {
      const scrollY = window.scrollY;
      if (header) {
        header.classList.toggle('is-scrolled', scrollY > 24);
      }

      if (lockedActiveHref || !registerSection) return;
      const registerThreshold =
        registerSection.getBoundingClientRect().top + scrollY - getNavbarScrollOffset() - 120;
      const activeHref = scrollY >= registerThreshold ? '#dang-ky' : '#gioi-thieu';

      setActiveNavHref(activeHref, false);
    }

    // Căn vị trí thanh trượt ban đầu ngay lập tức và căn lại khi font tải xong hoặc đổi kích thước màn hình
    const initialHref =
      registerSection &&
      window.scrollY >=
        registerSection.getBoundingClientRect().top + window.scrollY - getNavbarScrollOffset() - 120
        ? '#dang-ky'
        : '#gioi-thieu';
    setActiveNavHref(initialHref, true);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const activeBtn = navButtons.find((btn) => btn.classList.contains('is-active'));
        moveActivePillToButton(activeBtn, true);
      });
    }

    window.addEventListener('resize', () => {
      const activeBtn = navButtons.find((btn) => btn.classList.contains('is-active'));
      moveActivePillToButton(activeBtn, true);
    });

    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState, { passive: true });
  }

  /**
   * Khởi tạo đồng hồ đếm ngược thời gian thực tới 20h00 tối ngày 25/12/2026.
   * Cách hoạt động: Tính hiệu số mili-giây giữa mốc sự kiện và thời gian hiện tại,
   * tách thành Ngày / Giờ / Phút / Giây có đệm số 0 và cập nhật mỗi giây.
   */
  function initCountdown() {
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const captionEl = document.getElementById('countdown-caption');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const targetTime = new Date(EVENT_START_ISO).getTime();

    /**
     * Tính toán và hiển thị lại các con số đếm ngược một lần.
     */
    function renderCountdown() {
      const diffMs = targetTime - Date.now();

      if (diffMs <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        if (captionEl) {
          captionEl.textContent = 'Đêm Talkshow Giáng sinh đang diễn ra tại Hoà Lạc!';
        }
        return false;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
      return true;
    }

    if (renderCountdown()) {
      const timerId = window.setInterval(() => {
        if (!renderCountdown()) {
          window.clearInterval(timerId);
        }
      }, 1000);
    }
  }

  /**
   * Điều khiển hiệu ứng Ông già Noel cùng đàn tuần lộc lướt qua giao diện mỗi 5 giây
   * (CHỈ xuất hiện trong khu vực phần giới thiệu `#gioi-thieu`).
   * Cách hoạt động: Mỗi chu kỳ 5000ms sẽ gỡ class `.is-flying`, ép trình duyệt reset animation
   * (`offsetWidth`), điều chỉnh nhẹ độ cao bay tự nhiên rồi gắn lại `.is-flying` để xe trượt
   * lướt mượt từ trái sang phải qua bầu trời phần giới thiệu.
   */
  function initSantaFlyby() {
    const runner = document.getElementById('santa-sleigh-runner');
    if (!runner || prefersReducedMotion()) return;

    const altitudesDesktop = [8, 18, 12, 22];
    const altitudesMobile = [4, 10, 6, 12];
    let passCount = 0;

    /**
     * Kích hoạt một lượt bay mới của Ông già Noel và đàn tuần lộc.
     */
    function launchSantaPass() {
      if (document.hidden) return;

      const isMobile = window.innerWidth <= 720;
      const altitudeList = isMobile ? altitudesMobile : altitudesDesktop;
      const nextTop = altitudeList[passCount % altitudeList.length];
      passCount += 1;

      runner.classList.remove('is-flying');
      runner.style.top = `${nextTop}px`;
      // Buộc reflow để CSS animation `santaFlyAcross` khởi chạy sạch từ đầu ở mỗi chu kỳ 5s
      void runner.offsetWidth;
      runner.classList.add('is-flying');
    }

    // Chạy lượt chào sân ngay sau khi mở trang 650ms, sau đó lặp chính xác mỗi 5 giây
    window.setTimeout(() => {
      launchSantaPass();
      window.setInterval(launchSantaPass, SANTA_FLY_INTERVAL_MS);
    }, 650);
  }

  /**
   * Tạo hiệu ứng tuyết rơi phủ nhẹ toàn trang và kết nối nút bật/tắt tuyết rơi.
   * Cách hoạt động: Tạo tập bông tuyết (`❄`, `❅`, `✦`, `•`) với kích thước, tốc độ rơi,
   * độ trong suốt và biên độ lắc ngang ngẫu nhiên bằng CSS keyframes GPU-accelerated,
   * đồng thời hỗ trợ người dùng bấm nút bật/tắt tuyết bất cứ lúc nào.
   */
  function initSnowfall() {
    const snowLayer = document.getElementById('snow-layer');
    const toggleBtn = document.getElementById('snow-toggle-btn');
    const toggleLabel = document.getElementById('snow-toggle-label');
    if (!snowLayer) return;

    const glyphs = ['❄', '❅', '✦', '•', '❄'];
    const flakeCount = window.innerWidth <= 720 ? 18 : 34;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < flakeCount; i += 1) {
      const flake = document.createElement('span');
      flake.className = 'snowflake';
      flake.textContent = glyphs[i % glyphs.length];

      const leftPercent = Math.random() * 100;
      const sizePx = 9 + Math.random() * 11;
      const opacity = 0.35 + Math.random() * 0.55;
      const durationSec = 8 + Math.random() * 9;
      const delaySec = -(Math.random() * durationSec);
      const driftPx = (Math.random() * 48 - 24).toFixed(1);

      flake.style.left = `${leftPercent.toFixed(2)}%`;
      flake.style.fontSize = `${sizePx.toFixed(1)}px`;
      flake.style.opacity = opacity.toFixed(2);
      flake.style.animationDuration = `${durationSec.toFixed(2)}s`;
      flake.style.animationDelay = `${delaySec.toFixed(2)}s`;
      flake.style.setProperty('--drift-x', `${driftPx}px`);

      fragment.appendChild(flake);
    }

    snowLayer.appendChild(fragment);

    let snowEnabled = !prefersReducedMotion();

    /**
     * Đồng bộ trạng thái hiển thị của lớp tuyết rơi và nhãn nút điều khiển.
     */
    function applySnowState() {
      snowLayer.classList.toggle('is-paused', !snowEnabled);
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', String(snowEnabled));
      }
      if (toggleLabel) {
        toggleLabel.textContent = snowEnabled ? 'Tuyết rơi: Bật' : 'Tuyết rơi: Tắt';
      }
    }

    applySnowState();

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        snowEnabled = !snowEnabled;
        applySnowState();
      });
    }
  }

  /**
   * Xử lý tương tác khi người dùng bấm vào hai quả châu Giáng sinh treo trên Hero.
   * Cách hoạt động: Tạo hiệu ứng đung đưa quả châu (`.is-chiming`) và hiển thị lời chúc ấm áp
   * lấy từ thuộc tính `data-wish` trong hộp thông báo nổi `#ornament-toast`.
   */
  function initInteractiveOrnaments() {
    const ornaments = document.querySelectorAll('.ornament-trigger');
    const toast = document.getElementById('ornament-toast');
    if (!ornaments.length || !toast) return;

    let hideTimer = null;

    ornaments.forEach((ornament) => {
      ornament.addEventListener('click', () => {
        const wishMessage = ornament.getAttribute('data-wish');
        if (!wishMessage) return;

        ornament.classList.remove('is-chiming');
        void ornament.offsetWidth;
        ornament.classList.add('is-chiming');

        toast.textContent = wishMessage;
        toast.classList.add('is-visible');

        if (hideTimer) window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          toast.classList.remove('is-visible');
        }, 4200);
      });
    });
  }

  /**
   * Tạo hiệu ứng hiện dần mượt mà cho các khối nội dung khi cuộn tới tầm nhìn.
   * Cách hoạt động: Dùng `IntersectionObserver` theo dõi các phần tử `.reveal-on-scroll`
   * và gắn `.is-visible` một lần duy nhất khi chúng đi vào khung nhìn.
   */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal-on-scroll');
    if (!targets.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /**
   * Đồng bộ nội dung người dùng đang nhập trong đơn đăng ký lên "Thiệp mời tham dự"
   * bên cạnh và bộ đếm số ký tự câu hỏi.
   * Tác dụng: Mang lại trải nghiệm cá nhân hoá ấm áp, giúp người dùng kiểm tra lại chính tả
   * Họ tên, Trường học và Mã số sinh viên trước khi nhấn Đăng ký.
   */
  function initLiveTicketPreview(form) {
    const nameInput = form.elements.namedItem('name');
    const schoolInput = form.elements.namedItem('school');
    const studentIdInput = form.elements.namedItem('studentId');
    const questionInput = form.elements.namedItem('question');

    const previewName = document.getElementById('preview-name');
    const previewSchool = document.getElementById('preview-school');
    const previewStudentId = document.getElementById('preview-studentId');
    const questionCounter = document.getElementById('question-counter');
    const inviteTicket = document.getElementById('invite-ticket');

    /**
     * Cập nhật một trường xem trước trên thiệp mời bằng textContent an toàn (chống XSS).
     */
    function updatePreviewText(element, rawValue, fallbackText) {
      if (!element) return;
      const trimmed = rawValue.trim();
      element.textContent = trimmed || fallbackText;
      element.classList.toggle('is-placeholder', !trimmed);
    }

    /**
     * Làm mới toàn bộ thiệp xem trước và bộ đếm ký tự.
     */
    function syncAllPreviews() {
      updatePreviewText(previewName, nameInput ? nameInput.value : '', 'Tên của bạn...');
      updatePreviewText(previewSchool, schoolInput ? schoolInput.value : '', 'Trường của bạn...');
      updatePreviewText(previewStudentId, studentIdInput ? studentIdInput.value : '', '••••••••');

      if (questionCounter && questionInput) {
        questionCounter.textContent = `${questionInput.value.length} / ${FIELD_RULES.question.maxLength}`;
      }
    }

    [nameInput, schoolInput, studentIdInput, questionInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        syncAllPreviews();
        if (inviteTicket) {
          inviteTicket.classList.remove('is-confirmed');
        }
      });
    });

    syncAllPreviews();
    return syncAllPreviews;
  }

  /**
   * Kiểm tra hợp lệ một trường cụ thể trong form và cập nhật trạng thái báo lỗi trực tiếp.
   * Cách hoạt động: Đọc giá trị sau khi loại bỏ khoảng trắng đầu/cuối, đối chiếu luật bắt buộc
   * và độ dài tối đa trong `FIELD_RULES`, sau đó bật/tắt class `.has-error` cùng thông báo lỗi.
   */
  function validateSingleField(form, fieldName) {
    const rule = FIELD_RULES[fieldName];
    const input = form.elements.namedItem(fieldName);
    const group = form.querySelector(`.field-group[data-field="${fieldName}"]`);
    const errorEl = document.getElementById(`error-${fieldName}`);

    if (!rule || !input || !group || !errorEl) return true;

    const value = input.value.trim();
    let errorMessage = '';

    if (rule.required && value.length === 0) {
      errorMessage = rule.emptyMsg;
    } else if (value.length > rule.maxLength) {
      errorMessage = rule.maxMsg;
    }

    const isValid = errorMessage === '';
    group.classList.toggle('has-error', !isValid);
    input.setAttribute('aria-invalid', String(!isValid));
    errorEl.textContent = errorMessage;

    return isValid;
  }

  /**
   * Kiểm tra hợp lệ toàn bộ các trường của đơn đăng ký trước khi gửi API.
   * Tác dụng: Đảm bảo 3 trường có dấu `*` (`name`, `school`, `studentId`) luôn được nhập đầy đủ
   * và nằm trong giới hạn ký tự cho phép; tự động đưa con trỏ về ô lỗi đầu tiên nếu thiếu.
   */
  function validateAllFields(form) {
    const fieldOrder = ['name', 'school', 'studentId', 'question'];
    let firstInvalidInput = null;

    fieldOrder.forEach((fieldName) => {
      const ok = validateSingleField(form, fieldName);
      if (!ok && !firstInvalidInput) {
        firstInvalidInput = form.elements.namedItem(fieldName);
      }
    });

    if (firstInvalidInput) {
      firstInvalidInput.focus();
      firstInvalidInput.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
      return false;
    }

    return true;
  }

  /**
   * Hiển thị khung thông báo kết quả đăng ký (thành công hoặc lỗi) một cách an toàn.
   * Cách hoạt động: Dựng phần tử DOM bằng `document.createElement` và `textContent`
   * thay vì ghép chuỗi HTML với dữ liệu người dùng, giúp hiển thị rõ ràng và chống XSS.
   */
  function renderFormStatus(statusEl, options) {
    const { type, title, message, onReset } = options;

    statusEl.hidden = false;
    statusEl.className = `form-status ${type === 'success' ? 'is-success' : 'is-error'}`;
    statusEl.textContent = '';

    const titleRow = document.createElement('div');
    titleRow.className = 'status-title';

    // Biểu tượng SVG xác nhận hoặc cảnh báo
    const iconNS = 'http://www.w3.org/2000/svg';
    const iconSvg = document.createElementNS(iconNS, 'svg');
    iconSvg.setAttribute('viewBox', '0 0 20 20');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('aria-hidden', 'true');

    const circle = document.createElementNS(iconNS, 'circle');
    circle.setAttribute('cx', '10');
    circle.setAttribute('cy', '10');
    circle.setAttribute('r', '8.5');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '1.6');
    iconSvg.appendChild(circle);

    const path = document.createElementNS(iconNS, 'path');
    if (type === 'success') {
      path.setAttribute('d', 'M6.4 10.2L8.9 12.7L13.8 7.6');
    } else {
      path.setAttribute('d', 'M10 6V10.8M10 13.8H10.01');
    }
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    iconSvg.appendChild(path);

    const titleText = document.createElement('span');
    titleText.textContent = title;

    titleRow.appendChild(iconSvg);
    titleRow.appendChild(titleText);

    const bodyText = document.createElement('p');
    bodyText.style.margin = '0';
    bodyText.textContent = message;

    statusEl.appendChild(titleRow);
    statusEl.appendChild(bodyText);

    if (typeof onReset === 'function') {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'status-reset-btn';
      resetBtn.textContent = 'Đăng ký thêm cho bạn bè';
      resetBtn.addEventListener('click', onReset);
      statusEl.appendChild(resetBtn);
    }
  }

  /**
   * Gửi dữ liệu đăng ký dạng form-encoded (`URLSearchParams(new FormData(form))`)
   * bằng phương thức `POST` tới Google Apps Script Web App.
   * Cách hoạt động:
   * - Chuẩn hoá khoảng trắng các ô nhập trước khi tạo `FormData(form)` để gửi đủ 5 trường:
   *   `name`, `school`, `studentId`, `question`, `website` (honeypot).
   * - Dùng `AbortController` với giới hạn 20 giây để tránh treo nút khi mạng yếu.
   * - Đọc phản hồi JSON `{ "ok": true }` (vì Apps Script đã bật `Access-Control-Allow-Origin: *`
   *   trên cả chuyển hướng 302 lẫn phản hồi 200) để xác nhận chắc chắn dữ liệu đã ghi vào Google Sheets.
   */
  async function submitRegistrationToSheet(form) {
    ['name', 'school', 'studentId', 'question'].forEach((fieldName) => {
      const input = form.elements.namedItem(fieldName);
      if (input) {
        input.value = input.value.trim();
      }
    });

    const payload = new URLSearchParams(new FormData(form));
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: payload,
        credentials: 'omit',
        redirect: 'follow',
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: 'server_error',
        };
      }

      const data = await response.json();
      if (data && data.ok === true) {
        return { ok: true };
      }

      return {
        ok: false,
        error: (data && data.error) || 'server_error',
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Khởi tạo toàn bộ luồng xử lý đơn đăng ký: validate thời gian thực, chặn bấm đúp,
   * gọi API Google Sheets, đóng dấu thiệp mời khi thành công và xử lý lỗi thân thiện.
   */
  function initRegistrationForm() {
    const form = document.getElementById('registration-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnLabel = document.getElementById('submit-btn-label');
    const statusEl = document.getElementById('form-status');
    const inviteTicket = document.getElementById('invite-ticket');

    if (!form || !submitBtn || !submitBtnLabel || !statusEl) return;

    const syncPreviews = initLiveTicketPreview(form);
    let isSubmitting = false;

    // Gắn kiểm tra ngay khi người dùng rời ô hoặc sửa lại ô đang báo lỗi
    ['name', 'school', 'studentId', 'question'].forEach((fieldName) => {
      const input = form.elements.namedItem(fieldName);
      if (!input) return;

      input.addEventListener('blur', () => {
        if (input.value.trim().length > 0 || form.querySelector(`.field-group[data-field="${fieldName}"]`).classList.contains('has-error')) {
          validateSingleField(form, fieldName);
        }
      });

      input.addEventListener('input', () => {
        const group = form.querySelector(`.field-group[data-field="${fieldName}"]`);
        if (group && group.classList.contains('has-error')) {
          validateSingleField(form, fieldName);
        }

        // Tự động ẩn banner lỗi khi người dùng đang chỉnh sửa lại thông tin
        if (!statusEl.hidden && statusEl.classList.contains('is-error')) {
          const allRequiredFilled = ['name', 'school', 'studentId'].every((reqKey) => {
            const reqInput = form.elements.namedItem(reqKey);
            return reqInput && reqInput.value.trim().length > 0;
          });
          if (allRequiredFilled) {
            statusEl.hidden = true;
          }
        }
      });
    });

    /**
     * Bật/tắt trạng thái đang gửi đơn trên nút Đăng ký để tránh gửi trùng bản ghi.
     */
    function setLoadingState(loading) {
      isSubmitting = loading;
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('is-loading', loading);
      submitBtnLabel.textContent = loading ? 'Đang gửi đăng ký...' : 'Đăng ký';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      statusEl.hidden = true;

      if (!validateAllFields(form)) {
        renderFormStatus(statusEl, {
          type: 'error',
          title: 'Bạn còn thiếu thông tin bắt buộc',
          message:
            'Vui lòng điền đầy đủ các mục có dấu (*) trước khi nhấn Đăng ký nhé.',
        });
        return;
      }

      const attendeeName = form.elements.namedItem('name').value.trim();
      setLoadingState(true);

      try {
        const result = await submitRegistrationToSheet(form);

        if (result.ok) {
          if (inviteTicket) {
            inviteTicket.classList.add('is-confirmed');
          }

          renderFormStatus(statusEl, {
            type: 'success',
            title: 'Đăng ký thành công!',
            message: `Cảm ơn ${attendeeName} đã gửi đơn tham gia Talkshow “CHRISTMAS WISHES – Điều Ước Mùa Giáng Sinh”. Hẹn gặp bạn vào 20h00 tối ngày 25/12/2026 tại Trường Đại học Công Nghệ – ĐHQGHN (cơ sở Hoà Lạc)!`,
            onReset: () => {
              form.reset();
              statusEl.hidden = true;
              if (inviteTicket) {
                inviteTicket.classList.remove('is-confirmed');
              }
              form.querySelectorAll('.field-group.has-error').forEach((grp) => {
                grp.classList.remove('has-error');
              });
              syncPreviews();
              const firstInput = form.elements.namedItem('name');
              if (firstInput) firstInput.focus();
            },
          });
        } else {
          const errorMessage =
            API_ERROR_MESSAGES[result.error] || API_ERROR_MESSAGES.server_error;
          renderFormStatus(statusEl, {
            type: 'error',
            title: 'Chưa thể ghi nhận đăng ký',
            message: errorMessage,
          });
        }
      } catch (err) {
        const isTimeout = err && err.name === 'AbortError';
        renderFormStatus(statusEl, {
          type: 'error',
          title: isTimeout ? 'Kết nối quá thời gian chờ' : 'Không thể kết nối máy chủ',
          message: isTimeout
            ? 'Yêu cầu phản hồi chậm hơn dự kiến. Vui lòng kiểm tra kết nối mạng và nhấn Đăng ký lại.'
            : 'Không thể kết nối tới hệ thống đăng ký lúc này. Vui lòng kiểm tra kết nối mạng và thử lại nhé.',
        });
      } finally {
        setLoadingState(false);
      }
    });
  }

  /**
   * Điểm khởi chạy chính khi tài liệu HTML đã sẵn sàng.
   * Tác dụng: Khởi tạo lần lượt các module điều hướng, đếm ngược, hiệu ứng Giáng sinh
   * và đơn đăng ký.
   */
  function bootstrapApp() {
    initSmoothNavigation();
    initCountdown();
    initSantaFlyby();
    initSnowfall();
    initInteractiveOrnaments();
    initScrollReveal();
    initRegistrationForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
  } else {
    bootstrapApp();
  }
})();
