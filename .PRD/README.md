# Wikimate — 디자인 문서

> Show Me The PRD로 생성 (2026-06-07) · **버전: v2**
> **Wikimate (위키메이트)**: AI 에이전트(Claude Code·Codex·Gemini)에게 명령하면 흩어진 자료를 옵시디언(장기 기억)에 정리하고 노션(색인·로그)에 색인하는 **멀티 에이전트 도구**. 핵심은 **이식 가능한 MCP 코어**, Claude Code에선 **마켓플레이스 플러그인**으로 제공.

## 현재 구현 상태 (2026-08-04 갱신 · main=병합 완료, 도구 8개) — ★ 아래 PRD 본문보다 이게 최신
> 본문 PRD는 *원래 계획*(v2, 2026-06-07)이고 실제 구현은 더 린하게 진행됐어요. **작업 시 코드가 진실원본.**
- ✅ **main 빌드됨, 도구 8개**: 무의존 MCP 코어 — `wikimate_collect`·`wikimate_lint`·`wikimate_fix`·`wikimate_runlog`·`wikimate_vaults`·`wikimate_link`·`wikimate_classify`·`wikimate_summarize`. 자동 연결 SessionStart hook + 검수 서브에이전트(`wikimate-reviewer`, 보고전용, summarize 결과도 검사) + 스킬 6(organize·query·lint·link·classify·summarize)·Codex 어댑터. `collect`엔 **원문 보존 advisory**(저신뢰·대용량 경고, 비차단) 포함.
- ✅ **`feat/v0.8-connect` → main 병합 완료(2026-08-03)**: 병합 전 사람 확인 2건(B1: SessionStart hook 실제 로드, B2: 옵시디언 그래프뷰 백링크 반영) **둘 다 통과 확인됨**(실제 재시작 화면·그래프뷰 스크린샷으로 검증).
- ✅ **M3(요약·원자노트) 구현·병합 완료(2026-08-04)**: `wikimate_summarize` 추가 — link/classify와 동일 안전 패턴(dry-run·백업·충돌 시 접미), 도구 자체는 요약 문장을 생성하지 않음(호출자 LLM이 판단). 유닛테스트 20/20 + 실볼트 e2e 8/8 + 전체 회귀 126/126 전부 PASS. Phase 2가 사실상 완료됐고, 남은 건 Codex 어댑터 재검증뿐.
- 🟡 Python 추출은 아직 미구현. **Gemini 어댑터는 추가됨(2026-08-20)** — 등록 명령(`gemini mcp add/list/remove`) 실측 확인, 실제 도구 호출·자연어 트리거는 라이브 미검증.
- 🟡 **옵시디언 쓰기 기본 = 검증된 filesystem(`vault_path`)**; notesmd-cli(이름) 경로는 ⚠️미검증 옵션.
- 🟡 **노션 색인 = 코어 밖**(스킬 + 외부 노션 MCP/CLI 연결 시에만). 구조적 한계로 "신뢰성"보다 **정직성**(한계 고지·삽입 전 best-effort 중복확인). 라이브 미검증.
- ✅ **`notion_id` 왕복 연결 고리 완성(2026-08-17)**: `01_PRD.md` §5 성공기준 중 유일하게 미충족이던 항목("노트↔노션 색인행이 notion_id로 연결돼 점프") — 실제 grep으로 확인한 결과 코드 어디에도 notion_id를 쓰는 곳이 없어(항상 빈 문자열) "노션 행→옵시디언"(Obsidian Link) 한쪽만 되고 반대방향은 애초에 불가능했던 것을 발견. `wikimate_link`에 `action=set_notion_id` 추가(기존 백업·dry-run·존재검증 패턴 재사용, 새 유닛테스트 10개 PASS) + `wikimate-organize` 스킬에 "노션 행 생성 후 되쓰기" 단계 편입으로 종결.

## 한눈에 보는 구조

