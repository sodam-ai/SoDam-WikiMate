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

  // 9) ★보안: 절대경로/UNC/드라이브문자 차단(root 무시하고 볼트 밖 쓰기 시도)
  const s1 = await fix({ vaultPath: root, action: "archive", note: "C:\\Windows\\System32\\evil.md", dryRun: true });
  check("절대경로(C:\\) 차단 → ok:false", s1.ok === false);
  const s2 = await fix({ vaultPath: root, action: "replace_link", note: "\\\\server\\share\\x.md", from: "a", dryRun: true });
  check("UNC(\\\\server) 차단 → ok:false", s2.ok === false);
  const s2b = await fix({ vaultPath: root, action: "archive", note: "/etc/passwd.md", dryRun: true });
  check("루트절대경로(/) 차단 → ok:false", s2b.ok === false);

  // 10) ★보안: .OBSIDIAN(대문자)·.wikimate(감사로그) 변조 차단
  const s3 = await fix({ vaultPath: root, action: "archive", note: ".OBSIDIAN/app.json", dryRun: true });
  check(".OBSIDIAN(대문자) 차단 → ok:false", s3.ok === false);
  const s4 = await fix({ vaultPath: root, action: "replace_link", note: ".wikimate/runlog.jsonl", from: "a", dryRun: true });
  check(".wikimate(감사로그) 변조 차단 → ok:false", s4.ok === false);

  // 11) 표시명/앵커 있는 링크 [[옛이름|보임]] 치환(접미 보존)
  await writeFile(join(root, "30_Notes", "표시링크.md"), "---\ntitle: 표시링크\n---\n- [[옛이름|보이는글]]\n- ![[그림.png]]", "utf8");
  const d1 = await fix({ vaultPath: root, action: "replace_link", note: "30_Notes/표시링크.md", from: "옛이름", to: "새이름", dryRun: false, ts: TS });
  const dispBody = await readFile(join(root, "30_Notes", "표시링크.md"), "utf8");
  check("표시명 링크 [[옛이름|보이는글]]→[[새이름|보이는글]] 치환(접미 보존)", d1.replaced === 1 && dispBody.includes("[[새이름|보이는글]]"));

  // 12) ★archive 이름충돌 시 절대 덮어쓰지 않음(데이터 손실 0)
  await mkdir(join(root, "99_Archive"), { recursive: true });
  await writeFile(join(root, "99_Archive", "충돌.md"), "기존-보존되어야함", "utf8");
  await writeFile(join(root, "30_Notes", "충돌.md"), "새거", "utf8");
  const c1 = await fix({ vaultPath: root, action: "archive", note: "30_Notes/충돌.md", dryRun: false, ts: TS });
  const keep = await readFile(join(root, "99_Archive", "충돌.md"), "utf8");
  const movedContent = await readFile(join(root, c1.moved_to), "utf8").catch(() => "");
  check("archive 충돌 시 기존 보존 + 새 파일 별도 보관(덮어쓰기 0)", keep === "기존-보존되어야함" && movedContent === "새거");

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(root, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
