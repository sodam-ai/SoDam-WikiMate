// Wikimate MCP 코어 — 안전 수정(fix) 로직. lint 진단 결과를 '사람 승인 후' 안전하게 고친다.
// 안전 원칙(척추):
//  - dry_run 기본(계획만 보고) — 실제 변경은 dry_run=false
//  - ★ 하드 삭제 안 함: unlink/rm을 import하지 않는다. 중복은 '삭제'가 아니라 99_Archive로 '이동'(되돌리기 쉬움)
//  - 비가역 치환(링크 수정)은 수정 전 .wikimate-backup으로 원본 백업
//  - 볼트 밖 경로·.obsidian 차단(경로 이탈 방지), 한 번에 한 노트만
//  - 노트 내용은 데이터로만(인젝션 방어) — 본문 속 지시문을 명령으로 실행하지 않음

import { readFile, writeFile, rename, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative, dirname, basename, isAbsolute } from "node:path";
import { resolveVaultPath, listVaults } from "./collect.mjs";
import { appendRunLog } from "./runlog.mjs";

// 정규식 메타문자 이스케이프(링크 대상에 특수문자가 와도 리터럴로)
function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function resolveRoot(vault, vaultPath) {
  return (vault && resolveVaultPath(vault)) || ((vaultPath && existsSync(vaultPath)) ? vaultPath : null);
}

// 볼트 내부 경로로 안전 해석. 실패 시 null.
//  - 절대경로·드라이브문자(C:)·UNC(\\server) 거부 → root를 무시하고 볼트 밖으로 새는 것 차단
//  - traversal(..) 차단
//  - 점(.)으로 시작하는 경로 조각 전부 거부 → .obsidian/.OBSIDIAN(대소문자 무관)·.wikimate·.git 등 보호
function safeInside(root, relPath) {
  const p = String(relPath || "");
  if (!p || isAbsolute(p) || /^[a-zA-Z]:/.test(p) || /^[\\/]{2}/.test(p)) return null;
  const abs = resolve(root, p);
  const rel = relative(resolve(root), abs);
  if (rel === "" || rel.startsWith("..")) return null;
  if (rel.split(/[/\\]/).some((seg) => seg.startsWith("."))) return null;
  return abs;
}

// 수정 전 원본을 .wikimate-backup/<ts>/<상대경로>로 복사 → 되돌릴 수 있게
async function backupFile(root, abs, ts) {
  const rel = relative(root, abs);
  const dest = join(root, ".wikimate", "backups", ts, rel);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(abs, dest);
  return relative(root, dest);
}

// 안전 수정 메인. action: "archive" | "replace_link"
export async function fix({ vault, vaultPath, action, note, from = "", to = "", dryRun = true, ts } = {}) {
  const root = resolveRoot(vault, vaultPath);
  if (!root) { const cand = listVaults(); return { ok: false, reason: "볼트 경로를 못 찾았어요. 아래 후보에서 vault(이름) 또는 vault_path를 골라주세요(현재 열린 볼트 우선).", open_vault: cand.open_vault, ambiguous_names: cand.ambiguous_names, vault_candidates: cand.vaults }; }
  if (!note) return { ok: false, reason: "대상 note(볼트 내 상대경로)가 필요해요." };
  const abs = safeInside(root, note);
  if (!abs) return { ok: false, reason: "볼트 밖 경로이거나 .obsidian이라 수정할 수 없어요(차단)." };
  if (!existsSync(abs)) return { ok: false, reason: `대상 노트가 없어요: ${note}` };
  const stamp = ts || new Date().toISOString().replace(/[:.]/g, "-");

  // 1) archive — 중복/불필요 노트를 '삭제 대신' 99_Archive로 이동(되돌리기 쉬움; Obsidian 링크는 basename 기준이라 유지됨)
  if (action === "archive") {
    const name = basename(abs);
    let destRel = join("99_Archive", name);
    let dest = join(root, destRel);
    // 이름 충돌 시 절대 덮어쓰지 않는다(데이터 손실 방지) — 빈 자리 찾을 때까지 접미 증가
    let i = 0;
    while (existsSync(dest)) { i += 1; destRel = join("99_Archive", `${stamp}_${i}_${name}`); dest = join(root, destRel); }
    if (dryRun) return { ok: true, dry_run: true, action, note, would_move_to: destRel, reversible: true, note_kept: "삭제 아님 — 이동만" };
    await mkdir(join(root, "99_Archive"), { recursive: true });
    await rename(abs, dest);
    await appendRunLog(root, { tool: "fix", action: "archive", request: note, changed: destRel, result: "ok", reversible: true });
    return { ok: true, dry_run: false, action, moved_from: note, moved_to: destRel, reversible: true };
  }

  // 2) replace_link — 한 노트 안에서 [[from]]을 [[to]]로 치환(to 비우면 제거). 수정 전 백업.
  if (action === "replace_link") {
    if (!from) return { ok: false, reason: "replace_link에는 from(바꿀 [[링크]] 대상)이 필요해요." };
    const text = await readFile(abs, "utf8");
    // [[from]], [[from|표시]], [[from#헤딩]], [[from^블록]], ![[from]] 모두 매칭. 대상만 교체(표시·앵커 보존), 임베드 '!'는 제거 시 함께 제거.
    const re = new RegExp(`(!?)\\[\\[${escapeRe(from)}((?:[#^|])[^\\]]*)?\\]\\]`, "g");
    const occurrences = (text.match(re) || []).length;
    const fromTok = `[[${from}]]`;
    const toTok = to ? `[[${to}]]` : "(제거)";
    if (occurrences === 0) return { ok: false, reason: `노트에 [[${from}]] 링크가 없어요.` };
    if (dryRun) return { ok: true, dry_run: true, action, note, from: fromTok, to: toTok, occurrences };
    const backup = await backupFile(root, abs, stamp);
    const next = text.replace(re, (_m, bang, suffix) => (to ? `${bang}[[${to}${suffix || ""}]]` : ""));
    await writeFile(abs, next, "utf8");
    await appendRunLog(root, { tool: "fix", action: "replace_link", request: note, changed: note, detail: `${fromTok} → ${toTok} ×${occurrences}`, backup, result: "ok" });
    return { ok: true, dry_run: false, action, note, replaced: occurrences, from: fromTok, to: toTok, backup };
  }

  return { ok: false, reason: `알 수 없는 action: ${action} (지원: archive | replace_link)` };
}
