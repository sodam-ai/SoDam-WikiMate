# Wikimate — 디자인 문서

> Show Me The PRD로 생성 (2026-06-07) · **버전: v2**
> **Wikimate (위키메이트)**: AI 에이전트(Claude Code·Codex·Gemini)에게 명령하면 흩어진 자료를 옵시디언(장기 기억)에 정리하고 노션(색인·로그)에 색인하는 **멀티 에이전트 도구**. 핵심은 **이식 가능한 MCP 코어**, Claude Code에선 **마켓플레이스 플러그인**으로 제공.

## 현재 구현 상태 (2026-08-04 갱신 · main=병합 완료, 도구 8개) — ★ 아래 PRD 본문보다 이게 최신
> 본문 PRD는 *원래 계획*(v2, 2026-06-07)이고 실제 구현은 더 린하게 진행됐어요. **작업 시 코드가 진실원본.**
> 🔴 **2026-09-01 정정**: 이 절 제목의 "2026-08-04 갱신"은 낡은 표기예요(바로 아래 불릿과 별개로, 이 문서 자체엔 이미 2026-08-21까지의 기록이 쌓여 있었음 — 제목과 본문이 17일 어긋나 있던 걸 이번에 발견). **가장 최신 상태는 이 문서 맨 아래 "2026-09-01" 절부터 읽으세요.**
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
- ✅ **[같은 날 후속(5)] `npm audit` 5→0건 처리(사용자 승인) + `v0.9.0` 릴리즈(사용자 승인)**: 사람 승인 필요 항목 2개 중 첫 번째(`npm audit`)는 사용자 확인 후 devDependency 전이 의존성만 안전 패치해 처리. 두 번째(버전/태그)는 v0.8.0 이후 28개 커밋이 릴리즈 없이 쌓여 있던 것을 근거로 마이너 버전(`0.9.0`) 승격을 제안·승인받아 6개 파일 동기화 후 태그·GitHub Release까지 완료. Gemini/Codex/노션 라이브 검증 상태는 과장 없이 그대로 고지. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(6)(7)" 참고.
- ✅ **[같은 날 후속(6)] `02_DATA_MODEL.md` 필드 완전성 감사 — `Note.status`·`Note.project` 배선 누락 발견·수정**: 이번엔 문서 낡음이 아니라 "PRD가 정의한 데이터 필드를 실제 코드가 전부 구현했는지" 관점으로 전수 grep 감사를 진행 — `status`(진행상태)·`project`(관련 프로젝트) 필드가 노트 생성 시 한 번만 써지고 이후 어떤 도구도 못 바꾸는 화석 필드였음을 발견(`notion_id`·`NOTION_RUNLOG_DB_ID` 미배선과 같은 계열의 결함). `classify.mjs apply`에 기존 folder/tags/importance와 동일한 안전 패턴으로 편입(자동 전환 로직은 만들지 않고 명시 요청 시에만 변경). `npm run verify` 160→171, `smoke-tools.mjs` 13→14. `Link.reason` 필드는 저장 구조상 별도 설계 결정이 필요해 이번 범위에서 의도적으로 제외(다음 후보로 기록). 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(8)" 참고.
- ✅ **[같은 날 후속(7)] `04_PROJECT_SPEC.md` "절대 하지 마" 규칙 감사 — 수집 원문 시크릿 무경고 저장 발견·수정**: "API 키·비밀번호를 볼트·노트에 저장하지 마" 규칙이 배포물(`security-scan.mjs`) 쪽만 지켜지고, 실제 사용자 볼트·노트 쪽은 전혀 안 지켜지고 있었음 — `wikimate_collect`가 수집 원문을 시크릿 검사 없이 그대로 저장했음. `security-scan.mjs`의 패턴을 `mcp/lib/shared.mjs`로 공용화해 `collect.mjs`가 재사용, dry-run 시 advisory로 미리 경고(원문은 수정 안 함, 차단 아님, 매칭값 미노출). `npm run verify` 171→174. 상세 근거는 `CHECKPOINT.md` "2026-08-20 갱신(9)" 참고.
- **이로써 이번 세션에서 AI 단독 또는 승인 받아 실행 가능했던 PRD 범위 작업은 전부 종료** — 남는 건 순수 사람 전담 라이브 검증(노션·Codex·Gemini·마켓플레이스 신규설치) 4건과, 별도 설계 결정이 필요한 `Link.reason` 저장 방식뿐.

