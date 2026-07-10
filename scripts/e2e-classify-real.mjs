// B(classify) E2E 실측 — sandbox-vault 실제 픽스처. 1회성 스크립트(e2e-link-real.mjs와 동일 목적).
import { classify } from "../mcp/lib/classify.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(root, "sandbox-vault");

console.log("=== 1) suggest: 'Notion MCP Server' (00_Inbox에 방치된 실제 노트) ===");
const s1 = await classify({ vaultPath: vault, action: "suggest", note: "00_Inbox/Notion MCP Server.md" });
console.log(JSON.stringify(s1, null, 2));

console.log("\n=== 2) apply 실제: 20_Resources로 이동 + 태그 보강 ===");
const a2 = await classify({ vaultPath: vault, action: "apply", note: "00_Inbox/Notion MCP Server.md", folder: "20_Resources", tags: ["참고도구"], dryRun: false });
console.log(JSON.stringify(a2, null, 2));

console.log("\n=== 3) 실제 이동 확인 ===");
console.log("원래 위치(00_Inbox) 파일 없음:", !existsSync(join(vault, "00_Inbox", "Notion MCP Server.md")) ? "PASS" : "FAIL");
console.log("새 위치(20_Resources) 파일 있음:", existsSync(join(vault, "20_Resources", "Notion MCP Server.md")) ? "PASS" : "FAIL");
const text = await readFile(join(vault, "20_Resources", "Notion MCP Server.md"), "utf8");
console.log(text.split("\n").slice(0, 12).join("\n"));
console.log("related: 필드(M1에서 추가된 링크) 보존:", text.includes("related:") ? "PASS" : "FAIL");