```
옵시디언 = 장기 기억 (원본 .md, 단일 진실원본)   ← obsidian CLI / 파일시스템
노션     = 운영판/색인 (Research Library + Run Log) ← ntn CLI / Notion MCP
에이전트 = 실행 직원 (Claude Code 풀 → Codex 어댑터 → Gemini)
MCP 코어 = 정리 로직 1개를 모든 에이전트가 공유 (모델 비종속의 핵심)
래퍼     = Claude Code 플러그인(자동 트리거 skills + 자동 연결 hook + 서브에이전트)
안전     = 분석 → 보고 → 사람 승인 → 실행  (자동 트리거여도 쓰기는 승인)
```

## 멀티 에이전트 호환 매트릭스
| 기능 | Claude Code | Codex | Gemini |
|---|---|---|---|
| 설치 | 마켓플레이스 플러그인(풀) | 어댑터 | 어댑터(2026-08-20 추가, 라이브 미검증) |
| MCP 코어 | ✅ | ✅ | ✅ |
| 자동 트리거 skills | ✅ | ⚠️ 규칙으로 유사 | ⚠️ |
| 서브에이전트 | ✅ | 제한적 | 제한적 |
| 자동 연결 hook | ✅ | 스크립트 | 스크립트 |

## 문서 구성

| 문서 | 내용 | 언제 읽나 |
|------|------|----------|
| [01_PRD.md](./01_PRD.md) | 뭘 만드는지·제품 형태·호환 매트릭스·기능 | 시작 전 |
| [02_DATA_MODEL.md](./02_DATA_MODEL.md) | 폴더·frontmatter·노션 DB·연결 고리 | 구조 설계 |
| [03_PHASES.md](./03_PHASES.md) | Phase -1 손시뮬 → 1a(MCP코어)→1b→2→3 | 개발 순서 |
| [04_PROJECT_SPEC.md](./04_PROJECT_SPEC.md) | 기술 스택·배포·플러그인 구조·**절대 하지 마** | 에이전트에 명령할 때마다 |

## 다음 단계 (2026-08-20 확정 — 아래가 최신, 밑의 "2026-08-18" 절은 참고용 이력)

> Phase 3(`03_PHASES.md`) 착수. 이번 세션에서 안전 게이트 5원칙 전체 교차 감사·동시성/원자적쓰기 수정·notesmd-cli 경로 최초 테스트 등으로 Phase 3의 전제조건("Phase 1~2 안정 + 손시뮬+보안 검증 통과")을 실질적으로 충족한 뒤 진행함.

