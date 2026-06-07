# Wikimate — 데이터 모델

> 이 문서는 도구가 다루는 핵심 데이터의 구조를 정의합니다.
> 개발자가 아니어도 이해할 수 있는 "개념적 ERD"입니다.
> 출처 영감: 지윤쌤 "AI 작업실 공식 세팅북"(Notion×Obsidian) + 2026 AI-Obsidian MCP 표준.

---

## 핵심 개념

옵시디언은 결국 **폴더 안의 마크다운(.md) 파일 묶음 + `[[링크]]`** 이고, 노션은 **표(DB)** 입니다.
그래서 이 데이터 모델의 90%는 "노트 한 개에 무엇을 적느냐(frontmatter)"와 "노션 표에 어떤 칸을 두느냐"입니다.

- **옵시디언 = 원본/장기 기억** (단일 진실원본, single source of truth)
- **노션 = 단방향 색인 + 안전 로그**

---

## 전체 구조

```
 [Source]  --1:N-->  [Note(.md)]  --N:N--  [Tag]
  원본 자료            옵시디언 원본          태그
                          |  |
                          |  └--1:1--> [NotionResearchRow]   (노션 색인 표 한 줄)
                          |
                          └--N:N(Link 양방향)--> [Note]
                                                   ▲ N
                                                   |
                                              [MOC] 주제별 목차(Note의 특수형)

 [NotionRunLog]  : 작업 1건마다 1줄 (어떤 Note들을 바꿨는지 기록)
 [AGENTS.md]     : 데이터가 아니라 "규칙 파일" (에이전트 행동 기준)
```

---

## 옵시디언 볼트 폴더 구조

```
00_Inbox       아직 정리 안 된 자료 (에이전트 1차 투입구)
10_Projects    진행 중인 작업 관련 노트
20_Resources   오래 쌓아둘 지식 / (선택) _files 첨부 원본
30_Notes       원자 노트 · MOC(목차 노트)
40_Drafts      초안
90_Templates   노트 템플릿(frontmatter 포함)
99_Archive     보관(더 안 쓰는 것)
.obsidian/     옵시디언 설정 — ⛔ 에이전트 수정 금지
```

---

## 엔티티 상세

### Source (원본 자료)
가져온 원래의 것. 웹 링크 하나, PDF 하나, 대화 로그 하나가 각각 Source.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| id | 고유 식별자 (자동) | src-001 | O |
| type | 종류 | `web` / `pdf` / `chatlog` / `code` | O |
| origin | 출처 (URL 또는 파일 경로) | https://… / D:\Docs\a.pdf | O |
| source_hash | **중복 방지 키** (URL·내용 해시) | 9f2a… | O |
| captured_at | 가져온 날짜 (자동) | 2026-06-07 | O |
| status | 처리 상태 | `inbox` / `done` / `skipped` | O |
| raw_ref | 원본 보관 위치(선택) | 20_Resources/_files/a.pdf | X |

### Note (노트, .md) — 옵시디언 원본
정리되어 만들어지는 옵시디언 노트 1개. **사람도 AI도 읽는 frontmatter(머리말)** 를 가진다.

| 필드(frontmatter) | 설명 | 예시 | 필수 |
|------|------|------|------|
| title | 제목 | "MCP 연결 기본 구조" | O |
| type | 노트 종류 | `note` / `moc` | O |
| status | 진행 상태(=읽음 여부 흡수) | `inbox` / `draft` / `done` | O |
| project | 관련 프로젝트 | "AI 작업실" | X |
| source | 원본 출처(URL·경로) | https://… | X |
| summary | 한 줄 요약 | "Codex에 Notion MCP 등록법" | X |
| importance | **중요도(별점 1~5)** | 4 | X |
| tags | 태그 목록 | [codex, notion, mcp] | X |
| related | 관련 노트 링크 | ["[[옵시디언 역할]]"] | X |
| created / updated | 생성/수정일 (자동) | 2026-06-07 | O |
| notion_id | **노션 색인행과 잇는 고리** | 2e10b4… | X |

> 본문(body)은 frontmatter 아래 마크다운 텍스트. 요약·원자 노트는 본문 형태로 저장.

### Tag (태그)
| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| name | 태그 이름 | codex | O |
| count | 사용 횟수(파생) | 12 | X |

### Link (연결) — 노트 간 양방향
| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| from | 출발 노트 | "[[MCP 연결]]" | O |
| to | 도착 노트 | "[[Codex 역할]]" | O |
| reason | 왜 연결했는지(에이전트가 기록) | "둘 다 MCP 설정" | X |
| kind | 종류 | `related` / `reference` | X |

