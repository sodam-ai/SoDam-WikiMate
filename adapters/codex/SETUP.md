# Wikimate — Codex 어댑터

Codex에서도 **같은 MCP 코어**를 써서 "정리" 기능을 쓰는 방법. (Claude Code와 동일한 무의존 stdio 서버 사용)

## 1) MCP 서버 등록 — 권장(CLI)
```bash
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=<내 볼트 절대경로> -- node <wikimate 경로>/mcp/server.mjs
```
예시(Windows):
```bash
codex mcp add wikimate --env OBSIDIAN_VAULT_PATH=D:/MyVault -- node D:/path/to/wikimate/mcp/server.mjs
```
확인:
```bash
codex mcp list
```
→ 목록에 `wikimate`가 보이면 성공. 서버는 **무의존(node만 필요)** 이라 추가 설치가 없다.

## 2) (대안) config.toml 수동 등록
`~/.codex/config.toml`에 추가:
```toml
[mcp_servers.wikimate]
command = "node"
args = ["D:/AI_Dev_Work/2026y/26y_06m_10d_wikimate/mcp/server.mjs"]
env = { OBSIDIAN_VAULT_PATH = "D:/MyVault" }
```

## 3) 자연어 자동 동작
저장소 루트의 **`AGENTS.md`** 를 Codex가 읽으면, "정리해줘" 같은 자연어에도 동일한 워크플로우
(접근 자동 감지 → dry-run 계획 보고 → 사람 승인 → 실제 생성)를 따른다.
Codex 작업 폴더에 `AGENTS.md`를 두거나 그 내용을 참조시키면 된다.

## 사용 예
```bash
codex exec "이 링크를 옵시디언 노트로 정리해줘: https://example.com  먼저 dry-run으로 계획만 보고해."
```

## 되돌리기
```bash
codex mcp remove wikimate
```
