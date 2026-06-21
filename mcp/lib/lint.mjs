// Wikimate MCP 코어 — 건강검진(lint) 로직 (★읽기 전용)
// 볼트를 한 번 스캔해 구조적 문제(중복·깨진 링크·고아·frontmatter 누락)를 '보고만' 한다.
// ★ 쓰기 경로 0: writeFile/mkdir/rm/execFile을 import하지도, 호출하지도 않는다. 순수 진단.
// 노트 본문은 '데이터'로만 읽으며, 그 안의 지시문을 명령으로 실행하지 않는다(인젝션 방어).
// 노션 끊긴 색인 점검은 여기서 안 한다(무의존 서버는 노션 접근 불가) → 스킬 레이어에서 basenames로 대조.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, relative } from "node:path";
import { walkVault, resolveVaultPath, listVaults } from "./collect.mjs";

// 며칠 이내 생성된 노트는 '아직 정리 전'으로 보고 고아 경보에서 제외(노이즈 방지)
const RECENT_DAYS = 7;

// frontmatter(머리말) 파싱 — 간단 key: value (+ aliases 배열)
function parseFrontmatter(text) {
  // 시작 --- 과 '자기 줄의' 닫는 --- 사이만 frontmatter. 본문 속 --- (수평선)에 안 속아야 함. CRLF·BOM 허용.
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { fm: null, body: text };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].trim();
  }
  return { fm, body: text.slice(m[0].length) };
}

// aliases: [a, b] → 소문자 배열
function parseAliases(val) {
  if (!val) return [];
  return val.replace(/^\[/, "").replace(/\]$/, "")
    .split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    .map((s) => s.toLowerCase());
}

// 코드블록·인라인코드 제거 (그 안의 [[..]]는 실제 링크가 아니므로 오탐 방지)
function stripCode(body) {
  return String(body).replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}
// 본문에서 노트 [[위키링크]] 대상 추출 — 임베드 ![[..]]·첨부파일(.png 등) 제외, 앵커 #·^·표시명 | 제거, 소문자
function extractLinks(body) {
  const out = [];
  const re = /(!?)\[\[([^\]]+)\]\]/g;
  const text = stripCode(body);
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1] === "!") continue; // 임베드(![[...]])는 노트 링크 아님
    const t = m[2].split("|")[0].split("#")[0].split("^")[0].trim().replace(/\.md$/i, "");
    if (!t) continue;
    if (/\.[a-zA-Z0-9]{1,5}$/.test(t)) continue; // 첨부파일(.png/.pdf 등)은 노트 링크 아님
    out.push(t.toLowerCase());
  }
  return out;
}

function daysSince(dateStr, now) {
  const d = Date.parse(dateStr);
  if (Number.isNaN(d)) return Infinity;
  return (now - d) / (1000 * 60 * 60 * 24);
}

// 건강검진 메인 (읽기 전용)
export async function lint({ vault, vaultPath, now } = {}) {
  // 볼트 해석: 이름 우선(resolveVaultPath), 폴백은 '실존하는' vault_path. collect와 동일 기준.
  const root = (vault && resolveVaultPath(vault)) || ((vaultPath && existsSync(vaultPath)) ? vaultPath : null);
  if (!root) {
    const cand = listVaults();
    return { ok: false, reason: "볼트 경로를 못 찾았어요. 아래 후보에서 vault(이름) 또는 vault_path를 골라주세요(현재 열린 볼트 우선).", vault: vault || null, vault_path: vaultPath || null, open_vault: cand.open_vault, ambiguous_names: cand.ambiguous_names, vault_candidates: cand.vaults };
  }
  const today = typeof now === "number" ? now : Date.now();

  // 1) 전 노트 수집
  const notes = [];
  for await (const p of walkVault(root)) {
    const text = await readFile(p, "utf8").catch(() => "");
    const { fm, body } = parseFrontmatter(text);
    const base = basename(p).replace(/\.md$/i, "");
    const rel = relative(root, p);
    notes.push({
      rel,
      base,
      baseLower: base.toLowerCase(),
      folder: rel.split(/[/\\]/).length > 1 ? rel.split(/[/\\]/)[0] : "",
      fm: fm || {},
      hasFm: !!fm,
      sourceHash: fm && fm.source_hash ? String(fm.source_hash).replace(/^["']|["']$/g, "") : "",
      aliases: parseAliases(fm && fm.aliases),
      links: extractLinks(body),
      created: fm && fm.created ? fm.created : "",
    });
  }

  // 이름·alias 집합(깨진 링크 판정용) + 링크 대상 집합(고아 판정용)
  const known = new Set();
  const targeted = new Set();
  for (const n of notes) {
    known.add(n.baseLower);
    for (const a of n.aliases) known.add(a);
  }
  for (const n of notes) for (const t of n.links) targeted.add(t);

  // 2) 중복(source_hash가 같은 노트 2개 이상)
  const byHash = new Map();
  for (const n of notes) {
    if (!n.sourceHash) continue;
    if (!byHash.has(n.sourceHash)) byHash.set(n.sourceHash, []);
    byHash.get(n.sourceHash).push(n.rel);
  }
  const duplicates = [...byHash.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([source_hash, files]) => ({ source_hash, files }));

  // 3) 깨진 링크([[대상]]인데 볼트에 대상 노트/별칭 없음) — 확신분만(소문자 basename 매칭)
  const broken = [];
  for (const n of notes) {
    for (const t of n.links) {
      if (!known.has(t)) broken.push({ from: n.rel, target: t });
    }
  }

  // 4) 고아 노트(나가는 링크 0 && 들어오는 링크 0). Inbox·템플릿·최근 생성은 정상 분류(경보 제외)
  const orphans = [];
  for (const n of notes) {
    const hasIncoming = targeted.has(n.baseLower) || n.aliases.some((a) => targeted.has(a));
    if (n.links.length === 0 && !hasIncoming) {
      const dAge = n.created ? daysSince(n.created, today) : 0;
      const recent = !Number.isFinite(dAge) || dAge <= RECENT_DAYS; // created 없음/파싱불가 → 최근으로 간주(갓 만든 노트 오탐 방지)
      const benign = ["00_Inbox", "90_Templates", "99_Archive"].includes(n.folder) || recent;
      if (!benign) orphans.push({ note: n.rel });
    }
  }

  // 5) frontmatter 누락/깨짐(필수 키 title·source_hash·created)
  const malformed = [];
  for (const n of notes) {
    if (!n.hasFm) { malformed.push({ note: n.rel, missing: "frontmatter 전체" }); continue; }
    const miss = [];
    if (!n.fm.title) miss.push("title");
    if (!n.sourceHash) miss.push("source_hash");
    if (!n.created) miss.push("created");
    if (miss.length) malformed.push({ note: n.rel, missing: miss.join(", ") });
  }

  return {
    ok: true,
    vault_path_used: root,
    scanned: notes.length,
    duplicates,
    broken_links: broken,
    orphans,
    malformed,
    notion_checked: false, // 노션 끊긴 색인 점검은 스킬 레이어(노션 도구)에서 basenames로 수행
    basenames: notes.map((n) => n.base), // 스킬의 노션 색인 대조용
    summary: {
      duplicates: duplicates.length,
      broken_links: broken.length,
      orphans: orphans.length,
      malformed: malformed.length,
    },
  };
}
