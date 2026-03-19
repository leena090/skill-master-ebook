/**
 * 맥북프로 완전정복 — 슬라이드 네비게이션
 * 키보드 좌우 화살표, 트랙패드 스와이프, 프로그레스바 지원
 */

(function () {
    'use strict';

    /* ── 상태 변수 ── */
    let currentSlide = 0;          // 현재 슬라이드 인덱스
    let slides = [];               // 모든 슬라이드 DOM 목록
    let totalSlides = 0;           // 총 슬라이드 수
    let isAnimating = false;       // 애니메이션 잠금 플래그
    let touchStartX = 0;           // 터치 시작 X좌표
    let touchStartY = 0;           // 터치 시작 Y좌표
    let zoomLevel = 0;             // 줌 레벨 (0=자동, +1씩 확대, -1씩 축소)

    /* ── 초기화 ── */
    function init() {
        slides = document.querySelectorAll('.slide');
        totalSlides = slides.length;

        if (totalSlides === 0) return;

        // URL 해시에서 슬라이드 번호 복원
        const hash = window.location.hash;
        if (hash && hash.startsWith('#slide-')) {
            const num = parseInt(hash.replace('#slide-', ''), 10);
            if (num >= 1 && num <= totalSlides) {
                currentSlide = num - 1;
            }
        }

        // 프로그레스바 생성
        createProgressBar();

        // 네비게이션 컨트롤 생성
        createNavControls();

        // 첫 슬라이드 표시
        showSlide(currentSlide);

        // 뷰포트에 맞춰 슬라이드 스케일 조정
        scaleSlides();

        // 이벤트 리스너 등록
        bindEvents();
    }

    /* ── 슬라이드 표시 ── */
    function showSlide(index) {
        // 범위 체크
        if (index < 0 || index >= totalSlides) return;

        // 이전 슬라이드 숨기기
        slides.forEach(s => s.classList.remove('active'));

        // 새 슬라이드 표시
        currentSlide = index;
        slides[currentSlide].classList.add('active');

        // URL 해시 업데이트
        history.replaceState(null, null, '#slide-' + (currentSlide + 1));

        // 프로그레스바 업데이트
        updateProgress();

        // 네비게이션 정보 업데이트
        updateNavInfo();
    }

    /* ── 다음 슬라이드 ── */
    function nextSlide() {
        if (isAnimating || currentSlide >= totalSlides - 1) return;
        isAnimating = true;
        showSlide(currentSlide + 1);
        setTimeout(() => { isAnimating = false; }, 200);
    }

    /* ── 이전 슬라이드 ── */
    function prevSlide() {
        if (isAnimating || currentSlide <= 0) return;
        isAnimating = true;
        showSlide(currentSlide - 1);
        setTimeout(() => { isAnimating = false; }, 200);
    }

    /* ── 프로그레스바 ── */
    function createProgressBar() {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.id = 'progressBar';
        document.body.appendChild(bar);
    }

    function updateProgress() {
        const bar = document.getElementById('progressBar');
        if (!bar) return;
        const pct = ((currentSlide + 1) / totalSlides) * 100;
        bar.style.width = pct + '%';
    }

    /* ── 네비게이션 컨트롤 ── */
    function createNavControls() {
        const nav = document.createElement('div');
        nav.className = 'nav-controls';
        nav.innerHTML = `
            <button class="nav-btn" id="prevBtn" aria-label="이전 슬라이드">&#9664;</button>
            <span class="nav-info" id="navInfo">1 / ${totalSlides}</span>
            <button class="nav-btn" id="nextBtn" aria-label="다음 슬라이드">&#9654;</button>
            <span style="color:rgba(255,255,255,0.3);margin:0 4px;">|</span>
            <button class="nav-btn" id="zoomOutBtn" aria-label="축소" style="font-size:16px;">−</button>
            <span class="nav-info" id="zoomInfo" style="min-width:40px;opacity:0.5;">100%</span>
            <button class="nav-btn" id="zoomInBtn" aria-label="확대" style="font-size:16px;">+</button>
        `;
        document.body.appendChild(nav);

        document.getElementById('prevBtn').addEventListener('click', prevSlide);
        document.getElementById('nextBtn').addEventListener('click', nextSlide);
        document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
        document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
    }

    function updateNavInfo() {
        const info = document.getElementById('navInfo');
        if (info) {
            info.textContent = (currentSlide + 1) + ' / ' + totalSlides;
        }
    }

    /* ── 슬라이드 스케일링 (뷰포트 맞춤 + 줌) ── */
    function scaleSlides() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scaleX = vw / 1920;
        const scaleY = vh / 1080;
        const baseScale = Math.min(scaleX, scaleY);
        // 줌 레벨 적용 (10%씩 확대/축소)
        const scale = baseScale * (1 + zoomLevel * 0.1);

        slides.forEach(slide => {
            slide.style.transform = `translate(-50%, -50%) scale(${scale})`;
        });

        // 줌 표시 업데이트
        updateZoomInfo(Math.round(scale * 100));
    }

    function zoomIn() {
        if (zoomLevel < 5) { zoomLevel++; scaleSlides(); }
    }

    function zoomOut() {
        if (zoomLevel > -3) { zoomLevel--; scaleSlides(); }
    }

    function zoomReset() {
        zoomLevel = 0; scaleSlides();
    }

    function updateZoomInfo(pct) {
        let el = document.getElementById('zoomInfo');
        if (!el) return;
        el.textContent = pct + '%';
        el.style.opacity = '1';
        clearTimeout(el._timer);
        el._timer = setTimeout(() => { el.style.opacity = '0.5'; }, 1500);
    }

    /* ── 이벤트 바인딩 ── */
    function bindEvents() {
        // 키보드 이벤트
        document.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                case ' ':           // 스페이스바
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    showSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    showSlide(totalSlides - 1);
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    zoomReset();
                    break;
            }
        });

        // 트랙패드/터치 스와이프
        document.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', function (e) {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;

            // 수평 스와이프가 수직보다 클 때만 반응
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                if (dx < 0) nextSlide();   // 왼쪽 스와이프 → 다음
                else prevSlide();           // 오른쪽 스와이프 → 이전
            }
        }, { passive: true });

        // 마우스 휠 (트랙패드 2핑거 스크롤 + 핀치 줌)
        let wheelTimeout = null;
        document.addEventListener('wheel', function (e) {
            e.preventDefault();

            // 트랙패드 핀치 줌 (ctrlKey가 true이면 핀치 제스처)
            if (e.ctrlKey) {
                if (e.deltaY < 0) zoomIn();
                else if (e.deltaY > 0) zoomOut();
                return;
            }

            // 일반 스크롤 → 슬라이드 이동
            if (wheelTimeout) return;
            wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 300);

            if (e.deltaX > 30 || e.deltaY > 30) nextSlide();
            else if (e.deltaX < -30 || e.deltaY < -30) prevSlide();
        }, { passive: false });

        // 윈도우 리사이즈 시 스케일 재계산
        window.addEventListener('resize', scaleSlides);
    }

    /* ── DOM 로드 후 초기화 ── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
