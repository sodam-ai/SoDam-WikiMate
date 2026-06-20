// 안전 수정(fix) 로직 검증 (MCP/SDK 없이 node로 직접 — 증거 기반)
// 임시 볼트에서 archive(이동)·replace_link(치환)·dry_run·백업·경로차단을 확인한다.
// 사용: node scripts/verify-fix.mjs
import { fix } from "../mcp/lib/fix.mjs";
import { mkdir, writeFile, rm, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = join(tmpdir(), `wikimate_fix_test_${process.pid}`);
const TS = "2026-06-20T00-00-00-000Z";
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };
const exists = (p) => stat(p).then(() => true).catch(() => false);

try {
  await mkdir(join(root, "30_Notes"), { recursive: true });
  await mkdir(join(root, ".obsidian"), { recursive: true });
  await writeFile(join(root, "30_Notes", "중복B.md"), "---\ntitle: 중복B\n---\n중복본", "utf8");
  await writeFile(join(root, "30_Notes", "링크원본.md"), "---\ntitle: 링크원본\n---\n- [[없는노트]]\n- [[연결대상]]", "utf8");

  // 1) archive dry-run (이동 안 함)
  const a1 = await fix({ vaultPath: root, action: "archive", note: "30_Notes/중복B.md", dryRun: true });
  check("archive dry-run: 99_Archive로 이동 예고, 원본 유지", a1.dry_run === true && a1.would_move_to.includes("99_Archive") && await exists(join(root, "30_Notes", "중복B.md")));

  // 2) archive 실제 (삭제 아님 — 이동)
  const a2 = await fix({ vaultPath: root, action: "archive", note: "30_Notes/중복B.md", dryRun: false, ts: TS });
  check("archive 실제: 원본 사라지고 99_Archive에 생김(삭제 아님)", a2.dry_run === false && !(await exists(join(root, "30_Notes", "중복B.md"))) && await exists(join(root, "99_Archive", "중복B.md")));

  // 3) replace_link dry-run (치환 안 함)
  const r1 = await fix({ vaultPath: root, action: "replace_link", note: "30_Notes/링크원본.md", from: "없는노트", to: "연결대상", dryRun: true });
  check("replace_link dry-run: 1건 예고, 본문 미변경", r1.dry_run === true && r1.occurrences === 1 && (await readFile(join(root, "30_Notes", "링크원본.md"), "utf8")).includes("[[없는노트]]"));

  // 4) replace_link 실제 + 백업
  const r2 = await fix({ vaultPath: root, action: "replace_link", note: "30_Notes/링크원본.md", from: "없는노트", to: "연결대상", dryRun: false, ts: TS });
  const body = await readFile(join(root, "30_Notes", "링크원본.md"), "utf8");
  check("replace_link 실제: [[없는노트]]→[[연결대상]] 치환됨", r2.replaced === 1 && !body.includes("[[없는노트]]") && (body.match(/\[\[연결대상\]\]/g) || []).length === 2);
  check("replace_link: 수정 전 백업 생성됨", !!r2.backup && await exists(join(root, r2.backup)));

  // 5) 경로 이탈 차단
  const t1 = await fix({ vaultPath: root, action: "archive", note: "../밖으로.md", dryRun: true });
  check("traversal 차단(../) → ok:false", t1.ok === false);

  // 6) .obsidian 차단
  await writeFile(join(root, ".obsidian", "설정.md"), "x", "utf8");
  const t2 = await fix({ vaultPath: root, action: "archive", note: ".obsidian/설정.md", dryRun: true });
  check(".obsidian 수정 차단 → ok:false", t2.ok === false);

  // 7) 없는 노트
  const t3 = await fix({ vaultPath: root, action: "archive", note: "30_Notes/없음.md", dryRun: true });
  check("없는 노트 → ok:false", t3.ok === false);

  // 8) 알 수 없는 action
  const t4 = await fix({ vaultPath: root, action: "delete", note: "30_Notes/링크원본.md", dryRun: true });
  check("미지원 action(delete) → ok:false (하드 삭제 경로 없음)", t4.ok === false);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