- ✅ **배포물 보안 자동 점검 추가**(`03_PHASES.md` Phase 3 명시 항목) — `scripts/security-scan.mjs`(실제 토큰 형식만 매칭, 오탐 최소화) + opt-in pre-commit 훅(`.githooks/pre-commit`, `git config core.hooksPath .githooks`). 실측: 가짜 API 키를 심은 실제 `git commit`이 진짜로 차단되는 것, 정상 커밋은 통과하는 것 둘 다 확인. 커밋 후 자체 재검토로 "스킵된 파일을 조용히 '깨끗함'으로 셈"하는 결함을 하나 더 발견해 즉시 후속 수정.
- ✅ **Gemini CLI 어댑터 추가** — `GEMINI.md`(→ `AGENTS.md`를 가리키는 얇은 파일, 내용 중복로 인한 문서 어긋남 방지) + `adapters/gemini/SETUP.md`. 이 컴퓨터에 실제 설치된 Gemini CLI(0.52.0)로 `gemini mcp add/list/remove` 등록·조회·제거를 직접 실행해 정확한 문법을 확인(추측 아님). "워크스페이스 미신뢰 시 MCP 서버 자동 비활성화" 같은 실제 관찰 사실도 문서에 반영.
- **경계 명확화(Codex와 동일 원칙)**: 등록 명령 문법은 검증됨. **실제 자연어 트리거·Gemini가 wikimate 도구를 정말 호출하는지는 Gemini API 실호출(사용자 계정/쿼터)이 필요해 AI가 대행하지 않음** — 사용자 확인 대기.
- ✅ **[같은 날 후속] 마켓플레이스 등록 항목의 "추가 조치 불명확" 해소**: `.claude-plugin/plugin.json`·`marketplace.json`을 직접 열람한 결과 구조는 이미 정상(`v0.8.0` 태그+GitHub Release 실재, README 설치 안내도 이미 검증된 명령으로 문서화됨)임에도, `marketplace.json`의 `description`과 `README.md`(ko/en) 두 곳이 스스로 "Phase 3 등록 전 — 미검증 배포 금지"/"🔴 아직"으로 표기 중이던 자기모순 발견 — 정작 그 전제조건(Phase 3 "손시뮬+보안 검증 통과")은 바로 위 항목(배포물 보안 자동 점검)에서 이미 충족됨. 4곳(`marketplace.json` description, `README.md`/`README.en.md`의 "앞으로 남은 것" 절·상태표 각 1곳)을 "구조·보안검증 완료, 실사용자 신규설치 라이브 검증만 대기"로 정정. **과장 금지**: "등록 완료"라고 새로 주장하지 않음 — 신규 사용자의 실제 설치 라이브 검증은 Codex·Gemini·노션과 동일하게 사람 몫으로 명시. 문서·메타데이터만 변경, `npm run verify` 영향 없음.
- **Phase 3 남은 항목**: 마켓플레이스 신규설치 라이브 검증(사람 몫, 위와 동일 경계), `plugin.json`/`package.json` 버전 태그 갱신 여부(공개 행동이라 별도 확인 필요, 이번 작업 범위 밖), 노션 운영판 확장(PRD 원문이 스스로 "선택·목적 이탈 경계"로 명시 — 진행 비추천).
- ✅ **[같은 날 후속(2)] "배포물 보안 자동 검사"를 진짜 자동으로 전환 — `.github/workflows/ci.yml` 신설**: 기존 보안 스캔이 로컬 opt-in 훅뿐이라 새 클론 사용자에겐 자동이 아니었던 것, 그리고 "`npm run verify` 160/160"이라는 반복 기록이 실은 이 컴퓨터에만 있는 `sandbox-vault/`에 암묵 의존해 **완전 새 클론 상태에서 한 번도 실측된 적 없었다**는 것 둘 다 발견. 직접 `sandbox-vault/`를 안전하게 치워두고 빈 상태로 `npm run verify` 재실행 → 160/160 PASS 확인(복구 후 해시 100% 일치, 데이터 손실 없음) — 다행히 문제는 없었으나 이를 앞으로도 계속 보장하려면 사람이 아니라 CI가 지켜야 한다고 판단. `main` push·PR마다 `npm run verify`+`security-scan.mjs --all`을 자동 실행하는 워크플로 추가. 코드 변경 0, 시크릿 불필요, 로컬 사전 재현으로 전 단계 통과 확인. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(3)" 참고.
- ✅ **[같은 날 후속(3)] CI에 프로토콜(서버경유) 계층 테스트 편입**: 방금 만든 CI가 `mcp/lib/*.mjs` 함수를 직접 호출하는 `npm run verify`(160개)만 돌고, 실제 MCP 서버를 stdio로 띄워 JSON-RPC 프로토콜로 8개 도구를 전부 호출하는 `scripts/smoke-tools.mjs`(13개)는 빠져 있던 사각지대 발견 — 서버 배선 계층에서만 나던 과거 실측 결함 사례(인자 이름 변환 등)가 있어 라이브러리 함수 검증만으론 못 잡는 영역. `smoke-tools.mjs` 실행 전후 `sandbox-vault/` 전체 해시 대조로 안전성 직접 확인(완전히 격리된 임시 볼트만 사용, 미접촉) 후 CI에 편입. 코드 변경 0, 새 의존성 없음. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(4)" 참고.
- ✅ **[같은 날 후속(4), 마무리] `DEVELOPMENT.md`에 CI 존재 자체를 반영**: "개발·검증·배포용" 기준 문서인 `DEVELOPMENT.md`에 "GitHub Actions"·"CI" 단어가 전혀 없던 것 발견 — 코드/설정은 바뀌었는데 설명 문서가 그 사실을 모르던, 이번 세션에서 반복된 것과 같은 유형의 결함. "CI(자동 검증)" 절 신규 추가로 보강. 문서만 변경, `npm run verify` 160/160·`security-scan.mjs --all` 72개 통과 재확인. **이 항목을 끝으로 PRD 명시 항목 중 AI가 단독 실행 가능한 작업은 사실상 소진** — 남는 건 전부 사람 계정 필요 라이브 검증 또는 사람 승인 필요 공개 행동뿐. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(5)" 참고.
- ✅ **[같은 날 후속(5)] `npm audit` 5→0건 처리(사용자 승인) + `v0.9.0` 릴리즈(사용자 승인)**: 사람 승인 필요 항목 2개 중 첫 번째(`npm audit`)는 사용자 확인 후 devDependency 전이 의존성만 안전 패치해 처리. 두 번째(버전/태그)는 v0.8.0 이후 28개 커밋이 릴리즈 없이 쌓여 있던 것을 근거로 마이너 버전(`0.9.0`) 승격을 제안·승인받아 6개 파일 동기화 후 태그·GitHub Release까지 완료. Gemini/Codex/노션 라이브 검증 상태는 과장 없이 그대로 고지. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(6)(7)" 참고. **이로써 이번 세션에서 AI 단독 또는 승인 받아 실행 가능했던 PRD 범위 작업은 전부 종료** — 남는 건 순수 사람 전담 라이브 검증(노션·Codex·Gemini·마켓플레이스 신규설치) 4건뿐.

