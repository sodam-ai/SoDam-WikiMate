// Run Log + 백업 오염 방지(walkVault dot-dir 스킵) 검증 — node로 직접(증거 기반)
// 사용: node scripts/verify-runlog.mjs
import { appendRunLog, readRunLog } from "../mcp/lib/runlog.mjs";
import { walkVault } from "../mcp/lib/collect.mjs";
import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = join(tmpdir(), `wikimate_runlog_test_${process.pid}`);
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };
const exists = (p) => stat(p).then(() => true).catch(() => false);

try {
  await mkdir(join(root, "30_Notes"), { recursive: true });

  // 1) append → read
  await appendRunLog(root, { tool: "collect", action: "create", request: "노트A", changed: "30_Notes/노트A.md", result: "ok" });
  await appendRunLog(root, { tool: "fix", action: "archive", request: "노트B", changed: "99_Archive/노트B.md", result: "ok" });
  const entries = await readRunLog(root, 20);
  check("append 2건 → read 2건", entries.length === 2 && entries[0].tool === "collect" && entries[1].action === "archive");
  check(".wikimate/runlog.jsonl 생성됨", await exists(join(root, ".wikimate", "runlog.jsonl")));
  check("ts 자동 기록", typeof entries[0].ts === "string" && entries[0].ts.includes("T"));

  // 2) best-effort: root 없으면 throw 안 함
  let threw = false;
  try { await appendRunLog(null, { x: 1 }); } catch { threw = true; }
  check("root=null → throw 안 함(graceful)", threw === false);
  check("readRunLog(없는 경로) → 빈 배열", (await readRunLog(join(tmpdir(), "없음_" + process.pid))).length === 0);

  // 3) ★ 백업 오염 방지: .wikimate 안의 .md는 walkVault가 절대 안 봄
  await mkdir(join(root, ".wikimate", "backups", "TS", "30_Notes"), { recursive: true });
  await writeFile(join(root, ".wikimate", "backups", "TS", "30_Notes", "노트A.md"), "---\nsource_hash: HHH\n---\n백업본", "utf8");
  await writeFile(join(root, "30_Notes", "노트A.md"), "---\nsource_hash: HHH\n---\n원본", "utf8");
  const scanned = [];
  for await (const p of walkVault(root)) scanned.push(p);
  const sawBackup = scanned.some((p) => p.includes(".wikimate"));
  check("walkVault가 .wikimate(백업) 스캔 안 함 → 중복 오염 0", !sawBackup && scanned.length === 1);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
