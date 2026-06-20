// Wikimate MCP 코어 — Run Log(작업 안전 로그). PRD 안전 게이트 step 4 "실행 후 Run Log 기록(요청·변경 노트·승인 여부)".
// 실제 쓰기(노트 생성/이동/링크수정)가 일어날 때마다 1줄씩 .wikimate/runlog.jsonl에 append 한다.
// 원칙:
//  - best-effort: 로그 실패가 본 작업을 깨면 안 된다 → 절대 throw 하지 않는다(graceful, PRD §5).
//  - 숨김 폴더(.wikimate)에 저장 → walkVault가 dot-dir를 건너뛰므로 lint/dedup가 절대 스캔하지 않는다.
//  - 읽기 전용 조회(readRunLog)로 "AI가 내 볼트에 뭘 했는지" 되돌아볼 수 있다(NotionRunLog의 로컬 대응).

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

function logPath(root) { return join(root, ".wikimate", "runlog.jsonl"); }

// 작업 1건 기록(요청·변경 노트·결과 등). ★ 절대 throw 안 함.
export async function appendRunLog(root, entry = {}) {
  if (!root) return;
  try {
    await mkdir(join(root, ".wikimate"), { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
    await appendFile(logPath(root), line, "utf8");
  } catch { /* 로그 실패는 조용히 무시 — 본 작업 보호 */ }
}

// 최근 N건 읽기(읽기 전용). 파일 없으면 빈 배열.
export async function readRunLog(root, limit = 20) {
  if (!root) return [];
  try {
    const txt = await readFile(logPath(root), "utf8");
    const lines = txt.split(/\r?\n/).filter(Boolean);
    return lines.slice(-Math.max(1, limit)).map((l) => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  } catch { return []; }
}
