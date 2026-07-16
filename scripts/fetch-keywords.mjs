#!/usr/bin/env node
/**
 * 네이버 검색광고 "키워드 도구" 월간검색수 수집 → keyword-trends.json (v2)
 *
 * 블로그(네이버·구글) 기획을 "실제 검색량" 기준으로 움직이기 위한 데이터 소스.
 * 네이버 검색광고 API(/keywordstool)를 HMAC 서명 호출해 시드 키워드의
 * 월간검색수(PC/모바일)·경쟁정도를 받아오고, 검색량 높은 연관키워드도 발굴한다.
 *
 * 필요한 시크릿(GitHub Secrets):
 *   NAVER_AD_API_KEY     = 액세스라이선스 (검색광고 > 도구 > API 사용 관리)
 *   NAVER_AD_SECRET      = 비밀키
 *   NAVER_AD_CUSTOMER_ID = 계정 번호(CUSTOMER_ID)
 * 없으면 조용히 건너뜀(기존 keyword-trends.json 유지) — CI를 깨지 않는다.
 *
 * 사용: node scripts/fetch-keywords.mjs --client dongsung
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const clientId = arg('client', 'pslab');

const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET = process.env.NAVER_AD_SECRET;
const CUSTOMER = process.env.NAVER_AD_CUSTOMER_ID;
if (!API_KEY || !SECRET || !CUSTOMER) {
  console.log('네이버 검색광고 API 시크릿 없음(NAVER_AD_API_KEY/SECRET/CUSTOMER_ID) — 키워드 수집 건너뜀');
  process.exit(0);
}

const BASE = 'https://api.searchad.naver.com';
const PATH = '/keywordstool';

// 시드 키워드: clients/<id>.json 의 keywords + 블로그 주력 키워드
function seedKeywords() {
  try {
    const cfg = JSON.parse(readFileSync(join(ROOT, 'clients', `${clientId}.json`), 'utf8'));
    const base = Array.isArray(cfg.keywords) ? cfg.keywords : [];
    const extra = ['싸바리박스', '패키지제작', '단상자', '화장품박스', '선물세트박스',
      '쇼핑백제작', '홍삼패키지', '주류패키지', '금박인쇄', '지기구조', '박스제작', '인쇄후가공'];
    return [...new Set([...base, ...extra].map((s) => String(s).replace(/\s+/g, '')))];
  } catch { return []; }
}

function sign(ts, method, path) {
  return createHmac('sha256', SECRET).update(`${ts}.${method}.${path}`).digest('base64');
}

// 월간검색수 문자열('< 10')·숫자 → 정수
const toNum = (v) => {
  if (v == null) return 0;
  const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

async function keywordstool(hints) {
  const ts = Date.now();
  const qs = `hintKeywords=${encodeURIComponent(hints.join(','))}&showDetail=1`;
  const res = await fetch(`${BASE}${PATH}?${qs}`, {
    method: 'GET',
    headers: {
      'X-Timestamp': String(ts),
      'X-API-KEY': API_KEY,
      'X-Customer': String(CUSTOMER),
      'X-Signature': sign(ts, 'GET', PATH),
    },
  });
  if (!res.ok) { console.log(`  API ${res.status} — ${(await res.text()).slice(0, 120)}`); return []; }
  const j = await res.json();
  return Array.isArray(j.keywordList) ? j.keywordList : [];
}

const seeds = seedKeywords();
if (!seeds.length) { console.log('시드 키워드 없음 — 건너뜀'); process.exit(0); }

// 힌트는 요청당 최대 5개 → 배치. 응답엔 연관키워드가 대량 포함됨.
const rows = new Map(); // relKeyword → row
for (let i = 0; i < seeds.length; i += 5) {
  const batch = seeds.slice(i, i + 5);
  try {
    const list = await keywordstool(batch);
    for (const r of list) if (r && r.relKeyword) rows.set(r.relKeyword.replace(/\s+/g, ''), r);
  } catch (e) { console.log(`  배치 실패 ${batch.join(',')}: ${e.message}`); }
  await new Promise((r) => setTimeout(r, 400)); // 레이트리밋 여유
}

const mapRow = (r) => {
  const pc = toNum(r.monthlyPcQcCnt), mo = toNum(r.monthlyMobileQcCnt);
  return { kw: r.relKeyword.replace(/\s+/g, ''), pc, mobile: mo, total: pc + mo, comp: r.compIdx || '' };
};

// 1) 시드 키워드(정확 매칭) → 우리 주력 키워드 성적표
const primary = seeds.map((s) => rows.get(s)).filter(Boolean).map(mapRow)
  .sort((a, b) => b.total - a.total);

// 2) 발굴: 시드에 없던 연관키워드 중 "패키지/인쇄 관련"만 + 검색량 상위 12개(새 소재 후보)
//    ※ 네이버 keywordstool은 캘린더·가방 등 무관한 대량 키워드도 섞어주므로 관련어만 필터.
const seedSet = new Set(seeds);
const PKG_RE = /(박스|상자|패키지|쇼핑백|지함|카톤|포장|인쇄|후가공|금박|은박|형압|에폭시|홀로그램|단상자|합지|굿즈|케이스|리플렛|명함|스티커|라벨|지기|틴|제작소|인쇄소)/;
const related = [...rows.values()].map(mapRow)
  .filter((r) => !seedSet.has(r.kw) && r.total > 0 && PKG_RE.test(r.kw))
  .sort((a, b) => b.total - a.total).slice(0, 12);

const out = {
  source: `네이버 검색광고 키워드도구 · 월간검색수(PC+모바일)`,
  updatedAt: new Date().toISOString(),
  keywords: primary,   // v2: pc/mobile/total/comp
  related,             // 발굴 후보
};
const file = join(ROOT, 'data/clients', clientId, 'keyword-trends.json');
if (!existsSync(dirname(file))) { console.log('데이터 폴더 없음 — 건너뜀'); process.exit(0); }
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`키워드 수집 완료: 주력 ${primary.length}개 · 발굴 ${related.length}개 → keyword-trends.json`);
console.log('상위:', primary.slice(0, 5).map((k) => `${k.kw}=${k.total}`).join(' '));
