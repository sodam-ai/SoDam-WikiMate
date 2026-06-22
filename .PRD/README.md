# Wikimate — 디자인 문서

> Show Me The PRD로 생성 (2026-06-07) · **버전: v2**
> **Wikimate (위키메이트)**: AI 에이전트(Claude Code·Codex·Gemini)에게 명령하면 흩어진 자료를 옵시디언(장기 기억)에 정리하고 노션(색인·로그)에 색인하는 **멀티 에이전트 도구**. 핵심은 **이식 가능한 MCP 코어**, Claude Code에선 **마켓플레이스 플러그인**으로 제공.

## 현재 구현 상태 (2026-06-22 · v0.7.0) — ★ 아래 PRD 본문보다 이게 최신
> 본문 PRD는 *원래 계획*(v2, 2026-06-07)이고 실제 구현은 더 린하게 진행됐어요. **작업 시 코드가 진실원본.**
- ✅ **빌드됨**: 무의존 MCP 코어 + 도구 5개 — `wikimate_collect`·`wikimate_lint`·`wikimate_fix`·`wikimate_runlog`·`wikimate_vaults`(볼트 자동탐지·읽기전용). 스킬 3(organize·query·lint)·커맨드 2·Codex 어댑터.
- ❌ **계획했으나 미구현**: SessionStart hook(자동연결)·서브에이전트·별도 "분류" 도구(7폴더 자동분류)·요약/원자노트·자동링크/MOC·Python 추출·Gemini 어댑터.
- 🟡 **옵시디언 쓰기 기본 = 검증된 filesystem(`vault_path`)**; notesmd-cli(이름) 경로는 ⚠️미검증 옵션.
- 🟡 **노션 색인 = 코어 밖**(스킬 + 외부 노션 MCP/CLI 연결 시에만). 구조적 한계로 "신뢰성"보다 **정직성**(한계 고지·삽입 전 best-effort 중복확인). 라이브 미검증.

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
| 설치 | 마켓플레이스 플러그인(풀) | 어댑터 | 어댑터(후순위) |
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

## 다음 단계 (강력 추천 순서)

1. **Phase -1 손 시뮬레이션** — 자료 3개로 `obsidian`/`ntn` CLI를 손으로 써보며 흐름 확인. (코드 0)
2. 통과하면 [03_PHASES.md](./03_PHASES.md)의 **"Phase 1a 시작 프롬프트"** 복사 → Claude Code에 붙여넣기.
3. 명령 시 [04_PROJECT_SPEC.md](./04_PROJECT_SPEC.md)를 항상 함께 공유.

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
- [ ] 원본 파일 보관 — 링크만(추천) vs 볼트 첨부
- [ ] 백업 방식 — git 커밋(추천) vs 폴더 복사
- [ ] dry-run 기본값 여부 (기본 dry-run 추천)
- [ ] 신뢰도 자동 판정 / 태그 체계
