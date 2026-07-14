#!/usr/bin/env node
/**
 * 블로그 대표이미지(썸네일) 렌더러 — 네이버/구글 블로그 공용
 *
 * plan.json 의 블로그 항목(naver-blog·blogger)마다 정사각(1080×1080) 대표이미지를 만든다.
 *  - 네이버 블로그 피드·검색 썸네일이 정사각(1:1)이라 그 규격에 맞춘다.
 *  - 배경은 docs/bg/<id>.jpg(힉스필드 실사) + 어두운 스크림, 그 위에 제목만.
 *  - SEO/ISSUE 같은 운영 표시는 넣지 않는다. 브랜드 워터마크만.
 *  - plan.json 의 해당 항목에 cardImage/slideImages(=blog/<id>/cover.png)를 기록해
 *    대시보드 카드 썸네일과 네이버 대표사진 다운로드가 같은 정사각 이미지를 쓰게 한다.
 *
 * 본문 삽입 이미지는 captionBody 의 ![](url) 마크다운으로 직접 넣으므로 여기서 렌더하지 않는다.
 * Chromium 없으면 건너뜀(커밋된 이미지 유지).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const clientId = arg('client', 'pslab');
const BLOG_CH = ['naver-blog', 'blogger'];

function findChromium() {
  if (process.env.PSLAB_CHROMIUM && existsSync(process.env.PSLAB_CHROMIUM)) return process.env.PSLAB_CHROMIUM;
  if (existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  for (const c of ['chromium', 'chromium-browser', 'google-chrome', 'chrome']) {
    try { return execFileSync('which', [c], { encoding: 'utf8' }).trim(); } catch { /* keep */ }
  }
  return null;
}
const FONT_WEIGHTS = { ExtraBold: 800, Bold: 700, SemiBold: 600, Medium: 500, Regular: 400 };
function fontFaces() {
  const dir = join(ROOT, 'assets/fonts');
  return Object.entries(FONT_WEIGHTS).map(([w, weight]) => {
    const b64 = readFileSync(join(dir, `Pretendard-${w}.otf`)).toString('base64');
    return `@font-face{font-family:'Pretendard';font-weight:${weight};src:url(data:font/otf;base64,${b64}) format('opentype');}`;
  }).join('\n');
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// 채널별 포인트 컬러(대표이미지 하단 바)
const ACCENT = { 'naver-blog': '#22c55e', blogger: '#ff8a3d' };

// 정사각 1080×1080 대표이미지 — 배경사진 + 하단 어두운 그라데이션, 하단에 제목
function coverHtml(title, accent, bgB64) {
  const bg = bgB64
    ? `background-image:linear-gradient(180deg,rgba(9,13,22,.12) 0%,rgba(9,13,22,.30) 42%,rgba(9,13,22,.82) 78%,rgba(9,13,22,.95) 100%),url(data:image/jpeg;base64,${bgB64});background-size:cover;background-position:center;`
    : `background:linear-gradient(135deg,#0d1526 0%,#101a2c 100%);`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaces()}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word;text-wrap:pretty}
html,body{width:1080px;height:1080px}
.cover{width:1080px;height:1080px;position:relative;overflow:hidden;${bg}color:#f6f8fc;font-family:'Pretendard';
  display:flex;flex-direction:column;justify-content:flex-end;padding:80px 84px 96px}
.title{font-weight:800;font-size:82px;line-height:1.22;letter-spacing:-.03em;text-shadow:0 4px 30px rgba(0,0,0,.75)}
.brand{margin-top:34px;font-weight:700;font-size:34px;color:#dfe7f2;opacity:.95;text-shadow:0 2px 12px rgba(0,0,0,.7)}
.uline{position:absolute;left:0;right:0;bottom:0;height:18px;background:${accent}}
</style></head><body><div class="cover">
  <div class="title">${esc(title)}</div>
  <div class="brand">@dongsp5771</div>
  <div class="uline"></div>
</div></body></html>`;
}

const planFile = join(ROOT, 'data/clients', clientId, 'plan.json');
if (!existsSync(planFile)) { console.log(`plan.json 없음: ${planFile} — 건너뜀`); process.exit(0); }
const plan = JSON.parse(readFileSync(planFile, 'utf8'));
const blogItems = (plan.items ?? []).filter((it) => (it.channels || []).some((c) => BLOG_CH.includes(c)) && it.headline);
if (blogItems.length === 0) { console.log('블로그 항목 없음 — 건너뜀'); process.exit(0); }

const chromium = findChromium();
if (!chromium) {
  for (const it of blogItems) {
    const p = `blog/${it.id}/cover.png`;
    if (existsSync(join(ROOT, 'docs', p))) { it.cardImage = p; it.slideImages = [p]; }
  }
  writeFileSync(planFile, JSON.stringify(plan, null, 2));
  console.log('Chromium 없음 → 커버 렌더 건너뜀(경로만 연결)');
  process.exit(0);
}

let n = 0;
for (const it of blogItems) {
  const outDir = join(ROOT, 'docs/blog', it.id);
  mkdirSync(outDir, { recursive: true });
  const tmp = join(outDir, '_tmp.html');
  const title = (it.headline || it.topic || '').replace(/<br>/g, ' ').replace(/\*/g, '');
  const bgFile = join(ROOT, 'docs/bg', `${it.id}.jpg`);
  const bgB64 = existsSync(bgFile) ? readFileSync(bgFile).toString('base64') : '';
  const accent = ACCENT[it.channels.find((c) => BLOG_CH.includes(c))] || '#22c55e';
  writeFileSync(tmp, coverHtml(title, accent, bgB64));
  execFileSync(chromium, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1080,1080',
    `--screenshot=${join(outDir, 'cover.png')}`, `file://${tmp}`,
  ], { stdio: 'pipe' });
  try { rmSync(tmp); } catch { /* ignore */ }
  const p = `blog/${it.id}/cover.png`;
  it.cardImage = p;
  it.slideImages = [p];
  n++;
  console.log(`  ${it.id} (${it.channels[0]}): 정사각 대표이미지`);
}
writeFileSync(planFile, JSON.stringify(plan, null, 2));
console.log(`블로그 대표이미지 ${n}장 렌더 완료 → docs/blog/ (plan.json 썸네일 경로 기록)`);
