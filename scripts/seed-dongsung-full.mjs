#!/usr/bin/env node
/**
 * 동성특수인쇄 7월 풀 기획안 시드 v3 (33건)
 *  - 네이버 블로그 10(스토리형) + 구글 블로그 10(가이드형) — 서로 다른 원고, 본문에 사진 4장+
 *  - 인스타 10(캐러셀7:릴스3) + 유튜브 쇼츠 3
 *  - 블로그 kicker(SEO/ISSUE) 없음. 대표이미지는 render-blog-images가 정사각으로 렌더.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOOTER } from './blog-img.mjs';
import { NAVER } from './blog-naver.mjs';
import { GOOGLE } from './blog-google.mjs';
import { INSTA, YT } from './seed-data-social.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOTIF = { 싸바리박스:'compass', 화장품박스:'bulb', 선물세트박스:'branch', 쇼핑백제작:'compass',
  박스제작:'branch', 금박인쇄:'bulb', 지기구조:'compass', 패키지제작:'chart', 홍삼패키지:'compass', 주류패키지:'branch' };

const items = [];
let order = 0;
const base = (o) => ({
  scheduledFor: new Date(Date.UTC(2026, 6, 15, 9, 0, 0) + order * 3600000).toISOString(),
  score: 95 - order, status: 'planned', dayLabel: '', palette: 'ink', slides: [], ...o,
});

// 블로그 — 네이버(스토리) + 구글(가이드), 각 원고 다름
const blogItem = (prefix, channel, a) => {
  const captionBody = `${a.body}\n${FOOTER}\n\n${a.tags}`;
  return base({
    id: `${prefix}-${a.slug}`, topic: a.topic, format: '블로그', channels: [channel],
    kicker: '', headline: a.headline, sub: a.sub, motif: MOTIF[a.topic] || 'compass',
    variant: 'A', captionBody, captionNote: a.sub, rationale: '',
  });
};
for (const a of NAVER) { items.push(blogItem('nv', 'naver-blog', a)); order++; }
for (const a of GOOGLE) { items.push(blogItem('gb', 'blogger', a)); order++; }

// 인스타
for (const g of INSTA) {
  items.push(base({
    id: g.id, topic: g.topic, format: g.format, channels: ['instagram'],
    kicker: g.kicker, headline: g.headline, sub: g.sub, motif: g.motif,
    variant: g.variant, captionBody: g.captionBody, captionNote: g.sub, rationale: g.kicker, slides: g.slides,
    ...(g.igStyle ? { igStyle: g.igStyle } : {}),
    ...(g.slidePhotos ? { slidePhotos: g.slidePhotos } : {}),
  }));
  order++;
}
// 유튜브 3
for (const y of YT) {
  items.push(base({
    id: y.id, topic: y.topic, format: '쇼츠 대본', channels: ['youtube'],
    kicker: y.kicker, headline: y.headline, sub: y.sub, motif: y.motif,
    variant: y.variant, captionBody: y.captionBody, captionNote: y.sub, rationale: y.kicker,
    ytTitle: y.ytTitle, ytDescription: y.ytDescription, ytTags: y.ytTags,
  }));
  order++;
}

const dir = join(ROOT, 'data/clients/dongsung');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'plan.json'), JSON.stringify({ updatedAt: new Date(Date.UTC(2026, 6, 14, 15, 0, 0)).toISOString(), items }, null, 2));

const byCh = items.reduce((m, i) => ((m[i.channels[0]] = (m[i.channels[0]] || 0) + 1), m), {});
console.log(`풀 기획안 v3 시드 완료: ${items.length}건 → plan.json`);
console.log('채널 분포:', JSON.stringify(byCh));
const blogs = items.filter((i) => i.format === '블로그');
const imgcount = (s) => (s.match(/^!\[/gm) || []).length;
console.log('블로그 분량/이미지:', blogs.map((i) => `${i.id}=${i.captionBody.length}자·${imgcount(i.captionBody)}장`).join(' '));