## 다음 단계 (2026-08-18 확정 — 참고용 이력, 위 2026-08-20 절이 최신)

> 🔴 아래 "2026-08-03" 절의 3번("Codex 어댑터 재검증이 실질적으로 남은 유일한 항목")은 **두 가지로 틀렸던 것으로 확인됨**: ①실제로는 `notion_id` 왕복 연결 미구현·`wikimate-link`의 MOC 자연어 트리거 배선 누락이라는, 당시 몰랐던 AI 작업 두 건이 더 있었음(둘 다 발견·수정 완료). ②Codex 라이브 검증은 이후 **사용자가 "구현 완료 후 내가 직접 별도로 포팅하겠다"고 확정**해 더 이상 AI의 "다음 단계" 후보가 아님. 과거 기록은 지우지 않고 이 절로 덮어 갱신함(일관성 규칙).

- ✅ **v0.8.0 릴리즈 완료**(2026-08-18): link/classify/summarize 3개 도구 + `set_notion_id`(notion_id 왕복 연결, PRD §5 성공기준 마지막 미충족 항목 해결) + MOC 자연어 트리거 수정 + `/wikimate-summarize` 슬래시 명령 모두 반영. `npm run verify` 126→155. GitHub Release: https://github.com/sodam-ai/SoDam-WikiMate/releases/tag/v0.8.0
- **AI가 할 수 있는 코드/문서 작업은 이 시점 기준 남은 게 없음** — PRD §3 기능표 10개 중 유일하게 안 된 건 ⑧마켓플레이스 배포(P3, "검증 후" 명시 게이트, 의도적 보류).
- **남은 항목 2개, 둘 다 AI 단독 진행 불가**:
  1. **노션 라이브 검증** — 사용자의 실제 노션 계정 연결이 필요(AI 대행 불가). 코드·로직은 완성(notion_id 양방향 포함).
  2. **`npm audit` devDependency 6건 처리 여부** — 실사용 경로 무영향 확인됨(개발용 SDK 전이 의존성뿐), 급하지 않음. 의존성 변경이라 사용자 승인 필요.
- **Codex 라이브 검증/포팅은 AI 다음 단계 목록에서 제외** — 사용자가 구현 완료 후 직접 별도 진행(2026-08-18 확정). 이후 세션에서 다시 "AI가 할 일"로 제안하지 말 것.

## 다음 단계 (2026-08-03 갱신 — 참고용 이력, 위 2026-08-18 절이 최신)

> ⚠️ 아래 "Phase -1부터 시작" 안내는 **낡은 정보**입니다(Phase 1a~2 대부분 이미 구현·검증됨, 위 "현재 구현 상태" 참고). 실제 다음 단계는 다음과 같습니다.

