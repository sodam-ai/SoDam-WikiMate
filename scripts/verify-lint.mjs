// 건강검진(lint) 로직 검증 (MCP/SDK 없이 node로 직접 — 증거 기반 검증)
// 임시 볼트에 의도적 문제 케이스를 심고, 각 검사가 잡는지 PASS/FAIL로 출력한다.
// 사용: node scripts/verify-lint.mjs
import { lint } from "../mcp/lib/lint.mjs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = join(tmpdir(), `wikimate_lint_test_${process.pid}`);

// 고정 '오늘'(2026-06-20)로 최근/고아 분류를 결정론적으로 검증
const NOW = Date.parse("2026-06-20");

function note({ title, hash = "", links = [], created = "2026-01-01", fmOmit = false }) {
  if (fmOmit) return `# ${title}\n\n본문(머리말 없음)`;
  const body = links.map((l) => `- [[${l}]]`).join("\n");
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    "type: note",
    "status: inbox",
    `source_hash: ${JSON.stringify(hash)}`,
    `created: ${created}`,
    "---",
    "",
    `# ${title}`,
    "",
    body,
  ].join("\n");
}

let pass = 0, fail = 0;
function check(label, cond) {
  console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`);
  cond ? pass++ : fail++;
}

try {
  await mkdir(join(root, "00_Inbox"), { recursive: true });
  await mkdir(join(root, "30_Notes"), { recursive: true });
  await mkdir(join(root, ".obsidian"), { recursive: true });

  // 중복: 같은 source_hash 2개
  await writeFile(join(root, "30_Notes", "중복A.md"), note({ title: "중복A", hash: "DUPHASH" }), "utf8");
  await writeFile(join(root, "30_Notes", "중복B.md"), note({ title: "중복B", hash: "DUPHASH" }), "utf8");
  // 깨진 링크: 존재하지 않는 [[없는노트]]
  await writeFile(join(root, "30_Notes", "링크원본.md"), note({ title: "링크원본", hash: "H1", links: ["없는노트", "연결대상"] }), "utf8");
  // 연결대상: 링크원본이 가리킴(고아 아님)
  await writeFile(join(root, "30_Notes", "연결대상.md"), note({ title: "연결대상", hash: "H2", links: ["링크원본"] }), "utf8");
  // 고아: 오래된 날짜 + 링크 0 (30_Notes라 정상 분류 대상 아님)
  await writeFile(join(root, "30_Notes", "외톨이.md"), note({ title: "외톨이", hash: "H3", created: "2026-01-01" }), "utf8");
  // Inbox 노트: 링크 0이지만 00_Inbox라 고아 경보 제외(정상)
  await writeFile(join(root, "00_Inbox", "새자료.md"), note({ title: "새자료", hash: "H4", created: "2026-01-01" }), "utf8");
  // frontmatter 누락
  await writeFile(join(root, "30_Notes", "머리말없음.md"), note({ title: "머리말없음", fmOmit: true }), "utf8");
  // .obsidian 안 파일은 스캔에서 제외돼야 함
  await writeFile(join(root, ".obsidian", "설정메모.md"), note({ title: "설정", hash: "X" }), "utf8");

  const r = await lint({ vaultPath: root, now: NOW });
  console.log("\n=== lint 결과 요약 ===");
  console.log(r.summary, "| scanned:", r.scanned, "| notion_checked:", r.notion_checked);
  console.log("");

  check(".obsidian 제외 (scanned=7)", r.scanned === 7);
  check("중복 1그룹(DUPHASH, 2파일) 잡힘", r.duplicates.length === 1 && r.duplicates[0].files.length === 2);
  check("깨진 링크 '없는노트' 1건 잡힘", r.broken_links.some((b) => b.target === "없는노트"));
  check("존재하는 '연결대상'은 깨진링크 아님", !r.broken_links.some((b) => b.target === "연결대상"));
  check("고아 '외톨이.md' 잡힘", r.orphans.some((o) => o.note.includes("외톨이")));
  check("Inbox '새자료.md'는 고아 경보 제외", !r.orphans.some((o) => o.note.includes("새자료")));
  check("'연결대상.md'는 고아 아님(들어오는 링크 있음)", !r.orphans.some((o) => o.note.includes("연결대상")));
  check("frontmatter 누락 '머리말없음.md' 잡힘", r.malformed.some((m) => m.note.includes("머리말없음")));
  check("basenames 반환(스킬 노션 대조용)", Array.isArray(r.basenames) && r.basenames.length === 7);

  // 볼트 미해결 시 ok:false 명시(조용히 통과 X)
  const r2 = await lint({ vaultPath: join(tmpdir(), "존재하지않는볼트XYZ_" + process.pid) });
  check("미해결 볼트 → ok:false 명시", r2.ok === false);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(root, { recursive: true, force: true }).catch(() => {});
}

process.exit(fail === 0 ? 0 : 1);
