// Wikimate MCP 코어 — 수집(collect) 로직
// 옵시디언 접근: notesmd-cli(공식 옵시디언 CLI) 자동 감지 → 사용. 없으면 파일시스템 폴백.
// 안전: 외부 자료 text는 '데이터'로만 저장(인젝션 방어). dry_run=true 기본(계획만 보고).

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, relative, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendRunLog } from "./runlog.mjs";
import { safeComponent } from "./shared.mjs";

const execFileP = promisify(execFile);

// 원문 보존 advisory 임계값(차단 아님, 정보 제공용) — url은 있는데 text가 이보다 짧으면 저신뢰 경고, 이보다 크면 대용량 알림
const LOW_FIDELITY_TEXT_CHARS = 200;
const LARGE_TEXT_CHARS = 20000;

// 중복 방지 키
export function sourceHash(origin = "", content = "") {
  return createHash("sha256").update(`${origin}\n${content}`).digest("hex");
}

// 하위폴더 안전화: 경로 구분자로 쪼개 각 조각 안전화, '.'·'..' 제거
function safeFolder(folder) {
  return String(folder ?? "")
    .split(/[/\\]+/)
    .map((p) => p.trim())
    .filter((p) => p && p !== "." && p !== "..")
    .map(safeComponent)
    .join("/");
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

// 옵시디언 설정(obsidian.json) 위치 후보 (Win/Mac/Linux + 테스트용 OBSIDIAN_CONFIG_PATH 오버라이드)
function obsidianConfigCandidates() {
  const override = process.env.OBSIDIAN_CONFIG_PATH;
  if (override) return [override];
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const appdata = process.env.APPDATA || (home ? join(home, "AppData", "Roaming") : "");
  const c = [];
  if (appdata) c.push(join(appdata, "obsidian", "obsidian.json"));                                 // Windows
  if (home) c.push(join(home, "Library", "Application Support", "obsidian", "obsidian.json"));      // macOS
  if (home) c.push(join(home, ".config", "obsidian", "obsidian.json"));                             // Linux
  return c;
}

// 볼트 '이름'으로 실제 폴더 경로를 옵시디언 설정에서 찾는다 (중복검사용). 못 찾으면 null.
export function resolveVaultPath(vaultName) {
  if (!vaultName) return null;
  for (const cfg of obsidianConfigCandidates()) {
    if (!existsSync(cfg)) continue;
    try {
      const data = JSON.parse(readFileSync(cfg, "utf8"));
      const vaults = data && data.vaults ? Object.values(data.vaults) : [];
      for (const v of vaults) {
        if (v && typeof v.path === "string" && basename(v.path) === vaultName) return v.path;
      }
    } catch { /* 설정 파싱 실패는 무시 → 폴백 null */ }
  }
  return null;
}

// 옵시디언에 등록된 볼트 목록을 obsidian.json에서 읽어 '제안용'으로 돌려준다(읽기 전용).
// ★ 절대 throw 안 함 — 설정 없음/깨짐이면 { ok:false, vaults:[] } 반환(resolveVaultPath와 동일한 관용 규칙).
// ★ 고르지 않는다 — 후보만 제시(open:true 우선). 실제 쓰기는 호출자(스킬)가 사용자 확인 후 결정.
export function listVaults() {
  let config_path = null;
  let vaults = [];
  for (const cfg of obsidianConfigCandidates()) {
    if (!existsSync(cfg)) continue;
    try {
      const data = JSON.parse(readFileSync(cfg, "utf8"));
      const entries = data && data.vaults ? Object.values(data.vaults) : [];
      vaults = entries
        .filter((v) => v && typeof v.path === "string")
        .map((v) => ({ name: basename(v.path), path: v.path, open: !!v.open, exists: existsSync(v.path) }));
      config_path = cfg;
      break; // 첫 번째로 존재+파싱되는 설정만 사용(OS당 obsidian.json 1개 — resolveVaultPath와 동일 의미)
    } catch { /* 파싱 실패는 무시 → 다음 후보 */ }
  }
  if (!config_path) {
    return { ok: false, config_path: null, open_vault: null, ambiguous_names: [], vaults: [], reason: "obsidian.json을 못 찾았어요(옵시디언 미설치 또는 설정 경로가 비표준)." };
  }
  // 같은 이름(basename) 볼트가 둘 이상이면 모호 → 이름 대신 vault_path(전체경로)로 지정해야 함
  const counts = {};
  for (const v of vaults) counts[v.name] = (counts[v.name] || 0) + 1;
  const ambiguous_names = Object.keys(counts).filter((n) => counts[n] > 1);
  // open이 정확히 1개일 때만 신뢰(0개·2개 이상이면 stale/모호 → 강제 선택하도록 null)
  const opened = vaults.filter((v) => v.open);
  const open_vault = opened.length === 1 ? opened[0].name : null;
  // 정렬: open → exists → name (결정론적 — 테스트·표시 안정)
  vaults.sort((a, b) => (Number(b.open) - Number(a.open)) || (Number(b.exists) - Number(a.exists)) || a.name.localeCompare(b.name));
  return { ok: true, config_path, open_vault, ambiguous_names, vaults };
}

// 표준 노트 내용(frontmatter + 본문) 생성
export function buildNoteContent({ title, source = "", summary = "", importance = 3, tags = [], hash = "", date, body = "" }) {
  const tagList = (tags || []).map((t) => String(t)).join(", ");
  // 스키마 선언(1~5)을 server.mjs가 강제하지 않으므로 여기서 직접 검증한다(classify.mjs에서 실측으로 발견한
  // 같은 결함 클래스 — 이전엔 Number(importance)||3이라 NaN만 우연히 3으로 걸러지고 범위밖 숫자(예:999)는 그대로 통과했음).
  // 여기는 노트 신규 생성(선택 필드)이라 classify.apply처럼 거부하지 않고 안전값(3)으로 대체한다(생성 흐름 차단 방지).
  const impNum = Number(importance);
  const safeImportance = Number.isInteger(impNum) && impNum >= 1 && impNum <= 5 ? impNum : 3;
  return [
    "---",
    `title: ${JSON.stringify(String(title))}`,
    "type: note",
    "status: inbox",
    'project: ""',
    `source: ${JSON.stringify(String(source))}`,
    `summary: ${JSON.stringify(String(summary))}`,
    `importance: ${safeImportance}`,
    `tags: [${tagList}]`,
    "related: []",
    `source_hash: ${JSON.stringify(hash)}`,
    'notion_id: ""',
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

// 볼트 안의 모든 .md 파일 경로를 순회한다(.obsidian 설정 폴더 제외). collect/lint 공용.
export async function* walkVault(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name.startsWith(".")) continue; yield* walkVault(p); } // dot-dir(.obsidian/.wikimate/.git 등) 제외
    else if (e.name.toLowerCase().endsWith(".md")) yield p;
  }
}