## 2026-08-21 — 전체 기능 재검증 중 실결함 발견·수정
사용자 요청으로 지금까지 구현된 전체 기능을 정상/예외/경계값/실패 상황 기준으로 재검증하다가, `classify.mjs`의 `project`(백슬래시 포함 값)를 경계값 테스트하는 과정에서 **`stripQuotes` 함수의 이스케이프 미해제 결함**을 발견했습니다 — `classify.mjs`/`summarize.mjs`/`link.mjs` 세 곳에 각자 따로 있던 이 함수가 JSON 이스케이프(`\\`, `\"`)를 안 풀어서, 값에 백슬래시·따옴표가 있으면 재조회 시 원래 값과 달라지고 `project`/`summary`의 멱등성 검사(재요청 시 changed:false)가 실제로 깨져 있었습니다. `shared.mjs`에 하나로 통합해 수정했습니다. 상세 근거·재검증 결과는 `CHECKPOINT.md` "2026-08-21 갱신" 참고.

## 2026-08-21 — "다음 Phase" 재감사: 노션 Run Log 스킬 배선을 나머지 4개 스킬로 확장
Phase -1~3이 전부 정의된 범위이고 그 안의 AI 실행 가능 항목도 위 목록으로 소진된 상태에서, 남아있는 유일한 미완료 갭을 마저 처리했습니다. 2026-08-19에 `wikimate-organize` 스킬 하나에만 "노션 Run Log 기록" 지시를 넣고 "나머지 스킬 확장은 다음 단계로 보류"라고 스스로 적어둔 것을, 6개 스킬 파일 전수 검색으로 재확인(다른 5곳 0건)한 뒤 `wikimate-link`·`wikimate-classify`·`wikimate-summarize`·`wikimate-lint`(→`wikimate_fix` 경유) 4곳에 동일 패턴으로 확장했습니다(`wikimate-query`는 읽기전용이라 대상에서 제외 — 확인 후 제외, 누락 아님). 코드 변경 0(스킬 프롬프트 문서만), `npm run verify` 180/180 그대로, `security-scan.mjs --all` 72개 통과. **이로써 `Link.reason`(별도 설계 결정 필요) 1건을 제외하면, PRD가 정의했는데 아직 코드/스킬로 안 지켜지던 갭은 모두 해소됨.** 상세 근거는 `CHECKPOINT.md` "2026-08-21 갱신(2)" 참고.

## 2026-08-21 — 전체 기능 재검증(2회차)에서 실결함 2건 발견·수정
아직 실측 안 된 경계값 위주로 다시 탐색하다가, **2026-07-11 M2 구현 때부터 계속 살아있던 결함 2건**을 발견했습니다. ① `build_moc`이 MOC 목차 노트를 갱신할 때 쓰던 정규식에 조기 종료 결함이 있어, 같은 멤버를 재요청할 때마다(멱등성이 깨져) 조용히 중복이 계속 쌓이고 있었습니다(실제 픽스처에서 같은 항목이 10번 중복된 걸 발견). 정규식을 헤딩 위치와 섹션 끝 경계를 정확히 계산하는 방식으로 고쳤습니다. ② `wikimate_fix`의 "링크 치환"(`replace_link`) 기능이 존재하지 않는 노트 이름으로도 아무 거부 없이 링크를 만들 수 있었습니다 — 다른 링크 기능들(`add_links`/`build_moc`)은 이미 "실제 있는 노트로만 연결"을 강제하는데 이 기능만 빠져 있었던 것으로, 이 프로젝트의 핵심 안전 원칙("깨진 링크 생성 금지")과 어긋나 있었습니다. 같은 검증을 추가해 막았습니다. 둘 다 재현→원인분석→최소 수정→회귀 테스트 추가(11개) 순서로 처리했고, `npm run verify`는 180→191로 늘어난 채 전부 통과합니다(이 항목 최초 기록 시 189로 계산 실수했던 것을 직접 재실행으로 재확인해 191로 정정). 상세 근거는 `CHECKPOINT.md` "2026-08-21 갱신(3)(4)" 참고.

