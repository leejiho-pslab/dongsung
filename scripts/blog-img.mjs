/** 힉스필드 생성 이미지 라이브러리 (사물·배경, 텍스트 없음) — 블로그 본문 삽입용 */
const B = 'https://d8j0ntlcm91z4.cloudfront.net/user_3GObHnwJ1UMUu9vETRNq0YG4Q5L/';
export const IMG = {
  foilA: B + 'hf_20260714_150502_81853556-0749-49e7-b9ce-73d0c3904360.png',   // 금박 스탬핑 매크로
  foilB: B + 'hf_20260714_150502_3ac8f543-8286-4050-a520-6f543f41c7b4.png',
  navyA: B + 'hf_20260714_150458_936db9ad-87f5-4d70-b47f-3e7852e9e521.png',   // 네이비 싸바리 기프트박스
  navyB: B + 'hf_20260714_150458_9a74772e-e25c-4a89-b77c-226ac90308f1.png',
  ginA:  B + 'hf_20260714_151252_bd1d11a5-3749-4cfe-ae82-a41d34e76e47.png',   // 홍삼 세트 + 트레이 내지
  ginB:  B + 'hf_20260714_151252_5a641140-3894-43e4-9c32-871b1e9034d7.png',
  pressA:B + 'hf_20260714_151255_6e613bae-941f-4791-bc61-e7bd631edb62.png',   // 인쇄기(공정)
  pressB:B + 'hf_20260714_151255_24fd98d8-e690-4aef-9a3b-bd9720d64adb.png',
  bagsA: B + 'hf_20260714_151940_ad790e3f-deb4-4854-ab27-8f1bf71cd46b.png',   // 리본 쇼핑백
  bagsB: B + 'hf_20260714_151940_aa0802a8-caf0-4fde-a17b-c5db6cc9a45c.png',
  cosA:  B + 'hf_20260714_202831_f6ba7464-cbe6-4542-8bda-a19e64361f12.png',   // 화장품 단상자(미니멀)
  cosB:  B + 'hf_20260714_202831_1a7b53c8-7d07-4f72-885a-08ef2d363136.png',
  magA:  B + 'hf_20260714_203149_b26af749-afcc-4d8f-a0b6-75c3cfa90139.png',   // 자석박스 개봉(언박싱)
  embA:  B + 'hf_20260714_203156_00d77cc7-d8bb-4c6a-83ca-75867ee131d9.png',   // 형압(엠보/디보스) 매크로
};
export const FOOTER = [
  '',
  '📍 동성특수인쇄',
  '· 위치(네이버 지도): https://naver.me/xk1Oro3N',
  '· 전화: 02-2272-5771 · 휴대폰: 010-2793-3837',
].join('\n');
/** 이미지 마크다운 한 줄 */
export const im = (url, alt) => `![${alt || ''}](${url})`;
