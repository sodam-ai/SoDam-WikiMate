# Wikimate — Gemini 어댑터

Gemini CLI에서도 **같은 MCP 코어**를 써서 "정리" 기능을 쓰는 방법. (Claude Code·Codex와 동일한 무의존 stdio 서버 사용)

## 1) MCP 서버 등록
```bash
gemini mcp add wikimate node <wikimate 경로>/mcp/server.mjs -e OBSIDIAN_VAULT_PATH=<내 볼트 절대경로> -s user
```
예시(Windows):
```bash
gemini mcp add wikimate node D:/path/to/wikimate/mcp/server.mjs -e OBSIDIAN_VAULT_PATH=D:/MyVault -s user
```
확인:
```bash
gemini mcp list
```
→ 목록에 `wikimate`가 보이면 성공. 서버는 **무의존(node만 필요)** 이라 추가 설치가 없다.

> `-s user`(사용자 범위)를 권장한다. 기본값인 `-s project`는 지금 있는 폴더 안에 설정 파일을 새로 만드는데, 보통은 어느 프로젝트 폴더에서 Gemini를 실행하든 같은 볼트에 접근하고 싶을 것이므로 user 범위가 더 알맞다.

## 2) 워크스페이스 신뢰(Trust) 확인
Gemini CLI는 **신뢰하지 않는 폴더에서는 등록된 MCP 서버를 자동으로 비활성화**한다(2026-08-20 실측 확인 — "MCP servers are configured but disabled because this folder is untrusted." 경고가 실제로 뜸). 작업 폴더를 처음 열 때 신뢰 여부를 물어보면 승인하거나, 세션 한정으로만 신뢰하려면 `--skip-trust` 옵션을 쓴다.

## 3) 자연어 자동 동작
저장소 루트의 **`GEMINI.md`**(→ 내용은 `AGENTS.md`를 가리킴)를 Gemini가 읽으면, "정리해줘" 같은 자연어에도 동일한 워크플로우(접근 자동 감지 → dry-run 계획 보고 → 사람 승인 → 실제 생성)를 따른다.

## 사용 예
```bash
gemini -p "이 링크를 옵시디언 노트로 정리해줘: https://example.com  먼저 dry-run으로 계획만 보고해."
```

## 되돌리기
```bash
gemini mcp remove wikimate -s user
```

## 검증 상태 (정직 고지)
- ✅ **실측 확인(2026-08-20, Gemini CLI 0.52.0)**: 위 등록·조회·제거 명령을 실제로 실행해 정확한 문법과 결과를 확인했다(`gemini mcp add/list/remove`).
- ⚠️ **미검증(사용자 확인 필요)**: `gemini -p "..."` 같은 실제 자연어 트리거는 Gemini API 실호출(사용자의 계정·쿼터 소모)이 필요해 AI가 대행하지 않는다 — Codex 어댑터와 동일한 원칙. 실제로 자연어를 듣고 `wikimate_*` 도구를 자동으로 쓰는지는 사용자가 직접 확인해야 한다.
