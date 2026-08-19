# 개발 (Development)

> 사용자용 설치·사용법은 [README.md](./README.md) 참고. 이 문서는 개발·검증·배포용.

## 빌드
**빌드 단계가 없습니다.** MCP 서버(`mcp/server.mjs`)는 **무의존 순수 Node(stdio)** 라 컴파일·번들이 필요 없어요. Node 18+ 만 있으면 바로 실행됩니다.

## 로컬 검증
```bash
npm install        # 검증용 devDependency(@modelcontextprotocol/sdk)만 설치 — 플러그인 실행엔 불필요
npm run verify     # 8개 verify-*.mjs 전체 체인(collect/lint/fix/runlog/vaults/link/classify/summarize), 총 160개 체크
npm start          # MCP 서버(stdio) 실행
```

## 테스트

### 유닛 검증 (`npm run verify`가 순서대로 실행, 격리된 임시 볼트 사용 — 8개)
| 스크립트 | 내용 |
|---|---|
| `scripts/verify-collect.mjs` | 수집 로직(이름 안전화·중복 차단·경로이탈 방지·importance 검증) 검증 |
| `scripts/verify-lint.mjs` | 건강검진(중복·깨진링크·고아·frontmatter) 검증 |
| `scripts/verify-fix.mjs` | 안전 수정(archive 이동·링크치환·백업·경로차단) 검증 |
| `scripts/verify-runlog.mjs` | Run Log 기록·조회 + 백업 dot-dir 스킵 검증 |
| `scripts/verify-vaults.mjs` | 볼트 자동탐지(listVaults: 목록·open 우선·ambiguous·설정없음/깨짐 graceful) 검증 |
| `scripts/verify-link.mjs` | 자동 링크(add_links)·MOC 생성(build_moc)·노션 연결고리(set_notion_id) 검증(경로이탈·특수문자 등 경계값 포함) |
| `scripts/verify-classify.mjs` | 자동 분류(폴더·태그·중요도) 검증 |
| `scripts/verify-summarize.mjs` | 요약·원자노트화(원문 보존 구조적 강제 포함) 검증 |

### 프로토콜 스모크 (실제 MCP 서버를 stdio로 띄워 JSON-RPC 경유 호출)
| 스크립트 | 내용 |
|---|---|
| `scripts/smoke-server.mjs` | 기본 e2e (initialize → tools/list → tools/call, collect) |
| `scripts/smoke-tools.mjs` | 8개 도구 전부 서버 경유 호출·검증(snake_case→camelCase 인자 매핑 포함) |

### 실볼트(sandbox-vault) e2e — 1회성, 실제 픽스처에 실제 적용
| 스크립트 | 내용 |
|---|---|
| `scripts/collect-real.mjs` | 실제 웹 자료 1건을 노트화하는 시연 |
| `scripts/e2e-link-real.mjs` | add_links를 실볼트 기존 클리크에 적용(인젝션 방어·멱등성 포함) |
| `scripts/e2e-classify-real.mjs` | classify를 실볼트 노트에 적용(폴더 이동·기존 related: 보존 확인) |
| `scripts/e2e-moc-real.mjs` | build_moc을 신규/레거시(다른 헤딩) MOC 양쪽에 적용 |
| `scripts/e2e-summarize-real.mjs` | summarize를 실볼트 노트에 적용(dry-run 무변경·원문 보존·원자노트 계보 확인) |
> 이름이 `-real`인 스크립트는 격리 볼트가 아니라 **영구 저장되는 `sandbox-vault/`를 그대로 씀** — 재실행하면 이미 처리된 상태를 다시 만나 일부 단계가 "이미 처리됨"으로 나올 수 있다(정상, 1회성 시연 스크립트라 완전한 재실행 idempotency는 보장하지 않음).

```bash
npm run verify
node scripts/smoke-tools.mjs
node scripts/collect-real.mjs
```
> 개인 볼트 경로가 들어가는 검증 스크립트는 `.gitignore`로 추적 제외(예: `scripts/test-real-vault.mjs`).

## ⚠️ 실볼트(운영) 테스트 금지 — 안전 테스트 원칙
"정리/검색/건강검진" 흐름을 **손으로** 테스트할 때 **사용자의 실제 운영 옵시디언 볼트에서 하지 말 것.** (2026-06-22 실세션 교훈)
- **이유**: 실볼트 테스트는 ① 테스트 노트가 진짜 노트들과 섞이고 ② 옵시디언 휴지통 설정(`trashOption:"system"`)이 테스트 노트를 외부 삭제해 "됐나?" 검증이 흔들리며 ③ 연결된 노션 실DB·끊긴 색인과 엉켜 "테스트"가 "복구"로 변질된다.
- **원칙**:
  1. 코어 로직은 `scripts/verify-*.mjs`(임시 볼트 자동 생성·삭제)로 검증 — 실볼트 안 건드림.
  2. 손 테스트가 꼭 실볼트여야 하면 **버리는 하위폴더(예: `99_Test`)** 에만 만들고 **끝나면 폴더째 삭제**. 진짜 정리 폴더(예: `30_Notes`)엔 넣지 말 것.
  3. **새 내용·새 제목**으로 테스트(기존 노트/노션 행과 `source_hash`가 겹치면 dedup·복구 흐름과 엉킴).
  4. 노션 색인 테스트는 실DB 오염 주의 — 테스트 행은 만든 뒤 **직접 삭제**(커넥터가 못 지움).

## 로컬 폴더로 설치 테스트 (배포 전)
```
/plugin marketplace add <이 폴더의 절대경로>
/plugin install wikimate@wikimate-marketplace
```
세션 한정으로 임시 로드하려면: `claude --plugin-dir <이 폴더의 절대경로>`

## Codex 어댑터
`adapters/codex/SETUP.md` 참고 (`codex mcp add`로 같은 무의존 서버 등록).

## 배포 (GitHub → 마켓플레이스)
1. 변경을 작업 브랜치에 커밋 → push.
2. 기본 브랜치(`main`)에 반영(필요 시 PR → merge). 마켓플레이스 설치는 **기본 브랜치**를 가져옴.
3. 사용자는 `/plugin marketplace update` 후 재설치로 최신을 받음(README의 "업데이트" 참고).
4. 시크릿·개인경로·빌드 산출물이 추적 대상에 없는지 push 전 직접 점검(`git status`·`git ls-files`).

## 보안 점검 체크리스트
- 추적 파일·git 히스토리에 토큰/키/개인경로 없음 (`.env`는 `.gitignore`).
- 입력 text는 데이터로만 저장(인젝션 방어), CLI는 셸 없이 실행(주입 방지).
- 노트 제목/폴더는 경로구분자·금지문자·제어문자 정리 + 볼트 밖 경로 차단.
