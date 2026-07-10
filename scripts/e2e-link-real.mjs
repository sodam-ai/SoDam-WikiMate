// M1 E2E 실측 — sandbox-vault(진짜 픽스처)에 wikimate_link를 실제로 적용.
// PRD 원칙(실제 볼트에 실제 .md, 목업 X)에 따라 격리 임시볼트가 아니라 진짜 노트에 적용한다.
// 1회성 실측 스크립트 — Task #6 완료 후 결과를 CHECKPOINT.md/AUDIT.log에 기록하고 보존(재실행해도 멱등해야 정상).
import { link } from "../mcp/lib/link.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(root, "sandbox-vault");

console.log("=== 1) suggest: 'Notion MCP Server' (related 키 없음, 최초 제안) ===");
const s1 = await link({ vaultPath: vault, action: "suggest", note: "00_Inbox/Notion MCP Server.md" });
console.log(JSON.stringify(s1, null, 2));

console.log("\n=== 2) suggest: '검증_수집 도구 테스트' (본문에 인젝션 문구 있음) ===");
const s2 = await link({ vaultPath: vault, action: "suggest", note: "00_Inbox/검증_수집 도구 테스트.md" });
console.log(JSON.stringify(s2, null, 2));
console.log("인젝션 문구 없이 응답에 candidates만 있는지:", !JSON.stringify(s2).includes("지워라") ? "PASS(본문 미노출)" : "FAIL(본문 노출됨!)");

// "MCP 연결 기본 구조"는 s1.candidates 안에 있는 실제 노트 — 스킬이 판단했다고 가정하고 연결 실행
console.log("\n=== 3) add_links dry-run: Notion MCP Server → [[MCP 연결 기본 구조]] ===");
const a3 = await link({ vaultPath: vault, action: "add_links", note: "00_Inbox/Notion MCP Server.md", targets: ["MCP 연결 기본 구조"], dryRun: true });
console.log(JSON.stringify(a3, null, 2));

console.log("\n=== 4) add_links 실제 실행 ===");
const a4 = await link({ vaultPath: vault, action: "add_links", note: "00_Inbox/Notion MCP Server.md", targets: ["MCP 연결 기본 구조"], dryRun: false });
console.log(JSON.stringify(a4, null, 2));

console.log("\n=== 5) 파일 실제 반영 확인 ===");
const text5 = await readFile(join(vault, "00_Inbox", "Notion MCP Server.md"), "utf8");
console.log(text5.split("\n").slice(0, 14).join("\n"));
console.log("related 반영:", text5.includes(`related: ["[[MCP 연결 기본 구조]]"]`) ? "PASS" : "FAIL");

console.log("\n=== 6) 멱등성: 기존 클리크(MCP 연결 기본 구조 → 옵시디언 역할) 재연결 시도 ===");
const a6 = await link({ vaultPath: vault, action: "add_links", note: "00_Inbox/MCP 연결 기본 구조.md", targets: ["옵시디언 역할"], dryRun: false });
console.log(JSON.stringify(a6, null, 2));
console.log("이미 연결돼 있어 skipped_duplicate:", a6.skipped_duplicate === true ? "PASS" : "FAIL");

console.log("\n=== 7) RunLog 확인 ===");
const runlog = await readFile(join(vault, ".wikimate", "runlog.jsonl"), "utf8").catch(() => "");
const linkEntries = runlog.split("\n").filter((l) => l.includes('"tool":"link"'));
console.log(`link 도구 RunLog 항목 ${linkEntries.length}건`);
console.log(linkEntries.slice(-3).join("\n"));

console.log("\n⚠️ 그래프뷰/백링크 반영 여부는 이 스크립트가 확인할 수 없습니다 — 실제 Obsidian 앱에서 육안 확인이 필요합니다.");
