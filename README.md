# 동성인쇄소 SNS 자동운영

동성인쇄소(종합 인쇄 · 명함·전단·현수막·스티커)의 SNS를 **무료로 24시간 무인 운영**하는 시스템입니다.
매일 정해진 시각 자동발행 · AI 글 생성 · 한글 카드/블로그 이미지 렌더 · 실시간 대시보드까지 포함합니다.

- **대시보드(관제실)**: https://leejiho-pslab.github.io/dongsung/
- **채널**: 인스타그램 · 스레드 · 구글 블로그(Blogger, 자동) · 네이버 블로그(수동 복붙)
- **발행 시각**: 매일 18:00 (KST), 채널 라운드로빈

## 운영 방식
- GitHub Actions cron이 매일: 토큰 점검 → 예약 발행 → 성과 수집 → 대시보드 갱신 → Pages 배포
- 글은 클로드 AI(키 없으면 규칙기반 폴백), 한글 이미지는 HTML→Chromium 렌더
- 발행 전엔 `PSLAB_DRY_RUN=true`(안전 시뮬레이션), 준비되면 `false`로 실제 발행 ON

## 세팅 요약
1. 채널 토큰 → **Settings → Secrets and variables → Actions** 에 등록
2. `ANTHROPIC_API_KEY`(선택, AI 글 품질↑) + `PSLAB_CLAUDE_MODEL=claude-haiku-4-5`
3. **Settings → Pages → Source = GitHub Actions** (저장소는 public 유지)
4. 준비되면 Variables `PSLAB_DRY_RUN=false`

## 채널 시크릿 이름
- 인스타: `PSLAB_INSTAGRAM_ACCESS_TOKEN`, `PSLAB_INSTAGRAM_IG_USER_ID`
- 스레드: `PSLAB_THREADS_ACCESS_TOKEN`, `PSLAB_THREADS_THREADS_USER_ID`
- 구글블로그: `PSLAB_BLOGGER_CLIENT_ID`, `PSLAB_BLOGGER_CLIENT_SECRET`, `PSLAB_BLOGGER_REFRESH_TOKEN`, `PSLAB_BLOGGER_BLOG_ID`
- 텔레그램 알림: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

---

_레퍼런스 구현 = PSLAB SNS 자동운영 시스템. 이 저장소는 동성인쇄소 전용으로 분리 배포됩니다._
