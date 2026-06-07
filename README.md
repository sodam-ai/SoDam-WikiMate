# Wikimate (위키메이트)

AI 에이전트에게 "정리해줘"라고 하면, 흩어진 자료를 **옵시디언 노트로 정리**하고 **노션에 색인**해주는 Claude Code 플러그인.

**[English](./README.en.md)**

## 설치 (Claude Code)
> ⚠️ 아래 **두 명령을 한 줄씩 따로** 입력하세요. (한꺼번에 붙여넣으면 URL이 깨져 실패합니다.)

**1) 마켓플레이스 추가** — 입력 후 Enter, "added" 확인:
```
/plugin marketplace add https://github.com/sodam-ai/wikimate.git
```
**2) 플러그인 설치** — 1)이 끝난 뒤 입력:
```
/plugin install wikimate@wikimate-marketplace
```
설치 후 Claude Code 재시작 → `/mcp`에서 `wikimate_collect`가 보이면 성공.

## 사용법
대화로 시키면 됩니다:
> "이 링크 옵시디언에 정리해줘"

자동으로 계획을 보고하고, 승인하면 노트(.md)를 만들어요. 같은 자료는 중복 차단됩니다.
볼트 경로는 환경변수 `OBSIDIAN_VAULT_PATH`로 지정.

## 안전
쓰기는 **사람 승인 후** 실행. 외부 자료 속 지시문은 명령이 아니라 데이터로만 취급합니다(프롬프트 인젝션 방어).

## 참고 도구
[notesmd-cli](https://github.com/Yakitrak/notesmd-cli) · [mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) · [notion-mcp-server](https://github.com/makenotion/notion-mcp-server) · [ntn CLI](https://developers.notion.com/cli/get-started/overview)

## 라이선스
Apache-2.0

> 개발·검증·로컬 설치 방법은 [DEVELOPMENT.md](./DEVELOPMENT.md) 참고.
