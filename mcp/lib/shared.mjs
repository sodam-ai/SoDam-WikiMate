// Wikimate MCP 코어 — 공유 헬퍼 (lint.mjs/fix.mjs에서 추출, 로직 불변)
// link.mjs(v0.8.0)가 새 도구를 만들며 기존 파서·가드를 재사용하기 위해 분리.

import { isAbsolute, resolve, relative, join, dirname, basename } from "node:path";
import { mkdir, copyFile, writeFile, rename, unlink } from "node:fs/promises";

// 시크릿처럼 생긴 값 패턴("키워드 언급"이 아니라 "실제 토큰 형식"만 매칭 — 오탐 최소화).
// scripts/security-scan.mjs(배포물 스캔)와 collect.mjs(수집 원문 advisory)가 공유해서 쓴다 —
// 두 곳에 따로 정의하면 한쪽만 고치고 잊어버려 패턴이 어긋나는 사고(이 프로젝트가 여러 번 겪은 유형)를 막기 위함.
export const SECRET_PATTERNS = [
  { name: "OpenAI/Anthropic 스타일 API 키", re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "GitHub 토큰", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: "Notion 토큰", re: /\b(secret|ntn)_[A-Za-z0-9]{32,}\b/ },
  { name: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Slack 토큰", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "개인키 블록", re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "일반 시크릿 할당(키=긴 값)", re: /\b(api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-/+=]{16,}["']/i },
];

// 옵시디언 볼트 7폴더 표준(02_DATA_MODEL.md:40-49). 원자노트·MOC는 NOTES.
export const FOLDERS = {
  INBOX: "00_Inbox",
  PROJECTS: "10_Projects",
  RESOURCES: "20_Resources",
  NOTES: "30_Notes",
  DRAFTS: "40_Drafts",
  TEMPLATES: "90_Templates",
  ARCHIVE: "99_Archive",
};

// title/summary/project 등은 buildNoteContent가 JSON.stringify로 써서(백슬래시·따옴표 안전 이스케이프) 저장한다.
// classify.mjs/summarize.mjs/link.mjs가 각자 따로 "따옴표만 벗기는" 버전을 갖고 있었는데(2026-08-20 감사로 발견),
// 그 방식은 이스케이프를 안 풀어서 값에 백슬래시가 있으면 재조회·멱등성 비교가 깨졌다(실측 확인: 재요청해도
// changed:false가 안 나옴). 여기 하나로 합쳐 JSON 문자열이면 제대로 파싱하고, 아닐 때만(과거 수동 작성 노트 등
// 하위호환) 기존의 단순 따옴표 제거로 폴백한다.
export function stripQuotes(v) {
  const s = String(v ?? "");
  if (/^".*"$/.test(s)) {
    try { return JSON.parse(s); } catch { /* 잘못된 JSON이면 아래 폴백 */ }
  }
  return s.replace(/^["']|["']$/g, "");
}

// --- lint.mjs에서 이동 (바이트 단위, 로직 불변) ---

// frontmatter(머리말) 파싱 — 간단 key: value (+ aliases 배열)
export function parseFrontmatter(text) {
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
export function parseAliases(val) {
  if (!val) return [];
  return val.replace(/^\[/, "").replace(/\]$/, "")
    .split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
    .map((s) => s.toLowerCase());
}

// 코드블록·인라인코드 제거 (그 안의 [[..]]는 실제 링크가 아니므로 오탐 방지)
export function stripCode(body) {
  return String(body).replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}
// 본문에서 노트 [[위키링크]] 대상 추출 — 임베드 ![[..]]·첨부파일(.png 등) 제외, 앵커 #·^·표시명 | 제거, 소문자
export function extractLinks(body) {
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

// --- fix.mjs에서 이동 (바이트 단위, 로직 불변) ---

// 볼트 내부 경로로 안전 해석. 실패 시 null.
//  - 절대경로·드라이브문자(C:)·UNC(\\server) 거부 → root를 무시하고 볼트 밖으로 새는 것 차단
//  - traversal(..) 차단
//  - 점(.)으로 시작하는 경로 조각 전부 거부 → .obsidian/.OBSIDIAN(대소문자 무관)·.wikimate·.git 등 보호
export function safeInside(root, relPath) {
  const p = String(relPath || "");
  if (!p || isAbsolute(p) || /^[a-zA-Z]:/.test(p) || /^[\\/]{2}/.test(p)) return null;
  const abs = resolve(root, p);
  const rel = relative(resolve(root), abs);
  if (rel === "" || rel.startsWith("..")) return null;
  if (rel.split(/[/\\]/).some((seg) => seg.startsWith("."))) return null;
  return abs;
}

// 원자적 쓰기: 같은 폴더에 임시파일로 먼저 쓰고 rename()으로 바꿔치기.
// rename은 같은 볼륨 안에서 파일시스템 차원에서 원자적이라, 다른 프로그램(옵시디언·클라우드 동기화)이
// "쓰다 만 반쪽 파일"을 절대 못 본다 — 항상 이전 완전한 내용이거나 새 완전한 내용만 보임.
// 대상이 다른 프로그램에 잠겨 rename이 실패하면(Windows에서 흔함) 임시파일을 지우고 에러를 던진다.
export async function writeFileAtomic(abs, content, encoding = "utf8") {
  const tmp = join(dirname(abs), `.${basename(abs)}.wikimate-tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  await writeFile(tmp, content, encoding);
  try {
    await rename(tmp, abs);
  } catch (e) {
    try { await unlink(tmp); } catch {}
    throw new Error(`파일 쓰기 실패(다른 프로그램이 파일을 사용 중일 수 있어요): ${e.message}`);
  }
}

// 수정 전 원본을 .wikimate/backups/<ts>/<상대경로>로 복사 → 되돌릴 수 있게
export async function backupFile(root, abs, ts) {
  const rel = relative(root, abs);
  const dest = join(root, ".wikimate", "backups", ts, rel);
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(abs, dest);
  return relative(root, dest);
}

// --- collect.mjs에서 이동 (바이트 단위, 로직 불변) ---

// 파일명 안전화 (경로 조작 방지: 경로 구분자·금지문자·제어문자 제거, '..' 무력화)
export function safeComponent(name) {
  const s = String(name ?? "")
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .replace(/\s+/g, " ")
    .trim();
  const sliced = s.slice(0, 120);
  // slice()는 UTF-16 코드유닛 단위라 이모지 등 서로게이트 쌍을 반으로 쪼갤 수 있다.
  // 잘린 끝이 짝 잃은 상위 서로게이트면 마저 잘라내 깨진 문자(U+FFFD)가 파일명에 안 남게 한다.
  const safe = /[\uD800-\uDBFF]$/.test(sliced) ? sliced.slice(0, -1) : sliced;
  return safe || "untitled";
}

// --- 신규 (v0.8.0 link 기능용) ---

// related: 필드처럼 "[[...]]"를 따옴표로 감싼 한 줄 배열 문자열에서 각 링크를 안전 추출.
// 쉼표로 split하지 않는다 — 노트 제목에 쉼표가 있어도([[My Note, Part 2]]) 깨지지 않게
// 따옴표로 감싼 "[[...]]" 조각 자체를 정규식으로 하나씩 뽑는다.
export function extractRelatedList(raw) {
  if (!raw) return [];
  const out = [];
  const re = /"(\[\[[^\]]+\]\])"/g;
  let m;
  while ((m = re.exec(raw)) !== null) out.push(m[1]);
  return out;
}

// [[...]] 문자열 배열 → frontmatter 한 줄 문자열로 직렬화.
// buildNoteContent(collect.mjs)가 title/source/summary에 쓰는 것과 동일한 JSON.stringify 인용 방식(이스케이프 안전, 스타일 일관).
export function serializeRelatedList(links) {
  return `related: [${links.map((l) => JSON.stringify(l)).join(", ")}]`;
}

// frontmatter 블록에서 "key: ..." 한 줄만 안전 치환(없으면 블록 끝에 새 줄 삽입).
// 본문·다른 필드는 바이트 단위로 보존(fix.mjs의 replace_link와 동일한 surgical 치환 원칙).
export function replaceFrontmatterLine(text, key, newLine) {
  const m = /^(﻿?)---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/.exec(text);
  if (!m) throw new Error("frontmatter를 찾을 수 없어요.");
  const [full, bom, inner, tailNl] = m;
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const keyRe = new RegExp(`^${key}:.*$`);
  const lines = inner.split(/\r?\n/);
  const idx = lines.findIndex((l) => keyRe.test(l));
  if (idx >= 0) lines[idx] = newLine; else lines.push(newLine);
  const rebuilt = `${bom}---${eol}${lines.join(eol)}${eol}---${tailNl}`;
  return text.slice(0, m.index) + rebuilt + text.slice(m.index + full.length);
}
