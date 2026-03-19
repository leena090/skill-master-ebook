/**
 * 오버플로우 검사 스크립트
 * 모든 슬라이드가 1920x1080 내에 수용되는지 확인
 * 사용법: node js/check-overflow.js (Playwright 필요)
 */

const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 1920x1080 뷰포트 설정
    await page.setViewportSize({ width: 1920, height: 1080 });

    // index.html 로드
    const filePath = path.resolve(__dirname, '..', 'index.html');
    await page.goto('file://' + filePath);

    // 잠시 대기 (폰트 로딩)
    await page.waitForTimeout(2000);

    // 모든 슬라이드 검사
    const results = await page.evaluate(() => {
        const slides = document.querySelectorAll('.slide');
        const violations = [];

        slides.forEach((slide, i) => {
            // 슬라이드를 임시로 표시
            slide.style.display = 'flex';
            slide.style.position = 'static';
            slide.style.transform = 'none';

            const scrollW = slide.scrollWidth;
            const scrollH = slide.scrollHeight;
            const clientW = 1920;
            const clientH = 1080;

            if (scrollW > clientW || scrollH > clientH) {
                violations.push({
                    slide: i + 1,
                    title: slide.querySelector('.slide-title, .cover-title, .chapter-title')?.textContent?.trim() || '(제목 없음)',
                    scrollWidth: scrollW,
                    scrollHeight: scrollH,
                    overflowX: scrollW - clientW,
                    overflowY: scrollH - clientH
                });
            }

            // 원래 상태 복원
            slide.style.display = '';
            slide.style.position = '';
            slide.style.transform = '';
        });

        return { total: slides.length, violations };
    });

    // 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('  슬라이드 오버플로우 검사 결과');
    console.log('='.repeat(60));
    console.log(`\n총 슬라이드: ${results.total}개`);

    if (results.violations.length === 0) {
        console.log('\n  ✅ 모든 슬라이드 PASS — 오버플로우 없음!\n');
    } else {
        console.log(`\n  ❌ ${results.violations.length}개 위반 발견:\n`);
        results.violations.forEach(v => {
            console.log(`  [슬라이드 ${v.slide}] ${v.title}`);
            if (v.overflowX > 0) console.log(`    → 가로 초과: ${v.overflowX}px`);
            if (v.overflowY > 0) console.log(`    → 세로 초과: ${v.overflowY}px`);
            console.log('');
        });
    }

    console.log('='.repeat(60) + '\n');

    await browser.close();
    process.exit(results.violations.length > 0 ? 1 : 0);
})();
