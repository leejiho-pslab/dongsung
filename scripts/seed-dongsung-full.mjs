#!/usr/bin/env node
/**
 * 동성특수인쇄 7월 풀 기획안 시드 (33건)
 *  - 네이버 블로그 10 + 구글 블로그 10(같은 롱폼 미러) + 인스타 10(캐러셀7:릴스3) + 유튜브 쇼츠 3
 *  - blog-figures.json(커버+본문 도표 렌더 시드)도 함께 생성
 *  - 발행 시각 배치는 schedule-daily.mjs --perday 2 로 7월에 고르게
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLES_1, FOOTER } from './seed-data-blogs-1.mjs';
import { ARTICLES_2 } from './seed-data-blogs-2.mjs';
import { INSTA, YT } from './seed-data-social.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLES = [...ARTICLES_1, ...ARTICLES_2];

// 분량 보강 — 글별 맞춤 실무 팁/FAQ (2000~2500자 충족용)
const EXTRAS = {
  cosmetic: [
'[한 가지 더 — 색상 사고 예방]',
'화장품 박스는 시리즈 컬러가 생명이에요. 1차 발주와 2차 발주의 색이 미묘하게 다르면 매대에서 바로 티가 나죠. 저희는 초도 생산 때 컬러칩(기준 색 샘플)을 보관해 재발주 때도 같은 색을 맞춰드려요. 리뉴얼로 색을 바꿀 때도 기존 칩과 비교하며 조정하니 안심하세요.',
  ].join('\n'),
  chuseok: [
'[늦게 시작했다면 — 플랜 B]',
'"벌써 8월인데 어떡하죠?" 하는 분들을 위한 차선책도 있어요. 싸바리 대신 고급 합지박스로 구조를 바꾸면 납기를 1주 이상 줄일 수 있고, 규격 사이즈 목형을 활용하면 개발 기간이 빠져요. 후가공을 금박 하나로 절제해도 명절 세트의 품격은 지킬 수 있습니다. 늦었다고 포기하지 마시고 일정부터 알려주세요 — 사양을 역산으로 맞춰드릴게요.',
  ].join('\n'),
  shoppingbag: [
'[자주 묻는 질문]',
'Q. 쇼핑백만 따로 주문해도 되나요? — 네, 됩니다. 다만 박스와 함께 만들면 지류 톤과 박 색을 맞추기 쉽고 동판 공유로 개발비도 아껴져요.',
'Q. 수량이 적은데 수제로 하면 많이 비싼가요? — 소량에서는 자동과 수제의 단가 차이가 생각보다 크지 않아요. 대신 지류·손잡이 선택 폭이 훨씬 넓어서 프리미엄 브랜드는 소량 수제를 많이 선택하세요.',
'Q. 명절 시즌에도 바로 되나요? — 쇼핑백도 8월부터 물량이 몰려요. 박스와 같은 일정으로 미리 잡아두시는 게 안전합니다.',
  ].join('\n'),
  boxtypes: [
'[자주 묻는 질문]',
'Q. 처음인데 샘플부터 볼 수 있나요? — 네, 저희는 낱개 수량 상관없이 완제품 샘플까지 제작해 드려요. 실물을 만져보고 결정하는 게 가장 정확해요.',
'Q. 지금 단상자를 쓰는데 싸바리로 바꾸고 싶어요. — 기존 박스 실물을 가져오시면 같은 치수로 싸바리 전환 견적을 바로 잡아드려요. 내지 추가 여부에 따라 구성도 제안해 드리고요.',
'Q. 세 종류를 섞어서 발주해도 되나요? — 물론이에요. 라인별로 다른 구조를 쓰는 게 오히려 정석이고, 한 공장에서 만들면 톤 관리가 쉬워요.',
  ].join('\n'),
  foil: [
'[자주 묻는 질문]',
'Q. 박이 시간이 지나면 벗겨지지 않나요? — 제대로 앉힌 박은 일상 사용에서 벗겨지지 않아요. 코팅 위에 박을 올리는 순서, 압력 세팅 같은 공정 관리가 품질을 좌우하는데, 이게 특수인쇄 전문 공장의 차이예요.',
'Q. 아주 작은 글씨도 박이 되나요? — 0.3mm 이하의 가는 획은 뭉개질 수 있어 디자인 조정을 권해요. 파일 검토 때 미리 잡아드립니다.',
'Q. 박과 비슷한 효과를 더 저렴하게 내는 방법은요? — 금색 별색 인쇄+유광 부분코팅 조합이 차선책이에요. 다만 금속광의 깊이는 박이 압도적이라, 로고만이라도 박을 권해드려요.',
  ].join('\n'),
  structure: [
'[자주 묻는 질문]',
'Q. 목형 비용이 아까운데 규격 구조로만 하면 안 되나요? — 됩니다! 검증된 규격 구조 + 사이즈 조정으로 시작하고, 브랜드가 커지면 전용 구조를 개발하는 단계적 접근을 많이 추천해요.',
'Q. 구조 아이디어가 있는데 그림을 못 그려요. — 말로 설명해 주시면 저희가 백상지 목업으로 만들어 보여드려요. 만져보면서 다듬는 게 도면보다 빨라요.',
'Q. 남의 박스 구조를 따라 해도 되나요? — 일반적인 구조는 괜찮지만 등록된 실용신안 구조는 침해가 될 수 있어요. 저희가 설계 단계에서 검토해 드립니다.',
  ].join('\n'),
  estimate: [
'[자주 묻는 질문]',
'Q. 견적만 받아봐도 되나요? — 물론이에요. 사양이 대략적이어도 범위 견적을 드리고, 확정 사양이 나오면 정확한 금액과 일정을 다시 드려요.',
'Q. 타사 견적서를 가져가면 비교 설명해 주시나요? — 네, 항목별로 어디서 차이가 나는지 짚어드려요. 싼 견적에는 보통 이유(지류 등급, 후가공 생략, 검수 범위)가 있거든요.',
'Q. 재발주 때는 얼마나 저렴해지나요? — 목형·동판 개발비가 빠지고 데이터 세팅이 끝나 있어, 같은 수량 기준으로 눈에 띄게 내려가요. 첫 견적서에 재발주 예상가도 함께 표기해 드립니다.',
  ].join('\n'),
  redginseng: [
'[자주 묻는 질문]',
'Q. 내지만 따로 제작할 수 있나요? — 네, 기존 박스에 맞춘 트레이·스폰지 내지만 제작하는 것도 가능해요. 구성품이 바뀌었을 때 박스는 그대로 두고 내지만 바꾸면 비용을 크게 아껴요.',
'Q. 식품이 직접 닿아도 되는 재질인가요? — 내용물이 직접 닿는 구성이라면 접촉 안전 소재로 설계해요. 상담 때 구성품의 포장 상태(개별 포장 여부)를 알려주시면 정확히 제안해 드려요.',
'Q. 소량 시제품 세트도 되나요? — 네, 낱개 샘플 제작이 가능하니 크라우드펀딩·시장 테스트용 소량 세트도 부담 없이 시작하세요.',
  ].join('\n'),
  liquor: [
'[자주 묻는 질문]',
'Q. 병 도면이 없는데 실물만 보내도 되나요? — 네, 병 실물이 가장 정확해요. 실측해서 내지와 구조를 설계해 드립니다.',
'Q. 2병+잔 2개 같은 복합 구성도 되나요? — 됩니다. 구성품별 자리를 나누는 내지 설계가 저희 전문이에요. 무게 배분까지 계산해 손잡이 하중을 잡아요.',
'Q. 수출용인데 항공 운송을 견딜까요? — 운송 환경(항공·해상·택배)을 알려주시면 완충 구조와 외박스까지 함께 설계해 드려요. 이중구조 상자 관련 실용신안 경험이 여기서 힘을 발휘합니다.',
  ].join('\n'),
};

const items = [];
const figures = [];
let order = 0;
const base = (o) => ({
  scheduledFor: new Date(Date.UTC(2026, 6, 15, 9, 0, 0) + order * 3600000).toISOString(),
  score: 95 - order,
  status: 'planned',
  dayLabel: '',
  palette: 'ink',
  slides: [],
  ...o,
});

// 블로그: 네이버 + 구글(미러)
// 짧은 마무리 팁 (분량 미세 보정)
const CLOSERS = {
  chuseok: '💡 실장의 한 줄 팁: 상담 예약 때 "추석 세트"라고만 말씀하셔도 저희가 역산 캘린더를 바로 그려드려요. 올해 일정표를 프린트해서 팀 회의에 쓰셔도 좋습니다.',
  shoppingbag: '💡 실장의 한 줄 팁: 쇼핑백은 접힌 상태로 납품돼요. 매장 보관 공간이 좁다면 납품 단위를 나눠 받는 방법도 있으니 함께 계획해요. 들었을 때 어깨에 닿는 높이(끈 길이)까지 확인하면 완벽합니다.',
  boxtypes: '💡 실장의 한 줄 팁: 고민될 땐 세 종류 샘플을 나란히 놓고 제품을 직접 넣어보세요. 저희 상담실엔 구조별 샘플이 준비돼 있어서, 30분이면 답이 나옵니다. 커피 한 잔 준비해 둘게요 — 실물을 만져보는 순간 "아, 이거네" 하실 거예요.',
  estimate: '💡 실장의 한 줄 팁: 견적 문의 때 ①제품 사진 ②대략 수량 ③희망 예산, 이 세 가지만 주시면 첫 회신이 빨라져요. 예산을 말하면 손해라는 걱정은 안 하셔도 돼요 — 예산 안에서 최선을 짜는 게 저희 일이니까요. 견적서 항목이 이해 안 되면 언제든 전화 주세요 — 한 줄 한 줄 같이 읽어드립니다. 아는 만큼 아끼는 게 견적이에요.',
  redginseng: '💡 실장의 한 줄 팁: 시즌 리뉴얼 때 박스는 유지하고 띠지(슬리브)만 바꾸는 브랜드도 많아요. 개발비 없이 새 시즌 느낌을 내는 가성비 전략이랍니다.',
  liquor: '💡 실장의 한 줄 팁: 증정용 잔이나 오프너가 늦게 확정되는 경우가 많아요. 내지 설계에 "여분 칸"을 미리 잡아두면 구성이 바뀌어도 대응이 됩니다. 병 라벨이 확정되기 전이라도 병 몸통 치수만 있으면 구조 설계는 먼저 시작할 수 있어요.',
};

for (const a of ARTICLES) {
  const extra = EXTRAS[a.slug] ? `\n\n${EXTRAS[a.slug]}` : '';
  const closer = CLOSERS[a.slug] ? `\n\n${CLOSERS[a.slug]}` : '';
  const captionBody = `${a.body}${extra}${closer}\n${FOOTER}\n\n${a.tags}`;
  for (const [prefix, channel] of [['nv', 'naver-blog'], ['gb', 'blogger']]) {
    const id = `${prefix}-${a.slug}`;
    items.push(base({
      id, topic: a.topic, format: '블로그', channels: [channel],
      kicker: a.kicker, headline: a.headline, sub: a.sub, motif: a.motif,
      variant: 'A', captionBody, captionNote: a.sub, rationale: a.kicker,
    }));
    figures.push({ id, channel, figures: [a.figure] });
    order++;
  }
}

// 인스타 10
for (const g of INSTA) {
  items.push(base({
    id: g.id, topic: g.topic, format: g.format, channels: ['instagram'],
    kicker: g.kicker, headline: g.headline, sub: g.sub, motif: g.motif,
    variant: g.variant, captionBody: g.captionBody, captionNote: g.sub,
    rationale: g.kicker, slides: g.slides,
  }));
  order++;
}

// 유튜브 3
for (const y of YT) {
  items.push(base({
    id: y.id, topic: y.topic, format: '쇼츠 대본', channels: ['youtube'],
    kicker: y.kicker, headline: y.headline, sub: y.sub, motif: y.motif,
    variant: y.variant, captionBody: y.captionBody, captionNote: y.sub,
    rationale: y.kicker, ytTitle: y.ytTitle, ytDescription: y.ytDescription, ytTags: y.ytTags,
  }));
  order++;
}

const dir = join(ROOT, 'data/clients/dongsung');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'plan.json'), JSON.stringify({ updatedAt: new Date(Date.UTC(2026, 6, 14, 15, 0, 0)).toISOString(), items }, null, 2));
writeFileSync(join(dir, 'blog-figures.json'), JSON.stringify(figures, null, 2));

const byCh = items.reduce((m, i) => ((m[i.channels[0]] = (m[i.channels[0]] || 0) + 1), m), {});
console.log(`풀 기획안 시드 완료: ${items.length}건 → plan.json / 도표 시드 ${figures.length}건 → blog-figures.json`);
console.log('채널 분포:', JSON.stringify(byCh));
const blogs = items.filter((i) => i.format === '블로그' && i.channels[0] === 'naver-blog');
console.log('블로그 분량:', blogs.map((i) => `${i.id}=${i.captionBody.length}자`).join(' '));