## 2026-08-21 — README 4종(ko/en × md/html) 전면 갱신
완전 초보자도 이해할 수 있는 종합 사용설명서를 한국어/영어·md/html 4개 파일 모두 동일한 내용으로 작성해달라는 요청을 받아, 기존 README.md/README.en.md(이미 21개 섹션 구조로 이 요구사항을 충족하고 있었음을 확인)의 낡은 날짜·버전·수치를 전수 대조해 정정했습니다. 상단 배너·설치 안내가 여전히 "2026-08-04·버전 0.7.2·126개 테스트"로 남아있던 걸 발견해 실제 상태(v0.9.0·191개 테스트)로 갱신하고, 2026-08-20~21 사이 작업(보안 자동 점검·CI·Gemini 어댑터·status/project 필드·노션 Run Log 배선·실결함 3건 수정) 전체를 업데이트 요약과 현재 상태 표에 반영했습니다. HTML 2개는 손으로 고치지 않고 `pandoc`으로 최신 md에서 새로 생성해, 4개 파일 간 내용 불일치 가능성을 원천 차단했습니다(생성된 목차 링크가 기존 앵커와 정확히 일치함을 확인). 라이선스 절은 이미 Apache-2.0 조건·외부 도구별 개별 라이선스·데이터 저작권 귀속까지 엄격하게 갖춰져 있어 내용 변경 없이 재확인만 했습니다. 상세 근거는 `CHECKPOINT.md` "2026-08-21 갱신(6)" 참고.

## 2026-08-31 — `Link.reason` 구현 + 분류 자연어 트리거 실제 보강 + 노션 안전규칙 2건 문서화
10일간 정지 상태였던 프로젝트를 재개하며 `04_PROJECT_SPEC.md` §4 "절대 하지 마" 13개 항목을 코드·스킬과 전수 재대조하다가, 10여 회 감사에서 한 번도 안 잡힌 새 결함 2건(노션 권한 스코프·rate-limit 안내가 코드·문서 어디에도 0건)을 발견해 `AGENTS.md`·`wikimate-organize` 스킬에 반영했습니다. 이어서 2026-08-21에 "설계 결정 필요"로 보류해뒀던 `Link.reason`("왜 연결했는지")을 사용자 확인을 거쳐 **노트 본문 "## 왜 연결했는지" 섹션에 병행 기록**하는 방식으로 구현했습니다(frontmatter `related:` 파서가 한 줄 배열만 읽는 제약 때문에 구조 변경 대신 무위험·하위호환 방식 채택, 근거는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided)). 같은 세션에서 2026-08-21에 발견됐던 `wikimate-classify`의 "완료 표시" 자연어 트리거 배선 누락도 실제로 고쳤습니다. `npm run verify` 191→**206**(신규 회귀 15개), `security-scan.mjs --all` 72개 통과. **`Link.kind`(연결 종류 구분)는 여전히 미구현·설계 검토 중**입니다. 상세 근거는 `CHECKPOINT.md` "2026-08-31 갱신" 참고.

