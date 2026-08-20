// 배포물 보안 자동 점검 (03_PHASES.md Phase 3: "배포물 보안 점검(개인 경로·토큰·데이터 미포함 자동 검사)")
// git 커밋 전(pre-commit 훅) 또는 수동(npm run security-check)으로 실행한다.
// 오탐을 줄이려고 "키워드 언급"이 아니라 "실제 토큰처럼 생긴 값"만 매칭한다
// (예: NOTION_RUNLOG_DB_ID 같은 환경변수 이름이나 notion_id: "" 같은 빈 필드는 매칭 안 됨).
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { SECRET_PATTERNS as PATTERNS } from "../mcp/lib/shared.mjs";

// stdio를 명시적으로 pipe로 고정 — git이 실패할 때 자기 usage 도움말(수십 KB)을 화면에 그대로
// 흘리는 걸 막는다(실측: 지정 안 하면 git repo 밖에서 실행 시 이 텍스트가 그대로 새어나감).
function stagedFiles() {
  const out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out.split(/\r?\n/).filter(Boolean);
}

function allTrackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out.split(/\r?\n/).filter(Boolean);
}

const MAX_SCAN_BYTES = 2 * 1024 * 1024;

// 반환값은 항상 { findings, skipReason } — "findings가 비었다"와 "애초에 검사 못 했다"를 절대 섞지 않는다.
// (섞으면 "통과"라는 말이 "실제로 확인했더니 깨끗함"이 아니라 "확인을 못 했을 뿐"이 될 수 있어 오히려 위험)
function scanFile(path) {
  if (/(^|\/)\.env$/.test(path)) {
    return { findings: [{ line: 0, name: ".env 파일 자체를 커밋하려 함(내용과 무관하게 차단)" }], skipReason: null };
  }
  let st;
  try {
    st = statSync(path);
  } catch {
    return { findings: [], skipReason: "stat 실패(삭제됨/심볼릭 링크 깨짐 등)" };
  }
  if (!st.isFile()) return { findings: [], skipReason: null }; // 디렉터리 등 — 정상 스킵, 경고 불필요
  if (st.size > MAX_SCAN_BYTES) return { findings: [], skipReason: `${Math.round(st.size / 1024)}KB — 2MB 상한 초과` };
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    return { findings: [], skipReason: `읽기 실패(${e.code || e.message})` };
  }
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const p of PATTERNS) {
      if (p.re.test(line)) findings.push({ line: i + 1, name: p.name });
    }
  });
  return { findings, skipReason: null };
}

let files;
try {
  files = process.argv.includes("--all") ? allTrackedFiles() : stagedFiles();
} catch (e) {
  // git 저장소가 아니거나 git 명령 자체가 실패하는 경우 — 검사 대상을 못 정했으므로 "통과"라고
  // 말할 수 없다. 조용히 넘어가지 않고(fail-open 금지) 무슨 일이 있었는지만 짧게 알리고 막는다.
  console.error(`[보안 점검] git 명령 실행 실패 — 이 폴더가 git 저장소가 맞는지 확인하세요: ${e.message.split("\n")[0]}`);
  process.exit(1);
}

let hasFinding = false;
const skipped = [];
for (const f of files) {
  const { findings, skipReason } = scanFile(f);
  if (skipReason) skipped.push(`${f} (${skipReason})`);
  for (const fnd of findings) {
    hasFinding = true;
    // 실제 매칭된 값은 절대 출력하지 않는다(스캐너 자신이 시크릿을 로그에 남기면 안 됨)
    console.error(`[보안 점검] ${f}:${fnd.line} — "${fnd.name}"로 의심되는 패턴 발견`);
  }
}

if (hasFinding) {
  console.error("\n민감정보로 의심되는 내용이 있어 막았어요. 확인 후 제거하고 다시 커밋하세요.");
  console.error("정말 오탐이면(예: 문서 속 예시 값) 해당 줄의 표현을 바꿔 패턴을 피하세요.");
  process.exit(1);
}

if (skipped.length) {
  console.log(`[보안 점검] 참고: ${skipped.length}개 파일은 검사 못 하고 건너뜀(패턴 검사 자체가 안 된 것이지 "깨끗함"이 아님):`);
  for (const s of skipped) console.log(`  - ${s}`);
}
console.log(`[보안 점검] 통과 — 검사 대상 ${files.length}개 중 ${files.length - skipped.length}개 실제 검사, 의심 패턴 없음.`);
process.exit(0);
