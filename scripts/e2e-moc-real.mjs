// M2 E2E 실측 — sandbox-vault(진짜 픽스처)에 wikimate_link의 build_moc을 실제로 적용.
// 1회성 실측 스크립트(e2e-link-real.mjs와 동일한 목적).
import { link } from "../mcp/lib/link.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(root, "sandbox-vault");

console.log("=== 1) build_moc 신규: 'Wikimate 개발' 주제로 Notion MCP Server + MCP 연결 기본 구조 묶기 ===");
const m1 = await link({ vaultPath: vault, action: "build_moc", topic: "Wikimate 개발", targets: ["Notion MCP Server", "MCP 연결 기본 구조"], dryRun: false });
console.log(JSON.stringify(m1, null, 2));

console.log("\n=== 2) 생성된 파일 확인 ===");
const mocText = await readFile(join(vault, "30_Notes", "MOC_Wikimate 개발.md"), "utf8");
console.log(mocText);

console.log("\n=== 3) 기존 레거시 MOC('MOC_AI 작업실 기초.md', 헤딩이 '## 묶인 노트 (members)'로 다름)에 실행 시 동작 확인 ===");
const before = await readFile(join(vault, "30_Notes", "MOC_AI 작업실 기초.md"), "utf8");
console.log("--- 실행 전 ---\n" + before);
const m3 = await link({ vaultPath: vault, action: "build_moc", topic: "AI 작업실 기초", targets: ["검증_수집 도구 테스트"], dryRun: false });
console.log(JSON.stringify(m3, null, 2));
const after = await readFile(join(vault, "30_Notes", "MOC_AI 작업실 기초.md"), "utf8");
console.log("--- 실행 후 ---\n" + after);
console.log("기존 '## 왜 MOC가 필요한가' 섹션 보존:", after.includes("## 왜 MOC가 필요한가") ? "PASS" : "FAIL");
console.log("기존 '## 묶인 노트 (members)' 섹션도 그대로 있는지(파괴 안 됨):", after.includes("## 묶인 노트 (members)") ? "PASS" : "FAIL");
