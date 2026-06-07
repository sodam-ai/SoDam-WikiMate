# Wikimate (위키메이트)

> AI 에이전트에게 "이거 정리해줘"라고 하면, 흩어진 자료를 **옵시디언(원본)** 에 노트로 정리하고 **노션(색인)** 에 표로 색인해주는 도구. **Claude Code 플러그인 + 이식 가능한 MCP 코어**.

**🌐 [English README](./README.en.md)**

---

## Wikimate가 뭐예요? (한 줄 비유)
브라우저 탭·다운로드 폴더·AI 대화창에 흩어진 자료를, AI가 대신 **"다시 찾고 다시 읽을 수 있는" 내 지식 노트**로 정리해주는 비서예요.

## 지금 상태 (개발 단계)
- **Phase 1a (현재)**: MCP 코어 + 수집 도구(`wikimate_collect`) — 자료를 옵시디언 노트(.md)로 생성. **안전 게이트·중복 방지·인젝션 방어** 포함.
- 다음 단계: 자동 분류·노션 색인(1b) → 자동 트리거 스킬(2) → 마켓플레이스 공개(3, 검증 후).

## 구조 한눈에
```
옵시디언 = 원본·장기기억 (.md 파일)
노션     = 색인·운영판      (Phase 1b)
MCP 코어 = 정리 로직 1개   (Claude Code·Codex 공용 = 모델 비종속)
안전     = 분석 → 보고 → 사람 승인 → 실행
```

---

## 설치 (Claude Code) — 왕초보 단계별

### 방법 A: 내 PC에서 바로 (로컬 테스트)
1. (한 번만) 이 폴더에서 의존성 설치:
   ```bash
   npm install
   ```
2. Claude Code 대화칸에 입력:
   ```
   /plugin marketplace add <이 폴더의 경로>
   /plugin install wikimate@wikimate-marketplace
   ```
3. Claude Code **재시작**.
4. 확인: `/mcp` 입력 → `wikimate` 서버와 `wikimate_collect` 도구가 보이면 성공.

### 방법 B: GitHub에서 (다른 PC·공유용)
```
/plugin marketplace add sodam-ai/wikimate
/plugin install wikimate@wikimate-marketplace
```
> `marketplace add`의 **출처만** 바뀌고(로컬 폴더 → `sodam-ai/wikimate`), `install` 줄은 동일해요. (마켓 이름은 `marketplace.json`의 `name`에서 옴)

---

## 사용법
대화로 시키면 됩니다. 예시:
```
wikimate_collect 도구로 이 내용을 노트로 만들어줘.
title="MCP란?", text="...본문...", vault_path="<내 볼트 경로>", dry_run=true
```
- **`dry_run=true`(기본)**: 계획만 보고 → 파일 안 만듦. 확인 후 `false`로 실제 생성.
- 같은 자료를 또 넣으면 `source_hash`로 **중복 차단**.
- 만들어지는 노트: 제목·출처·날짜·요약·태그·중요도(머리말) + 본문.

## 환경변수
| 변수 | 설명 |
|---|---|
| `OBSIDIAN_VAULT_PATH` | 내 옵시디언 볼트 폴더의 절대경로. 미설정 시 호출마다 `vault_path` 전달 |

> 노션 관련 변수는 Phase 1b부터. 실제 값은 `.env`에 두고 **절대 커밋 금지**. 예시는 `.env.example` 참고.

## 개발자용 (로컬 검증)
```bash
npm install        # 의존성 설치
npm run verify     # 수집 로직 검증 (SDK 없이 동작)
npm start          # MCP 서버(stdio) 실행
```

## 오류 대처 (Troubleshooting)
| 증상 | 원인 | 해결 |
|---|---|---|
| `/mcp`에 도구가 안 보임 | 설치 후 재시작 안 함 | Claude Code 재시작 |
| "vault_path 필요" 오류 | 볼트 경로 미설정 | 호출 시 `vault_path` 넣기 또는 `OBSIDIAN_VAULT_PATH` 설정 |
| 다른 PC에서 서버가 안 켜짐 | 의존성(node_modules) 미동봉 | 그 폴더에서 `npm install` (배포 방식 개선 예정) |

---

## 안전·보안
- 쓰기/삭제는 **사람 승인 게이트**(`dry_run`이 기본값).
- 외부 자료 속 지시문은 **명령이 아니라 데이터**로만 취급 — **프롬프트 인젝션 방어**.
- API 키·토큰·개인정보는 노트·저장소에 저장하지 않음. `.env`는 git 제외.

## 참고 도구 (References)
| 도구 | 역할 |
|---|---|
| [Yakitrak/notesmd-cli](https://github.com/Yakitrak/notesmd-cli) | 옵시디언 CLI (헤드리스) |
| [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) | 옵시디언 MCP |
| [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | 노션 MCP (공식) |
| [Notion `ntn` CLI](https://developers.notion.com/cli/get-started/overview) | 노션 CLI (공식) |

> 영감: 지윤쌤 "AI 작업실 공식 세팅북" (Notion × Obsidian).

## 알려진 한계
- GitHub 설치 시 의존성(node_modules) 동봉 문제 → 무의존/번들 방식으로 개선 예정.
- 노션 색인·자동 트리거 스킬은 다음 Phase.
- Codex 어댑터 동작은 미검증.

## 라이선스
Apache-2.0 (잠정 — 공개 배포 전 확정).
