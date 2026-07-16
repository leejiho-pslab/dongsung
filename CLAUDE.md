# CLAUDE.md — dongsung (클라이언트 인스턴스)

> 이 저장소는 **동성특수인쇄**(프리미엄 패키지·특수인쇄)의 SNS를 무인 운영하는 **라이브 인스턴스**다.
> 배포: GitHub Pages → https://leejiho-pslab.github.io/dongsung/

## 운영 방식(how)의 단일 출처 = pslab 스킬
이 시스템의 **작동 원리·렌더 규칙·발행·대시보드·함정·결정 이력**은 여기 복제하지 않는다.
전부 **`pslab` 저장소의 `sns채널-자동화` 스킬**이 단일 출처다:
- 문서 지도(개념 인덱스): `pslab/CLAUDE.md`
- how 문서: `pslab/.claude/skills/sns채널-자동화/docs/`
- 결정 이력(why): `pslab/.claude/skills/sns채널-자동화/adr/`

## 이 저장소가 보유(클라이언트 특화만)
- **설정**: `clients/dongsung.json` — 계정 핸들·링크·발행시각 등 **브랜드 식별자의 단일 출처**.
- **데이터**: `data/clients/dongsung/*` — plan·design·brand-brief·channel-guides·keyword-trends·week-plan 등.
- **감도 스펙**: `data/clients/dongsung/ig-design-spec.md` — 동성 브랜드 톤·팔레트·아트디렉션.
- **콘텐츠 시드(동성 원고/장표)**: `scripts/blog-google.mjs`·`blog-naver.mjs`·`blog-img.mjs`·`seed-*.mjs` — 실제 게시 콘텐츠(엔진 아님).
- **시크릿**: GitHub Secrets(토큰). 코드에 넣지 않는다.

## 규약 (파편화 금지)
- **엔진 변경 금지 원칙**: 렌더러·코어 등 **범용 엔진**을 고칠 일이 생기면 pslab 레퍼런스와 **동기화**한다
  (한쪽만 고쳐 갈라지지 않게). 이 repo에서만 쓰는 건 **클라이언트 특화 자산**뿐이어야 한다.
- **브랜드 식별자 하드코딩 금지** — 핸들·연락처 등은 `clients/dongsung.json`을 단일 출처로.
- 자세한 작업 규약은 `pslab/CLAUDE.md`의 최상위 규약을 따른다.
