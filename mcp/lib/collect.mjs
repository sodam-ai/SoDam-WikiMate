// Wikimate MCP 코어 — 수집(collect) 핵심 로직 (순수 함수, MCP 없이도 테스트 가능)
// 안전 원칙: 외부 자료 text는 '데이터'로만 저장. 그 안의 지시문을 명령으로 해석하지 않음(인젝션 방어).

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";

// 중복 방지 키: 출처 + 내용을 합쳐 SHA-256 해시
export function sourceHash(origin = "", content = "") {
  return createHash("sha256").update(`${origin}\n${content}`).digest("hex");
}

// 파일명 안전화: 윈도우/옵시디언에서 금지되는 문자 제거
export function slugify(title) {
  const s = String(title ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80)
    .trim();
  return s || "untitled";
}

// 표준 frontmatter + 본문 머리말 생성
export function buildNoteHead({ title, type = "note", status = "inbox", project = "", source = "", summary = "", importance = 3, tags = [], hash = "", date }) {
  const tagList = (tags || []).map((t) => String(t)).join(", ");
  return [
    "---",
    `title: ${JSON.stringify(String(title ?? ""))}`,
    `type: ${type}`,
    `status: ${status}`,
    `project: ${JSON.stringify(String(project ?? ""))}`,
    `source: ${JSON.stringify(String(source ?? ""))}`,
    `summary: ${JSON.stringify(String(summary ?? ""))}`,
    `importance: ${Number(importance) || 3}`,
    `tags: [${tagList}]`,
    `source_hash: ${JSON.stringify(hash)}`,
    `notion_id: ""`,
    `created: ${date}`,
    `updated: ${date}`,
    "---",
    "",
    `# ${title}`,
    "",
    summary ? `> ${summary}` : "> (요약 없음)",
    "",
    "## 원문 내용",
    "",
  ].join("\n");
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

// 볼트 전체를 훑어 같은 source_hash가 있는지 확인 (.obsidian 설정 폴더는 절대 건드리지 않음)
async function* walkMd(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === ".obsidian") continue;
      yield* walkMd(p);
    } else if (e.name.toLowerCase().endsWith(".md")) {
      yield p;
    }
  }
}

export async function findDuplicate(vaultPath, hash) {
  if (!hash) return null;
  for await (const p of walkMd(vaultPath)) {
    const txt = await readFile(p, "utf8").catch(() => "");
    if (txt.includes("source_hash") && txt.includes(hash)) return p;
  }
  return null;
}

// 수집 메인. dryRun=true면 '계획만' 반환(쓰기 없음) — 안전 게이트의 '보고' 단계.
export async function collect({ vaultPath, title, url = "", text = "", project = "", summary = "", tags = [], importance = 3, dryRun = true, date }) {
  if (!vaultPath) throw new Error("vault_path 또는 OBSIDIAN_VAULT_PATH가 필요해요.");
  if (!title) throw new Error("title(노트 제목)이 필요해요.");

  const origin = url || "(직접 입력 텍스트)";
  const content = text || "";
  const hash = sourceHash(origin, content);
  const dup = await findDuplicate(vaultPath, hash);

  const slug = slugify(title);
  const targetDir = join(vaultPath, "00_Inbox");
  const targetPath = join(targetDir, `${slug}.md`);
  const head = buildNoteHead({ title, source: origin, summary, project, importance, tags, hash, date });

  const plan = {
    action: dup ? "skip-duplicate" : "create",
    target: targetPath,
    duplicate_of: dup,
    source_hash: hash,
    frontmatter_preview: head.split("\n").slice(0, 14).join("\n"),
  };

  // 1) dry-run: 계획만 보고
  if (dryRun) return { dry_run: true, ...plan };

  // 2) 중복이면 쓰지 않음
  if (dup) return { dry_run: false, written: false, reason: "duplicate", duplicate_of: dup, source_hash: hash };

  // 3) 실제 생성 (기존 파일 절대 덮어쓰지 않음)
  await mkdir(targetDir, { recursive: true });
  let finalPath = targetPath;
  if (await exists(finalPath)) finalPath = join(targetDir, `${slug}-${hash.slice(0, 6)}.md`);

  const body = head + (content ? content + "\n" : "(원문 내용 없음)\n");
  await writeFile(finalPath, body, "utf8");
  return { dry_run: false, written: true, path: finalPath, source_hash: hash };
}