## 2026-09-01 — README(ko/en×md/html 4종)·PRD 성공기준 문서 재동기화
"본래 구현 목적(AI가 다시 읽을 수 있는 정확한 문서 DB를 만드는 도구)에서 벗어나지 않는 강력 추천 방향"으로 문서 최신화를 제안·승인받아 진행했습니다. README.md/README.en.md의 테스트 개수(191→206)·날짜를 갱신하고 위 2026-08-31 변경분을 새 토글로 반영(단 "main 커밋·푸시는 아직"이라고 정직하게 고지). `01_PRD.md` §5 성공 기준 8개 중 실제로 충족된 6개를 근거와 함께 체크(사람 계정이 필요한 라이브 검증 2개는 의도적으로 미체크 유지 — 과장 금지). README.html/README.en.html은 2026-08-21에 확립한 방법(pandoc 재생성)으로 다시 만들고 h2·h3·details 개수를 직접 대조해 콘텐츠 손실이 없음을 확인했습니다. 부수적으로 §14 폴더구조의 "e2e 6개" 표기가 실제로는 5개였던 사소한 오기도 함께 발견·정정했습니다. **바로 이 문서(`.PRD/README.md`) 자신도 2026-08-21에서 멈춘 채 최근 변경분을 반영 못 하고 있던 걸 재확인해, 지금 이 절로 갱신합니다** — 같은 "문서가 코드보다 먼저 낡는" 패턴이 이번엔 PRD 요약 문서 자체에서 재현된 사례입니다. `npm run verify` 206/206·`security-scan.mjs --all` 72개 통과, 코드 변경 0. **커밋/푸시는 여전히 안 함** — 전체 변경 파일은 `CHECKPOINT.md` "2026-09-01 갱신" 참고.

## 2026-09-01(2) — `Link.kind` 구현: PRD의 마지막 미구현 데이터 필드 종결
`Link.reason`(2026-08-31)에 이어 `02_DATA_MODEL.md`가 정의한 Link 엔티티의 나머지 필드 `kind`(연결 종류: related/reference)를 구현. 저장 방식은 사용자와 상의해 확정 — 별도 섹션을 새로 만들지 않고 `reason`과 같은 "## 왜 연결했는지" 섹션·같은 불릿 줄에 괄호로 병기(`- [[노트]] (kind) — 이유`), 값은 `related`/`reference` 2종으로 코드에서 검증(고정 enum, `classify.mjs`의 `status` 검증과 동일 패턴). `kind`만 지정하고 `reason`은 생략도 가능. `mcp/lib/link.mjs`·`mcp/server.mjs`·`wikimate-link` 스킬·`AGENTS.md`에 반영. `verify-link.mjs` 신규 회귀 9개(74→83), `smoke-tools.mjs` 서버경유 배선 확인 1개(16→18). `npm run verify` 총계 206→**215**, 전부 PASS. 상세 근거는 `CHECKPOINT.md` "2026-09-01(2) 갱신" 참고. **이로써 `02_DATA_MODEL.md`가 정의한 Note/Link 필드 중 AI가 구현 가능한 항목은 전부 소진** — 남은 미결은 신뢰도 자동판정 기준·태그 체계뿐(둘 다 "추천 기본값으로 진행 가능"인 저위험 항목).

## 2026-09-01(4) — `v0.10.0` 릴리즈 + `02_DATA_MODEL.md` 마지막 미결 2건 종결
사용자 질문("마켓플레이스에도 올라가야 하는 거 아니야?")에 답하며 v0.9.0 이후 커밋 12개가 릴리즈 없이 쌓여 있던 것을 발견 → 버전 `0.10.0` 동기화(5개 파일)·태그 push 완료(GitHub Release는 `gh release create`가 전역 정책으로 AI 실행 차단이라 사용자에게 명령 전달). 이어서 `02_DATA_MODEL.md`의 마지막 미결 사항 2건(신뢰도 자동판정 기준·태그 체계)을 코드·스킬 문서와 대조 — 둘 다 이미 PRD 추천값 그대로 구현돼 있었음을 확인해 체크(신뢰도: `wikimate-organize` 스킬 C4 규칙, 태그: `classify.mjs`의 자유 문자열 방식). **이로써 `02_DATA_MODEL.md` "[NEEDS CLARIFICATION]" 절이 완전히 비워짐** — PRD가 정의한 Note/Link 데이터 모델 중 미구현·미결로 남은 항목은 이제 없음.

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
> 🔴 **2026-09-01 정정**: 아래 "아키텍처/배포" 5개 중 4개가 **이미 오래전에 결정·구현까지 끝났는데도 `[ ]`(미결)로 방치돼 있던 것**을 코드와 직접 대조해 발견·정정했습니다(문서가 실제보다 뒤처진 또 다른 사례). 노션 접근 1개만 설계상 의도적으로 열어둔 진짜 미결입니다.