> 옵시디언에서는 본문에 `[[도착노트]]`를 쓰면 자동으로 양방향이 됩니다.

### MOC (목차 노트) — Note의 특수형(type=moc)
한 주제의 노트들을 모아 보여주는 "안내판 노트". AI가 주제 전체를 한 번에 파악하는 입구.

| 필드 | 설명 | 예시 | 필수 |
|------|------|------|------|
| topic | 주제 | "MCP" | O |
| members | 묶인 노트들(자동 수집된 [[링크]] 목록) | ["[[…]]", …] | O |

### NotionResearchRow (노션 색인 표 한 줄) — Research Library DB
옵시디언 노트를 한눈에 보는 표. **옵시디언 → 노션 단방향.**

| 속성 | 설명 | 예시 | 필수 |
|------|------|------|------|
| Title | 제목 | "MCP 연결 기본 구조" | O |
| Summary | 요약 | "Codex에 Notion MCP 등록법" | O |
| Source URL | 원본 출처 | https://… | X |
| Reliability | 신뢰도 | High/Med/Low | X |
| Importance | 중요도(별점) | ⭐⭐⭐⭐ | X |
| Tags | 태그(멀티) | codex, mcp | X |
| Topic | 주제·분류 | "AI 작업실" | X |
| Obsidian Link | **옵시디언 원본으로 점프** | obsidian://… | O |
| Used? | 활용 여부 | 체크박스 | X |
| Date | 날짜 | 2026-06-07 | O |

### NotionRunLog (작업 안전 로그) — Run Log DB
에이전트가 **무엇을 했는지** 1작업 = 1줄. 비개발자가 "AI가 내 볼트에 무슨 짓을 했는지" 되돌아보는 안전장치.

| 속성 | 설명 | 예시 | 필수 |
|------|------|------|------|
| Run date | 실행일시 | 2026-06-07 14:20 | O |
| Request | 받은 명령 | "Inbox 정리" | O |
| Changed notes | 변경된 노트 목록 | 7개 | O |
| Errors | 에러/건너뛴 자료 | "PDF 1건 추출 실패" | X |
| Human approved | **사람 승인 여부** | ✅ | O |

### AGENTS.md (규칙 파일 — 데이터 아님)
볼트 루트에 두는 에이전트 행동 설명서. 문체·수정 금지 폴더·노션 업로드 형식·안전 규칙을 적어, 매번 반복 지시하지 않게 함. (04_PROJECT_SPEC.md에 예시)

### 관계
- Source 1개에서 Note 1~N개가 나올 수 있음 (긴 PDF → 여러 원자 노트).
- Note는 여러 Tag를 가지고, 여러 Note와 양방향 Link로 연결됨.
- Note 1개 ↔ NotionResearchRow 1줄 (`notion_id`로 1:1).
- MOC 1개가 여러 Note를 묶음.
- 작업 1건 → NotionRunLog 1줄.

---

## 왜 이 구조인가

- **검증된 구조 채택**: 옵시디언 7폴더 + 표준 frontmatter는 PKM(개인 지식 관리) 커뮤니티와 "AI 작업실 세팅북"에서 실사용 검증된 형태. 새로 발명하지 않고 그대로 채택해 위험을 줄임.
- **연결 고리(`notion_id` ↔ Obsidian Link)** 가 핵심: 이게 있어야 두 도구가 따로 놀지 않음(노션 표 클릭 → 옵시디언 점프).
- **단방향 색인**: 옵시디언을 단일 진실원본으로 두면 충돌이 원천 차단됨. 노션은 "보기용 거울".
- **확장성**: Phase 3에서 노션 운영판 DB(Task/Content/Prompt)를 추가해도 위 뼈대(Note·frontmatter)는 그대로 유지됨.
- **단순성**: dedup은 `source_hash` 한 칸으로, 읽음 여부는 `status`로 흡수 — 칸을 늘리지 않고 해결.

---

## [NEEDS CLARIFICATION]

- [ ] **원본 파일 보관 위치** — `20_Resources/_files`에 PDF 원본까지 복사 vs 경로/링크만. (추천: 링크만, 필요 시 첨부)
- [ ] **신뢰도(Reliability) 자동 판정 기준** — 에이전트가 출처 도메인으로 추정 vs 사용자가 수동 지정. (추천: 자동 추정 + 수동 덮어쓰기 허용)
- [ ] **태그 체계** — 자유 태그 vs 미리 정한 태그 사전. (추천: 자유 시작, 누적되면 정리)
