// Wikimate MCP 코어 — 수집(collect) 로직
// 옵시디언 접근: notesmd-cli(공식 옵시디언 CLI) 자동 감지 → 사용. 없으면 파일시스템 폴백.
// 안전: 외부 자료 text는 '데이터'로만 저장(인젝션 방어). dry_run=true 기본(계획만 보고).

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

// 중복 방지 키
export function sourceHash(origin = "", content = "") {
  return createHash("sha256").update(`${origin}\n${content}`).digest("hex");
}

// notesmd-cli 실행파일 경로 해석 (scoop shim 우선)
function resolveNotesmd() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const scoop = home ? join(home, "scoop", "shims", "notesmd-cli.exe") : "";
  if (scoop && existsSync(scoop)) return scoop;
  return "notesmd-cli"; // PATH 의존 폴백
}

// notesmd-cli 사용 가능 여부
export async function hasNotesmdCli() {
  try {
    await execFileP(resolveNotesmd(), ["--version"], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

// 표준 노트 내용(frontmatter + 본문) 생성
export function buildNoteContent({ title, source = "", summary = "", importance = 3, tags = [], hash = "", date, body = "" }) {
  const tagList = (tags || []).map((t) => String(t)).join(", ");
  return [
    "---",
    `title: ${JSON.stringify(String(title))}`,
    "type: note",
    "status: inbox",
    `source: ${JSON.stringify(String(source))}`,
    `summary: ${JSON.stringify(String(summary))}`,
    `importance: ${Number(importance) || 3}`,
    `tags: [${tagList}]`,
    `source_hash: ${JSON.stringify(hash)}`,
    `created: ${date}`,
    `updated: ${date}`,
    "---",
    "",
    `# ${title}`,
    "",
    summary ? `> ${summary}` : "",
    "",
    "## 원문 내용",
    "",
    body || "(원문 내용 없음)",
  ].join("\n");
}

// vaultPath가 주어지면 그 폴더를 훑어 같은 source_hash가 있는지 확인
async function findDuplicate(vaultPath, hash) {
  if (!vaultPath || !hash) return null;
  async function* walk(dir) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (e.name === ".obsidian") continue; yield* walk(p); }
      else if (e.name.toLowerCase().endsWith(".md")) yield p;
    }
  }
  for await (const p of walk(vaultPath)) {
    const txt = await readFile(p, "utf8").catch(() => "");
    if (txt.includes("source_hash") && txt.includes(hash)) return p;
  }
  return null;
}

// 수집 메인.
//  vault     : notesmd-cli 볼트 '이름' (옵시디언에 등록된 이름) — CLI 사용 시
//  vaultPath : 볼트 폴더 절대경로 — 중복검사 + 파일시스템 폴백용
//  folder    : 볼트 내 하위폴더(선택, 예: '00_Inbox')
export async function collect({ vault, vaultPath, folder = "", title, url = "", text = "", summary = "", tags = [], importance = 3, dryRun = true, date }) {
  if (!title) throw new Error("title(노트 제목)이 필요해요.");
  if (!vault && !vaultPath) throw new Error("vault(볼트 이름) 또는 vault_path가 필요해요.");

  const origin = url || "(직접 입력 텍스트)";
  const content = text || "";
  const hash = sourceHash(origin, content);
  const cliAvailable = await hasNotesmdCli();
  const useCli = !!vault && cliAvailable;
  const noteName = folder ? `${folder}/${title}` : title;
  const noteBody = buildNoteContent({ title, source: origin, summary, importance, tags, hash, date, body: content });
  const dup = await findDuplicate(vaultPath, hash);

  const plan = {
    method: useCli ? "notesmd-cli (옵시디언 CLI)" : (vaultPath ? "filesystem (폴백)" : "none"),
    cli_available: cliAvailable,
    vault: vault || null,
    note: `${noteName}.md`,
    action: dup ? "skip-duplicate" : "create",
    duplicate_of: dup,
    source_hash: hash,
  };

  if (dryRun) return { dry_run: true, ...plan };
  if (dup) return { dry_run: false, written: false, reason: "duplicate", duplicate_of: dup, source_hash: hash };

  if (useCli) {
    try {
      const { stdout, stderr } = await execFileP(
        resolveNotesmd(),
        ["create", noteName, "--content", noteBody, "--vault", vault],
        { windowsHide: true, maxBuffer: 16 * 1024 * 1024 }
      );
      return { dry_run: false, written: true, method: "notesmd-cli", vault, note: `${noteName}.md`, source_hash: hash, cli_output: String(stdout || stderr || "").trim() };
    } catch (e) {
      return { dry_run: false, written: false, method: "notesmd-cli", error: String(e?.message || e), source_hash: hash };
    }
  }

  // 파일시스템 폴백
  const dir = join(vaultPath, folder || "");
  await mkdir(dir, { recursive: true });
  const fp = join(dir, `${title}.md`);
  await writeFile(fp, noteBody, "utf8");
  return { dry_run: false, written: true, method: "filesystem", path: fp, source_hash: hash };
}
