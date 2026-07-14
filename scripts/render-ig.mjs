#!/usr/bin/env node
/**
 * 인스타그램 "이미지 전면형" 카드 렌더러 (레퍼런스 L 스타일)
 *
 * plan.json 의 인스타 항목 중 slidePhotos(슬라이드별 이미지 URL 배열)를 가진 항목만 렌더한다.
 *  - 슬라이드마다 서로 다른 실사/AI 이미지를 배경 전면에 깔고, 그 위에 한글 타이틀을 HTML로 얹는다
 *    (한글/영문 깨짐 방지 — AI 이미지에 글자를 굽지 않고 오버레이).
 *  - igStyle 로 3가지 디자인(cinema / photoA / photoB)을 완전히 다르게 렌더 → 콘텐츠마다 톤 차별화.
 *  - 이미지는 CI에서 URL을 받아 base64로 인라인. 실패하면 단색 폴백.
 * 결과: docs/cards/<id>/<id>-N.png, plan.json 의 slideImages/cardImage 기록.
 * 사용: node scripts/render-ig.mjs --client dongsung
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const clientId = arg('client', 'pslab');

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
const hl = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

async function dl(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return '';
    const b = Buffer.from(await r.arrayBuffer());
    return b.toString('base64');
  } catch { return ''; }
}

// ── 3가지 스타일 ────────────────────────────────
// 공통: 1080x1350. 배경 사진 full-bleed + 하단 스크림. 타이틀/본문은 HTML.
// ⚠️ 헤드리스 크로미움은 하단 ~110px가 캡처에서 잘린다(윈도우 높이≠가용 높이).
//    그래서 모든 하단 텍스트는 flex-end + padding-bottom:135(세이프존) 안에 둔다.
const SAFE_B = 135;
function styleCSS(faces) {
  return `${faces}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word;text-wrap:pretty}
html,body{width:1080px;height:1350px;font-family:'Pretendard';background:#08101c}
.card{width:1080px;height:1350px;position:relative;overflow:hidden;background:#0c1220;color:#fff}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.stage{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:0 64px ${SAFE_B}px}
`;
}

// cinema: 영화 스틸 느낌. 하단 큰 그라데이션 + 굵은 흰 타이틀(좌하단) + 얇은 라인.
function cinemaHTML(photoB64, title, sub, faces) {
  const bg = photoB64 ? `background-image:url(data:image/png;base64,${photoB64})` : 'background:linear-gradient(135deg,#111a2c,#0a0f1a)';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styleCSS(faces)}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,9,16,.15) 0%,rgba(6,9,16,.05) 42%,rgba(6,9,16,.72) 76%,rgba(6,9,16,.95) 100%)}
.sub{font-weight:600;font-size:34px;letter-spacing:.02em;color:#e7ecf5;opacity:.9;margin-bottom:20px;text-shadow:0 2px 12px rgba(0,0,0,.7)}
.title{font-weight:800;font-size:92px;line-height:1.16;letter-spacing:-.03em;text-shadow:0 4px 28px rgba(0,0,0,.85)}
.title em{color:#ffd27a;font-style:normal}
.brandmark{margin-top:30px;padding-top:26px;border-top:2px solid rgba(255,255,255,.28);font-weight:800;font-size:34px;letter-spacing:.02em;color:#fff;opacity:.95;text-shadow:0 2px 14px rgba(0,0,0,.6)}
</style></head><body><div class="card"><div class="bg" style="${bg}"></div><div class="scrim"></div>
<div class="stage">${sub ? `<div class="sub">${esc(sub)}</div>` : ''}<div class="title">${hl(title)}</div><div class="brandmark">@dongsp5771</div></div></div></body></html>`;
}

// photoA: 실사 카드. 상단 레드 액센트 바 + 하단 스크림 + 타이틀 + 작은 본문. 좌측 정렬.
function photoAHTML(photoB64, kicker, title, body, faces) {
  const bg = photoB64 ? `background-image:url(data:image/png;base64,${photoB64})` : 'background:linear-gradient(135deg,#0e1726,#0b1220)';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styleCSS(faces)}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,9,16,.55) 0%,rgba(6,9,16,.12) 32%,rgba(6,9,16,.32) 58%,rgba(6,9,16,.92) 100%)}
.abar{position:absolute;left:0;top:0;width:100%;height:14px;background:#ff5a4d;z-index:2}
.kick{position:absolute;left:64px;top:60px;font-weight:700;font-size:30px;letter-spacing:.18em;color:#ffd9d5;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,.7);z-index:2}
.title{font-weight:800;font-size:82px;line-height:1.18;letter-spacing:-.03em;text-shadow:0 4px 24px rgba(0,0,0,.8)}
.title em{color:#ff8a3d;font-style:normal}
.body{margin-top:22px;font-weight:500;font-size:38px;line-height:1.5;color:#eef2f8;opacity:.94;text-shadow:0 2px 12px rgba(0,0,0,.75)}
.brandmark{margin-top:28px;font-weight:800;font-size:32px;letter-spacing:.02em;color:#fff;opacity:.9;text-shadow:0 2px 14px rgba(0,0,0,.6)}
</style></head><body><div class="card"><div class="bg" style="${bg}"></div><div class="scrim"></div>
<div class="abar"></div>${kicker ? `<div class="kick">${esc(kicker)}</div>` : ''}
<div class="stage"><div class="title">${hl(title)}</div>${body ? `<div class="body">${hl(body)}</div>` : ''}<div class="brandmark">@dongsp5771</div></div></div></body></html>`;
}

// photoB: 잡지 레이아웃. 사진 상단 + 하단 그린 컬러 밴드에 타이틀(다른 무게·자간). 번호 칩.
function photoBHTML(photoB64, no, title, body, faces) {
  const bg = photoB64 ? `background-image:url(data:image/png;base64,${photoB64})` : 'background:#1a2230';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${styleCSS(faces)}
html,body{background:#0a2c1a}
.card{background:#12331f}
.photo{position:absolute;left:0;top:0;width:100%;height:64%;overflow:hidden}
.photo .bg{position:absolute;inset:0;${bg};background-size:cover;background-position:center}
.band{position:absolute;left:0;bottom:0;width:100%;height:41%;background:linear-gradient(180deg,#0f3d24,#0a2c1a);padding:52px 64px ${SAFE_B}px;display:flex;flex-direction:column}
.no{align-self:flex-start;font-weight:800;font-size:30px;letter-spacing:.04em;color:#0a2c1a;background:#7ff0b0;border-radius:999px;padding:6px 20px;margin-bottom:18px}
.title{font-weight:700;font-size:66px;line-height:1.2;letter-spacing:.01em;color:#f2fff6}
.title em{color:#7ff0b0;font-style:normal}
.body{margin-top:14px;font-weight:400;font-size:33px;line-height:1.5;color:#cfe9d8}
.brandmark{margin-top:auto;padding-top:22px;font-weight:800;font-size:32px;letter-spacing:.02em;color:#eafff2;opacity:.92}
</style></head><body><div class="card"><div class="photo"><div class="bg"></div></div>
<div class="band"><span class="no">${esc(no)}</span><div class="title">${hl(title)}</div>${body ? `<div class="body">${hl(body)}</div>` : ''}<div class="brandmark">@dongsp5771</div></div></div></body></html>`;
}

const planFile = join(ROOT, 'data/clients', clientId, 'plan.json');
if (!existsSync(planFile)) { console.log('plan.json 없음 — 건너뜀'); process.exit(0); }
const plan = JSON.parse(readFileSync(planFile, 'utf8'));
const targets = (plan.items ?? []).filter((it) => it.channels?.includes('instagram') && Array.isArray(it.slidePhotos) && it.slidePhotos.length);
if (!targets.length) { console.log('이미지 전면형 인스타 항목(slidePhotos) 없음 — 건너뜀'); process.exit(0); }

const chromium = findChromium();
if (!chromium) { console.log('Chromium 없음 — 건너뜀'); process.exit(0); }
const faces = fontFaces();

for (const it of targets) {
  const outDir = join(ROOT, 'docs/cards', clientId);
  mkdirSync(outDir, { recursive: true });
  const tmp = join(outDir, `_ig_${it.id}.html`);
  const style = it.igStyle || 'photoA';
  const slides = it.slides || [];
  const files = [];
  for (let i = 0; i < it.slidePhotos.length; i++) {
    const b64 = await dl(it.slidePhotos[i]);
    const sl = slides[i];
    let html;
    if (i === 0) {
      // 커버
      html = style === 'cinema'
        ? cinemaHTML(b64, it.headline, it.sub, faces)
        : style === 'photoB'
          ? photoBHTML(b64, 'DONGSUNG', it.headline, it.sub, faces)
          : photoAHTML(b64, it.kicker, it.headline, it.sub, faces);
    } else {
      const t = sl ? sl.title : it.topic;
      const bdy = sl ? sl.body : '';
      html = style === 'cinema'
        ? cinemaHTML(b64, t, sl ? sl.label : '', faces)
        : style === 'photoB'
          ? photoBHTML(b64, sl ? sl.label : String(i + 1), t, bdy, faces)
          : photoAHTML(b64, sl ? sl.label : '', t, bdy, faces);
    }
    writeFileSync(tmp, html);
    const file = `${it.id}-${i + 1}.png`;
    execFileSync(chromium, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--window-size=1080,1350',
      `--screenshot=${join(outDir, file)}`, `file://${tmp}`,
    ], { stdio: 'pipe' });
    files.push(`cards/${clientId}/${file}`);
  }
  try { rmSync(tmp); } catch { /* ignore */ }
  it.slideImages = files;
  it.cardImage = files[0];
  console.log(`  ${it.id} (${style}): ${files.length}장`);
}
writeFileSync(planFile, JSON.stringify(plan, null, 2));
console.log('이미지 전면형 인스타 렌더 완료 → docs/cards/');
