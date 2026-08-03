// classify 도구 핵심 로직 검증 — 격리 임시볼트(verify-link.mjs와 동일 패턴).
import { classify } from "../mcp/lib/classify.mjs";
import { join } from "node:path";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const vault = join(tmpdir(), `wikimate_verify_classify_${process.pid}`);
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };

const note = (title, tags = [], importance = 3) =>
  [
    "---",
    `title: "${title}"`,
    "type: note",
    "status: inbox",
    `summary: "${title} 요약"`,
    `importance: ${importance}`,
    `tags: [${tags.join(", ")}]`,
    "created: 2026-01-01",
    "---",
    "",
    `# ${title}`,
    "",
    `${title}에 대한 본문 내용입니다. MCP와 관련된 참고 자료예요.`,
  ].join("\n");

await mkdir(join(vault, "00_Inbox"), { recursive: true });
await mkdir(join(vault, "20_Resources"), { recursive: true });
await writeFile(join(vault, "00_Inbox", "미분류.md"), note("미분류", ["mcp"]), "utf8");
await writeFile(join(vault, "20_Resources", "기존자료.md"), note("기존자료", ["notion", "reference"]), "utf8");

try {
  // 1) suggest: 기본 정보 + 태그 어휘 + 폴더 옵션
  const s1 = await classify({ vaultPath: vault, action: "suggest", note: "00_Inbox/미분류.md" });
  check("suggest: ok", s1.ok === true);
  check("suggest: current_folder=00_Inbox", s1.target?.current_folder === "00_Inbox");
  check("suggest: body_excerpt 포함(500자 이하)", typeof s1.target?.body_excerpt === "string" && s1.target.body_excerpt.length <= 500);
  check("suggest: folder_options 5개(템플릿·보관 제외)", s1.folder_options?.length === 5 && !s1.folder_options.some((f) => f.folder.includes("Template") || f.folder.includes("Archive")));
  check("suggest: existing_tags에 기존 볼트 태그 집계", s1.existing_tags?.some((t) => t.tag === "notion"));
  check("suggest: guidance에 추측금지 문구", s1.guidance.includes("추측 금지"));

  // 2) apply: 존재하지 않는 노트 거부
  const a2 = await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/없는노트.md", folder: "20_Resources", dryRun: false });
  check("apply: 존재하지 않는 노트 거부", a2.ok === false);

  // 3) apply: 허용 안 된 폴더(99_Archive) 거부
  const a3 = await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/미분류.md", folder: "99_Archive", dryRun: false });
  check("apply: 99_Archive 지정 거부(fix 전담 영역)", a3.ok === false);

  // 4) apply dry-run: 파일 이동 안 됨
  await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/미분류.md", folder: "20_Resources", tags: ["mcp", "참고"], dryRun: true });
  const stillThere = await readFile(join(vault, "00_Inbox", "미분류.md"), "utf8").then(() => true).catch(() => false);
  check("apply dry-run: 파일 이동 안 됨", stillThere);

  // 5) apply 실제: 폴더 이동 + 태그 추가(멱등 병합) + 백업은 태그변경 때문에 생김
  const a5 = await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/미분류.md", folder: "20_Resources", tags: ["mcp", "참고"], dryRun: false });
  check("apply 실제: ok", a5.ok === true);
  check("apply 실제: 이동 후 note 경로 갱신", a5.note === "20_Resources/미분류.md");
  const moved = await readFile(join(vault, "20_Resources", "미분류.md"), "utf8");
  check("apply 실제: 파일이 실제로 이동됨", moved.includes('title: "미분류"'));
  check("apply 실제: 태그 멱등 병합(mcp 중복 없이 + 참고 추가)", moved.includes("tags: [mcp, 참고]"));
  check("apply 실제: 태그변경이라 백업 생성됨", typeof a5.backup === "string" && a5.backup.length > 0);
  const oldGone = await readFile(join(vault, "00_Inbox", "미분류.md"), "utf8").then(() => false).catch(() => true);
  check("apply 실제: 원래 위치엔 파일 없음(이동 확인)", oldGone);

  // 6) apply: 순수 폴더유지 + 태그만 재요청(이미 있음) → 변경 없음 보고
  const a6 = await classify({ vaultPath: vault, action: "apply", note: "20_Resources/미분류.md", tags: ["mcp"], dryRun: false });
  check("apply: 이미 있는 태그만 재요청 시 changed:false", a6.changed === false);

  // 7) apply: 충돌 파일명 처리(같은 폴더에 동명 파일 있을 때 덮어쓰지 않음)
  await writeFile(join(vault, "00_Inbox", "충돌본.md"), note("충돌본"), "utf8");
  await writeFile(join(vault, "20_Resources", "충돌본.md"), note("먼저있던파일"), "utf8");
  const a7 = await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/충돌본.md", folder: "20_Resources", dryRun: false });
  check("apply: 충돌 시 접미 붙여 별도 보관(덮어쓰기 없음)", a7.ok === true && a7.note !== "20_Resources/충돌본.md");
  const originalIntact = await readFile(join(vault, "20_Resources", "충돌본.md"), "utf8");
  check("apply: 기존 파일 덮어쓰기 없이 보존됨", originalIntact.includes('title: "먼저있던파일"'));

  // 8) 경로/.obsidian 가드
  const a8 = await classify({ vaultPath: vault, action: "apply", note: "../../etc/passwd", folder: "20_Resources", dryRun: false });
  check("경로 이탈 차단", a8.ok === false);

  // 9) importance 검증 (실측으로 발견한 결함 회귀 방지 — server.mjs가 스키마 minimum/maximum을 강제 안 하므로 여기서 직접 검증해야 함)
  await writeFile(join(vault, "20_Resources", "중요도테스트.md"), note("중요도테스트", ["x"], 2), "utf8");
  const a9 = await classify({ vaultPath: vault, action: "apply", note: "20_Resources/중요도테스트.md", importance: "abc", dryRun: false });
  check("importance에 비숫자 문자열 거부(NaN 기록 방지)", a9.ok === false && /1~5/.test(a9.reason || ""));
  const a10 = await classify({ vaultPath: vault, action: "apply", note: "20_Resources/중요도테스트.md", importance: 999, dryRun: false });
  check("importance 범위 밖(999) 거부", a10.ok === false && /1~5/.test(a10.reason || ""));
  const unchanged = await readFile(join(vault, "20_Resources", "중요도테스트.md"), "utf8");
  check("importance 거부 후 파일 미변경(원래값 2 유지)", unchanged.includes("importance: 2"));

  // 10) tags 중복 지정 시 요청 내부에서도 dedup(실측으로 발견: 기존 값과만 비교하면 신규 중복은 못 걸러짐)
  const a11 = await classify({ vaultPath: vault, action: "apply", note: "20_Resources/중요도테스트.md", tags: ["새태그", "새태그"], dryRun: false });
  check("요청 내 중복 태그 → 1개만 추가", a11.ok === true && a11.plan.tags.after.filter((t) => t === "새태그").length === 1);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(vault, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
