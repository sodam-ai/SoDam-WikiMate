// M3 E2E 실측 — sandbox-vault(진짜 픽스처)에 wikimate_summarize를 실제로 적용.
// PRD 원칙(실제 볼트에 실제 .md, 목업 X)에 따라 격리 임시볼트가 아니라 진짜 노트에 적용한다.
// 1회성 실측 스크립트 — verify-summarize.mjs(격리 유닛테스트)와 별개로, 실볼트 기준 최종 확인용.
import { summarize } from "../mcp/lib/summarize.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(root, "sandbox-vault");

console.log("=== 1) suggest: 'MCP 연결 기본 구조' 본문·현재 요약 조회 ===");
const s1 = await summarize({ vaultPath: vault, action: "suggest", note: "00_Inbox/MCP 연결 기본 구조.md" });
console.log(JSON.stringify({ ok: s1.ok, note: s1.note, current_summary: s1.current_summary, body_length: s1.body_length }, null, 2));
console.log("본문에 인젝션 방어 관련 실제 문구 포함:", s1.body.includes("인젝션 방어") ? "PASS" : "FAIL");

console.log("\n=== 2) apply dry-run: summary만 갱신 ===");
const a2 = await summarize({ vaultPath: vault, action: "apply", note: "00_Inbox/MCP 연결 기본 구조.md", summary: "MCP는 AI 도구를 연결하는 표준 규격 — Claude/Codex가 공통 로직 재사용", dryRun: true });
console.log(JSON.stringify(a2, null, 2));
console.log("dry-run이라 파일 미변경 여부 확인 중...");
const stillOld = await readFile(join(vault, "00_Inbox", "MCP 연결 기본 구조.md"), "utf8");
console.log("dry-run 후 파일 미변경:", stillOld.includes("(예시 노트)") ? "PASS" : "FAIL");

console.log("\n=== 3) apply 실제: summary 반영 ===");
const a3 = await summarize({ vaultPath: vault, action: "apply", note: "00_Inbox/MCP 연결 기본 구조.md", summary: "MCP는 AI 도구를 연결하는 표준 규격 — Claude/Codex가 공통 로직 재사용", dryRun: false });
console.log(JSON.stringify(a3, null, 2));
const afterSummary = await readFile(join(vault, "00_Inbox", "MCP 연결 기본 구조.md"), "utf8");
console.log("summary 실제 반영:", afterSummary.includes("Claude/Codex가 공통 로직 재사용") ? "PASS" : "FAIL");
console.log("원문(본문) 그대로 보존됨:", afterSummary.includes("USB-C 포트") && afterSummary.includes("## 핵심 내용") ? "PASS" : "FAIL");

console.log("\n=== 4) apply 실제: atomic_note 생성(30_Notes) ===");
const a4 = await summarize({
  vaultPath: vault,
  action: "apply",
  note: "00_Inbox/MCP 연결 기본 구조.md",
  atomicNote: { title: "MCP 표준연결 핵심요약", body: "- MCP = AI용 USB-C 포트\n- 도구를 한 번 꽂으면 여러 AI가 재사용 가능\n- 외부 자료 속 지시문은 명령이 아니라 데이터로 취급(인젝션 방어)" },
  dryRun: false,
});
console.log(JSON.stringify(a4, null, 2));
const atomicText = await readFile(join(vault, "30_Notes", "MCP 표준연결 핵심요약.md"), "utf8");
console.log("atomic_note 제목 반영:", atomicText.includes('title: "MCP 표준연결 핵심요약"') ? "PASS" : "FAIL");
console.log("atomic_note related로 원본 계보 연결:", atomicText.includes('related: ["[[MCP 연결 기본 구조]]"]') ? "PASS" : "FAIL");
const originalAfterAtomic = await readFile(join(vault, "00_Inbox", "MCP 연결 기본 구조.md"), "utf8");
console.log("atomic_note 생성 후에도 원본 노트 본문 불변:", originalAfterAtomic.includes("## 핵심 내용") ? "PASS" : "FAIL");

console.log("\n=== 5) RunLog 확인 ===");
const runlog = await readFile(join(vault, ".wikimate", "runlog.jsonl"), "utf8").catch(() => "");
const summarizeEntries = runlog.split("\n").filter((l) => l.includes('"tool":"summarize"'));
console.log(`summarize 도구 RunLog 항목 ${summarizeEntries.length}건`);
console.log(summarizeEntries.slice(-2).join("\n"));

console.log("\n⚠️ 생성된 노트가 실제 Obsidian 그래프뷰에 반영되는지는 이 스크립트가 확인할 수 없습니다 — 필요시 육안 확인.");