**아키텍처/배포**
- [x] MCP 코어 언어 — **결정·구현됨: Node.js**(단, TS가 아니라 **순수 JavaScript**입니다 — `package.json`에 `"type": "module"`, 타입체크/`tsconfig.json` 없음, 전부 `.mjs`. 애초 후보였던 "Node/TS" 중 TS 부분은 채택 안 됨, 착오 없이 명시)
- [x] 옵시디언 접근 — **결정·구현됨: 파일시스템 직접 방식이 검증된 기본값**. notesmd-cli는 여전히 미검증 선택 옵션, mcp-obsidian은 채택 안 함
- [ ] 노션 접근(Win) — **여전히 열려 있음(의도적)**: 하드코딩된 단일 선택이 아니라 "연결된 노션 도구를 자동 감지해 쓴다"가 설계 그 자체라, 이 항목은 원래도 고정할 필요가 없는 항목입니다(체크 안 하는 게 맞음)
- [x] 배포 저장소·라이선스·공개 범위 — **결정·구현됨: `sodam-ai/SoDam-WikiMate`, Apache-2.0, PUBLIC**. 태그·GitHub Release 실재(현재 v0.9.0)
- [x] 1차 검증 에이전트 — **결정·구현됨: Claude Code**(모든 실사용 라이브 검증이 이걸로 진행됨). Codex는 사람이 구현 완료 후 직접 별도 포팅하기로 확정(2026-08-18)

**데이터/운영**
- [x] 원본 파일 보관 — **결정: 링크/경로만 저장(바이너리 복사 안 함), 대신 text에는 원문 전체를 반드시 저장**(요약 금지, 상세는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided))
- [x] `Link.reason`(왜 연결했는지) — **결정(2026-08-31): 노트 본문 "## 왜 연결했는지" 섹션에 병행 기록**(상세는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided))
- [x] `Link.kind`(연결 종류: related/reference) — **결정·구현됨(2026-09-01): `Link.reason`과 같은 섹션·같은 불릿 줄에 괄호로 병기**(`- [[노트]] (kind) — 이유`), 값은 `related`/`reference` 2종 고정. 상세는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided)
- [x] 백업 방식 — **결정·구현됨: 폴더 복사**(`.wikimate/backups/<타임스탬프>/`에 편집 전 원본을 `backupFile` 함수로 복사. PRD 원문의 추천값이던 "git 커밋"이 아니라 폴더 복사 쪽으로 구현됨 — 2026-09-01 재확인)
- [x] dry-run 기본값 여부 — **결정·구현됨: 기본값 dry-run(모든 쓰기 도구의 `dryRun` 파라미터 기본값 `true`)**. 안전 게이트의 핵심 전제로 처음부터 이렇게 구현돼 있었으나 이 체크박스만 갱신이 안 돼 있었음
- [x] 신뢰도 자동 판정 / 태그 체계 — **결정·구현됨(2026-09-01 재확인)**: 둘 다 PRD 추천값 그대로 이미 구현돼 있었음(신뢰도=자동추정+수동덮어쓰기, `wikimate-organize` 스킬 C4 / 태그=자유문자열, `classify.mjs`). 상세는 [02_DATA_MODEL.md](./02_DATA_MODEL.md#결정됨-decided)