1. ~~사람 확인 2건~~ ✅ **완료**(2026-08-03) — `feat/v0.8-connect` main 병합 완료.
2. ~~요약·원자노트(M3) 구현~~ ✅ **완료**(2026-08-04) — `wikimate_summarize` main 병합 완료.
3. **다음**: PRD 기능표(01_PRD.md §3) 기준 남은 건 ⑧ 마켓플레이스 배포(P3, "검증 후"로 게이트) 뿐이며, 아직 미착수인 Codex 어댑터 재검증(v0.8 신규 도구 3개가 Codex에서도 동일 동작하는지)이 실질적으로 남은 유일한 항목.
4. (참고, 낡았지만 완전히 무의미하진 않음) 아직 Phase -1 손 시뮬레이션을 직접 해본 적 없다면 [03_PHASES.md](./03_PHASES.md) 참고. 단, 이미 자료 다수가 실제로 정리·검증된 상태라 필수는 아님.

## 핵심 설계 결정 (v2)

- **MCP 코어 1개 + 에이전트별 래퍼** — "플러그인 하나로 전부"는 불가(포맷이 도구마다 다름) → MCP 공통분모로 해결.
- **지정 도구 활용** — 옵시디언 [notesmd-cli](https://github.com/Yakitrak/notesmd-cli)(헤드리스·앱 불필요)/[mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian), 노션 [notion-mcp-server](https://github.com/makenotion/notion-mcp-server)(공식·npx)/[`ntn` CLI](https://developers.notion.com/cli/get-started/overview). 설치 자동 감지. ⚠️ **Win 네이티브는 노션=npx MCP/remote 우선**(ntn은 `curl\|bash`라 Git Bash/WSL 필요).
- **옵시디언=원본, 노션=단방향 색인** (양방향 X).
- **"자동"의 정의** — 자동 트리거+자동 연결 O, 쓰기·비가역은 승인 게이트.
- **마켓플레이스 등록은 검증 후** (미검증 배포 금지).
- **목적 보존선** — 콘텐츠 "생산"은 범위 밖. 이 도구는 "정리"에 집중.

## 참고 도구·출처 (회원님 지정)

| 도구 | 역할 | 비고 |
|---|---|---|
| [Yakitrak/notesmd-cli](https://github.com/Yakitrak/notesmd-cli) | 옵시디언 CLI | Go·MIT·Scoop·**헤드리스(앱 불필요)** |
| [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) | 옵시디언 MCP | Python·**앱+Local REST API 플러그인 필요** |
| [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | 노션 MCP(공식) | TS·npx·⚠️ 향후 sunset 가능 |
| [Notion `ntn` CLI](https://developers.notion.com/cli/get-started/overview) | 노션 CLI(공식) | `curl\|bash`·⚠️ Win은 Git Bash/WSL |

> 상세 분석(신뢰도·Win11·보안·충돌·판정)은 [04_PROJECT_SPEC.md](./04_PROJECT_SPEC.md) §9.

## 미결 사항 (NEEDS CLARIFICATION) 종합

> 정하지 않아도 추천 기본값으로 진행 가능.

**아키텍처/배포**
- [ ] MCP 코어 언어 — Node/TS(추천) vs Python
- [ ] 옵시디언 접근 — notesmd-cli(추천·헤드리스) vs mcp-obsidian(앱 필요) vs 파일시스템
- [ ] 노션 접근(Win) — npx notion-mcp-server/remote MCP(추천) vs `ntn`(Git Bash/WSL 필요)
- [ ] 배포 저장소·라이선스·공개 범위 (sodam-ai 마켓플레이스?)
- [ ] 1차 검증 에이전트 — Claude Code(추천) vs Codex

**데이터/운영**
- [x] 원본 파일 보관 — **결정: 링크/경로만 저장(바이너리 복사 안 함), 대신 text에는 원문 전체를 반드시 저장**(요약 금지, 상세는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided))
- [ ] 백업 방식 — git 커밋(추천) vs 폴더 복사
- [ ] dry-run 기본값 여부 (기본 dry-run 추천)
- [ ] 신뢰도 자동 판정 / 태그 체계
