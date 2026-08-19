# Wikimate — Gemini CLI 작업 규칙

이 저장소(또는 이 MCP 서버가 연결된 프로젝트)에서 작업할 때는 **저장소 루트의 `AGENTS.md`를 먼저 읽고 그 안의 규칙을 그대로 따른다.**

`AGENTS.md`는 Claude Code·Codex·Gemini 공용 크로스툴 규칙이며, "정리해줘"/"분류해줘"/"연결해줘"/"요약해줘"/"점검해줘" 같은 자연어 트리거, 안전 게이트(dry-run → 사람 승인 → 실행), 8개 `wikimate_*` MCP 도구 사용법이 전부 그 문서에 있다.

## MCP 서버 등록
`wikimate` MCP 서버를 Gemini CLI에 등록하는 방법은 [`adapters/gemini/SETUP.md`](./adapters/gemini/SETUP.md) 참고.

## 왜 규칙을 여기 다시 안 적었나
Gemini CLI는 컨텍스트 파일로 `GEMINI.md`(Codex의 `AGENTS.md`와 같은 역할)를 자동으로 읽는다. 안전 규칙·워크플로우를 이 파일에 다시 옮겨 적으면 `AGENTS.md`가 바뀔 때마다 두 곳을 따로 갱신해야 해서 시간이 지나면 서로 어긋난다(이 프로젝트가 실제로 여러 번 겪은 문서 불일치 패턴). 그래서 이 파일은 짧게 유지하고 `AGENTS.md`를 가리키기만 한다.
