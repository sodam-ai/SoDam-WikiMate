// summarize 도구 핵심 로직 검증 — 격리 임시볼트(verify-classify.mjs와 동일 패턴).
import { summarize } from "../mcp/lib/summarize.mjs";
import { join } from "node:path";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const vault = join(tmpdir(), `wikimate_verify_summarize_${process.pid}`);
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };

const note = (title, body) =>
  [
    "---",
    `title: "${title}"`,
    "type: note",
    "status: inbox",
    'summary: ""',
    "importance: 3",
    "tags: [mcp]",
    "related: []",
    "created: 2026-01-01",
    "---",
    "",
    `# ${title}`,
    "",
    "## 원문 내용",
    "",
    body,
  ].join("\n");

await mkdir(join(vault, "20_Resources"), { recursive: true });
await mkdir(join(vault, "30_Notes"), { recursive: true });
const longBody = "MCP 서버 구축에 필요한 절차를 상세히 설명하는 자료입니다. ".repeat(20);
await writeFile(join(vault, "20_Resources", "자료.md"), note("자료", longBody), "utf8");

try {
  // 1) suggest: 본문·현재 요약·guidance
  const s1 = await summarize({ vaultPath: vault, action: "suggest", note: "20_Resources/자료.md" });
  check("suggest: ok", s1.ok === true);
  check("suggest: body에 원문 포함", s1.body.includes("MCP 서버 구축"));
  check("suggest: current_summary 빈 문자열", s1.current_summary === "");
  check("suggest: guidance에 추측금지 문구", s1.guidance.includes("추측 금지"));

  // 2) suggest: 존재하지 않는 노트
  const s2 = await summarize({ vaultPath: vault, action: "suggest", note: "20_Resources/없음.md" });
  check("suggest: 존재하지 않는 노트 거부", s2.ok === false);

  // 3) apply: summary도 atomic_note도 없으면 거부
  const a3 = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", dryRun: false });
  check("apply: summary/atomic_note 둘 다 없으면 거부", a3.ok === false);

  // 4) apply: summary 200자 초과 거부
  const a4 = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: "x".repeat(201), dryRun: false });
  check("apply: summary 200자 초과 거부", a4.ok === false && /200자/.test(a4.reason));

  // 5) apply dry-run: 파일 변경 안 됨
  await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: "MCP 서버 구축 절차 요약", dryRun: true });
  const untouched = await readFile(join(vault, "20_Resources", "자료.md"), "utf8");
  check("apply dry-run: 파일 미변경(summary 빈 값 유지)", untouched.includes('summary: ""'));

  // 6) apply 실제: summary 반영 + 백업 생성 + 본문(body) 원문 보존
  const a6 = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: "MCP 서버 구축 절차 요약", dryRun: false });
  check("apply 실제: ok", a6.ok === true);
  check("apply 실제: 백업 생성됨", typeof a6.backup === "string" && a6.backup.length > 0);
  const afterSummary = await readFile(join(vault, "20_Resources", "자료.md"), "utf8");
  check("apply 실제: summary frontmatter 반영", afterSummary.includes('summary: "MCP 서버 구축 절차 요약"'));
  check("apply 실제: 원문(body) 그대로 보존됨(요약이 원문을 대체하지 않음)", afterSummary.includes(longBody.trim().split(".")[0]));

  // 7) apply: 변경 없음(같은 summary 재요청) → changed:false
  const a7 = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: "MCP 서버 구축 절차 요약", dryRun: false });
  check("apply: 동일 summary 재요청 시 changed:false", a7.changed === false);

  // 7.5) summary에 백슬래시/따옴표가 있어도 재조회·멱등성이 안 깨지는지(실측 결함 회귀 방지 — 2026-08-20 발견,
  // classify.mjs에서 먼저 발견돼 shared.mjs의 stripQuotes로 통합하면서 여기도 같이 고쳐짐)
  const trickySummary = 'C:\\경로 "인용구" 요약';
  const a7b = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: trickySummary, dryRun: false });
  check("apply: 백슬래시/따옴표 포함 summary 저장 ok", a7b.ok === true);
  const s7c = await summarize({ vaultPath: vault, action: "suggest", note: "20_Resources/자료.md" });
  check("suggest: 재조회 시 원래 값과 정확히 일치(이스케이프 왕복 보존)", s7c.current_summary === trickySummary);
  const a7d = await summarize({ vaultPath: vault, action: "apply", note: "20_Resources/자료.md", summary: trickySummary, dryRun: false });
  check("apply: 같은 값 재요청 시 changed:false(멱등 — 이게 실측으로 깨졌던 부분)", a7d.changed === false);

  // 8) apply 실제: atomic_note 생성 — 30_Notes에 파일 + related로 원본 노트 계보 남김 + 원본 노트는 그대로
  const a8 = await summarize({
    vaultPath: vault, action: "apply", note: "20_Resources/자료.md",
    atomicNote: { title: "MCP 서버 구축 핵심", body: "1. 서버 등록\n2. 도구 노출\n3. 클라이언트 연결" },
    dryRun: false,
  });
  check("apply 실제: atomic_note 생성됨", a8.ok === true && a8.atomic_note?.created === true);
  const atomicText = await readFile(join(vault, "30_Notes", "MCP 서버 구축 핵심.md"), "utf8");
  check("atomic_note: title 반영", atomicText.includes('title: "MCP 서버 구축 핵심"'));
  check("atomic_note: related로 원본 노트 계보 연결", atomicText.includes('related: ["[[자료]]"]'));
  const originalStillIntact = await readFile(join(vault, "20_Resources", "자료.md"), "utf8");
  check("atomic_note 생성 후에도 원본 노트 본문 불변", originalStillIntact.includes(longBody.trim().split(".")[0]));

  // 9) apply: atomic_note 파일명 충돌 시 덮어쓰기 없이 접미 부여
  const a9 = await summarize({
    vaultPath: vault, action: "apply", note: "20_Resources/자료.md",
    atomicNote: { title: "MCP 서버 구축 핵심", body: "다른 내용의 두 번째 원자노트" },
    dryRun: false,
  });
  check("apply: atomic_note 충돌 시 접미 부여(덮어쓰기 없음)", a9.ok === true && a9.atomic_note.path !== "30_Notes/MCP 서버 구축 핵심.md");
  const firstStillIntact = await readFile(join(vault, "30_Notes", "MCP 서버 구축 핵심.md"), "utf8");
  check("apply: 기존 원자노트 덮어쓰기 없이 보존됨", firstStillIntact.includes("1. 서버 등록"));

  // 10) 경로 이탈/.obsidian 가드
  const a10 = await summarize({ vaultPath: vault, action: "apply", note: "../../etc/passwd", summary: "x", dryRun: false });
  check("경로 이탈 차단", a10.ok === false);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(vault, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
