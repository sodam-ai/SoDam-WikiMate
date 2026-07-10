#!/usr/bin/env node
// Wikimate SessionStart hook — 옵시디언 CLI(notesmd-cli)·등록된 볼트를 세션 시작 시 미리 감지해 안내.
// 읽기 전용(파일 쓰기 없음). 실패해도 세션을 절대 막지 않는다(graceful) — 감지 실패는 조용히 넘어간다.
// 노션 연결 여부는 여기서 감지하지 않는다 — 로컬 환경 검사로는 "이 세션에서 실제 노션 도구를 쓸 수 있는지"를
// 신뢰성 있게 알 수 없어서(추측 금지), 그건 각 스킬이 실제 도구 호출로 직접 확인한다(기존 컨벤션 유지).

import { hasNotesmdCli, listVaults } from "../mcp/lib/collect.mjs";

function send(obj) {
  process.stdout.write(JSON.stringify(obj));
}

try {
  const cli = await hasNotesmdCli().catch(() => false);
  const v = listVaults();
  const lines = ["[Wikimate] 세션 시작 자동 감지:"];
  lines.push(`- 옵시디언 CLI(notesmd-cli): ${cli ? "감지됨" : "미설치 → 파일시스템 경로(vault_path)로 폴백"}`);
  if (v.ok) {
    const names = (v.vaults || []).map((x) => `${x.name}${x.open ? "(열림)" : ""}`).join(", ") || "없음";
    lines.push(`- 등록된 볼트: ${names}`);
    if (v.open_vault) lines.push(`- 현재 열린 볼트: ${v.open_vault} (wikimate 스킬이 기본으로 제안할 대상)`);
  } else {
    lines.push(`- 볼트 감지: ${v.reason}`);
  }
  send({ continue: true, systemMessage: lines.join("\n") });
} catch {
  // 감지 실패해도 세션을 막지 않는다 — 조용히 통과(안내 없이)
  send({ continue: true });
}
