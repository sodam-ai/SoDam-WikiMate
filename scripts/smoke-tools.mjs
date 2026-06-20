// MCP 서버 end-to-end 스모크: 새 도구(lint·fix·runlog)를 '실제 서버 프로토콜'로 호출해 배선 검증.
// lib 단위테스트(verify-*.mjs)와 달리, JSON-RPC 서버를 거쳐 인자 전달·dispatch·응답이 진짜 도는지 본다.
// 사용: node scripts/smoke-tools.mjs   (devDependency @modelcontextprotocol/sdk 필요 → npm install 후)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(tmpdir(), `wikimate_smoke_tools_${process.pid}`);
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };
const exists = (p) => stat(p).then(() => true).catch(() => false);
const parse = (res) => { try { return JSON.parse(res.content?.[0]?.text || "{}"); } catch { return {}; } };

// 임시 볼트에 문제 케이스 심기
await mkdir(join(vault, "30_Notes"), { recursive: true });
const note = (title, hash, body = "") => `---\ntitle: ${title}\nsource_hash: ${hash}\ncreated: 2026-01-01\n---\n${body}`;
await writeFile(join(vault, "30_Notes", "dupX.md"), note("dupX", "DUP"), "utf8");
await writeFile(join(vault, "30_Notes", "dupY.md"), note("dupY", "DUP"), "utf8");
await writeFile(join(vault, "30_Notes", "linker.md"), note("linker", "L1", "- [[target]]\n- [[broken]]"), "utf8");
await writeFile(join(vault, "30_Notes", "target.md"), note("target", "T1", "- [[linker]]"), "utf8");

const transport = new StdioClientTransport({ command: "node", args: [join(root, "mcp", "server.mjs")] });
const client = new Client({ name: "smoke-tools", version: "1.0.0" }, { capabilities: {} });

try {
  await client.connect(transport);
  console.log("연결 ✅");

  // 1) 도구 4개 노출
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  check("도구 4개 노출(collect/fix/lint/runlog)", ["wikimate_collect", "wikimate_fix", "wikimate_lint", "wikimate_runlog"].every((n) => tools.includes(n)));

  // 2) lint를 서버 통해 호출 → 중복·깨진링크 탐지
  const lintR = parse(await client.callTool({ name: "wikimate_lint", arguments: { vault_path: vault } }));
  check("서버경유 lint: ok + 중복 1그룹", lintR.ok === true && lintR.summary?.duplicates === 1);
  check("서버경유 lint: 깨진링크 'broken' 탐지", (lintR.broken_links || []).some((b) => b.target === "broken"));

  // 3) collect를 서버 통해 실제 생성(dry_run=false) → 파일 + Run Log 기록
  const colR = parse(await client.callTool({ name: "wikimate_collect", arguments: { vault_path: vault, title: "서버수집", text: "본문", url: "https://ex.com/s", dry_run: false } }));
  check("서버경유 collect: 실제 생성(written)", colR.written === true);

  // 4) fix archive를 서버 통해 dry-run → 실제(삭제 아님=이동)
  const fxDry = parse(await client.callTool({ name: "wikimate_fix", arguments: { vault_path: vault, action: "archive", note: "30_Notes/dupY.md", dry_run: true } }));
  check("서버경유 fix archive dry-run: 이동 예고", fxDry.dry_run === true && String(fxDry.would_move_to || "").includes("99_Archive"));
  const fxReal = parse(await client.callTool({ name: "wikimate_fix", arguments: { vault_path: vault, action: "archive", note: "30_Notes/dupY.md", dry_run: false } }));
  check("서버경유 fix archive 실제: 이동 완료", fxReal.dry_run === false && !(await exists(join(vault, "30_Notes", "dupY.md"))) && await exists(join(vault, fxReal.moved_to)));

  // 5) runlog를 서버 통해 조회 → collect·fix 작업이 기록됨
  const logR = parse(await client.callTool({ name: "wikimate_runlog", arguments: { vault_path: vault, limit: 10 } }));
  const acts = (logR.entries || []).map((e) => `${e.tool}:${e.action}`);
  check("서버경유 runlog: collect·archive 기록 확인", logR.ok === true && acts.includes("collect:create") && acts.includes("fix:archive"));

  await client.close();
  console.log("종료 ✅");
  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(vault, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