// vaultPath가 주어지면 그 폴더를 훑어 같은 source_hash가 있는지 확인
async function findDuplicate(vaultPath, hash) {
  if (!vaultPath || !hash) return null;
  for await (const p of walkVault(vaultPath)) {
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
  // 원문 보존 advisory(정보 제공용, 차단 아님) — 사람이 dry-run 승인 전에 보고 판단
  const advisories = [];
  if (url && content.length < LOW_FIDELITY_TEXT_CHARS) {
    advisories.push(`저신뢰: url은 있는데 원문(text)이 ${content.length}자뿐이에요. 요약만 넣은 건 아닌지 확인하세요 — text에는 원문 전체를 넣어야 나중에 원본이 사라져도 정보가 보존돼요(summary는 별도 필드).`);
  }
  if (content.length > LARGE_TEXT_CHARS) {
    advisories.push(`대용량 원문: ${content.length}자예요. 자르지 않고 그대로 저장하지만, 볼트 용량이 신경 쓰이면 나중에 직접 정리하세요.`);
  }
  const hash = sourceHash(origin, content);
  const cliAvailable = await hasNotesmdCli();
  const useCli = !!vault && cliAvailable;
  const safeTitle = safeComponent(title);
  const cleanFolder = safeFolder(folder);
  const noteName = cleanFolder ? `${cleanFolder}/${safeTitle}` : safeTitle;
  const noteBody = buildNoteContent({ title, source: origin, summary, importance, tags, hash, date, body: content });
  // 중복 검사용 볼트 경로: 볼트 '이름'이 있으면 그 이름으로 찾은 실볼트를 '항상' 신뢰한다.
  // (넘어온 vault_path는 무시 — 리터럴 ${OBSIDIAN_VAULT_PATH}·원본 파일 폴더·빈값 등 부정확한 값에 안 흔들리게)
  // 이름이 없거나 못 찾을 때만, '실제 존재하는' vault_path로 폴백. 둘 다 없으면 null(중복 검사 생략·명시).
  const dedupPath = (vault && resolveVaultPath(vault)) || ((vaultPath && existsSync(vaultPath)) ? vaultPath : null);
  const dedupChecked = !!dedupPath;
  const dup = await findDuplicate(dedupPath, hash);

  const plan = {
    method: useCli ? "notesmd-cli (옵시디언 CLI)" : (vaultPath ? "filesystem (폴백)" : "none"),
    cli_available: cliAvailable,
    vault: vault || null,
    note: `${noteName}.md`,
    action: dup ? "skip-duplicate" : "create",
    duplicate_of: dup,
    duplicate_check: dedupChecked ? "done" : "skipped (볼트 경로를 못 찾아 중복 검사 못 함)",
    vault_path_used: dedupPath || null,
    source_hash: hash,
    text_length: content.length,
    advisories,
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
      await appendRunLog(dedupPath, { tool: "collect", action: "create", method: "notesmd-cli", request: title, changed: `${noteName}.md`, result: "ok", source_hash: hash });
      return { dry_run: false, written: true, method: "notesmd-cli", vault, note: `${noteName}.md`, duplicate_check: dedupChecked ? "done" : "skipped (볼트 경로 미해결)", source_hash: hash, cli_output: String(stdout || stderr || "").trim() };
    } catch (e) {
      await appendRunLog(dedupPath, { tool: "collect", action: "create", method: "notesmd-cli", request: title, result: "error", detail: String(e?.message || e), source_hash: hash });
      return { dry_run: false, written: false, method: "notesmd-cli", error: String(e?.message || e), source_hash: hash };
    }
  }

  // 파일시스템 폴백 (경로 조작 방지: 안전화 이름 + 볼트 내부 확인)
  const dir = join(vaultPath, cleanFolder);
  let fp = join(dir, `${safeTitle}.md`);
  if (relative(resolve(vaultPath), resolve(fp)).startsWith("..")) {
    throw new Error("경로 이탈 차단(볼트 밖 경로)");
  }
  await mkdir(dir, { recursive: true });
  // 안전 패치: 제목이 우연히 같은 '다른' 자료(source_hash 다름 → 위 dup 체크를 이미 통과)가 파일명을 선점했으면
  // 절대 덮어쓰지 않는다(fix.mjs archive·classify.mjs apply와 동일한 충돌-시-접미 패턴). 침묵 덮어쓰기 금지.
  let renamed = false;
  if (existsSync(fp)) {
    renamed = true;
    let i = 0;
    do {
      i += 1;
      fp = join(dir, `${safeTitle}_dup${i}.md`);
    } while (existsSync(fp));
  }
  await writeFile(fp, noteBody, "utf8");
  await appendRunLog(dedupPath || vaultPath, { tool: "collect", action: "create", method: "filesystem", request: title, changed: fp, result: "ok", source_hash: hash, detail: renamed ? "파일명 충돌 — 다른 자료가 같은 이름을 선점해 접미 부여(덮어쓰기 없음)" : undefined });
  return { dry_run: false, written: true, method: "filesystem", path: fp, source_hash: hash };
}
