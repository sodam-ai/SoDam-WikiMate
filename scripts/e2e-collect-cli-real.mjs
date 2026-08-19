// M(collect의 notesmd-cli 경로) E2E 실측 — 1회성 스크립트(다른 e2e-*-real.mjs와 동일 목적).
// collect.mjs는 notesmd-cli(공식 옵시디언 CLI)를 1순위로 시도하고 없을 때만 파일시스템으로 폴백하는데,
// 이 CLI 실행 경로는 이 프로젝트 역사상 자동 테스트에서 한 번도 exercise된 적이 없었다(2026-08-20 감사로 발견).
// notesmd-cli는 볼트를 '이름'으로만 찾기 때문에, 이 스크립트는 옵시디언의 진짜 설정 파일(obsidian.json)에
// 테스트 전용 임시 볼트를 등록했다가 — 성공하든 실패하든 — 반드시 정확히 원상복구한다(try/finally).
import { collect, hasNotesmdCli } from "../mcp/lib/collect.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const probeVaultDir = join(root, "sandbox-vault", "cli-probe-temp"); // sandbox-vault/ 전체가 .gitignore 대상이라 여기 두면 별도 조치 없이 추적 제외됨
const probeVaultName = "cli-probe-temp"; // resolveVaultPath는 basename(path)로 매칭 — 기존 6개 등록 볼트 중 이 이름은 없음(충돌 없음 확인됨)
const obsidianConfigPath = join(homedir(), "AppData", "Roaming", "obsidian", "obsidian.json");
const tempKey = "wikimate-e2e-cli-probe-temp";

if (!(await hasNotesmdCli())) {
  console.log("notesmd-cli가 이 컴퓨터에 없어요 — 이 테스트는 건너뜁니다(스킵, 실패 아님).");
  process.exit(0);
}
if (!existsSync(obsidianConfigPath)) {
  console.log("옵시디언 설정 파일을 못 찾았어요 — 이 테스트는 건너뜁니다(스킵, 실패 아님).");
  process.exit(0);
}

await mkdir(probeVaultDir, { recursive: true });

const originalConfigText = await readFile(obsidianConfigPath, "utf8");
let restored = false;
async function restoreConfig() {
  if (restored) return;
  await writeFile(obsidianConfigPath, originalConfigText, "utf8");
  restored = true;
}

let exitCode = 1;
try {
  const config = JSON.parse(originalConfigText);
  if (config.vaults[tempKey]) throw new Error("임시 키가 이미 존재해요 — 이전 실행이 정리 안 됐을 수 있어요. obsidian.json을 직접 확인해주세요.");
  config.vaults = { ...config.vaults, [tempKey]: { path: probeVaultDir, ts: 1755600000000 } };
  await writeFile(obsidianConfigPath, JSON.stringify(config), "utf8");

  const title = "CLI 경로 프로브";
  const url = "https://example.com/cli-probe";
  const text = "notesmd-cli 실제 실행 경로 최초 검증용 더미 텍스트.";
  const date = "2026-08-20";

  console.log("=== 1) dry-run: method가 notesmd-cli로 잡히는지 ===");
  const dry = await collect({ vault: probeVaultName, title, url, text, dryRun: true, date });
  console.log(JSON.stringify(dry, null, 2));
  const dryPass = dry.method === "notesmd-cli (옵시디언 CLI)" && dry.cli_available === true;
  console.log(dryPass ? "PASS: dry-run이 notesmd-cli 경로로 잡힘" : "FAIL: dry-run method 불일치");

  console.log("\n=== 2) 실제 생성: notesmd-cli가 진짜로 노트를 만드는지 ===");
  const real = await collect({ vault: probeVaultName, title, url, text, dryRun: false, date });
  console.log(JSON.stringify(real, null, 2));
  // 재실행 시 같은 title/url/text라 source_hash가 겹쳐 dedup이 정상적으로 재생성을 막을 수 있다(다른 e2e-*-real.mjs와
  // 동일한 특성 — DEVELOPMENT.md에 명시된 "영구 sandbox-vault라 재실행 시 이미 처리됨이 나올 수 있음"). 신규생성과
  // 정상적인 중복스킵 둘 다 "notesmd-cli 경로가 올바르게 처리했다"는 뜻이라 둘 다 PASS로 인정한다.
  const freshCreate = real.written === true && real.method === "notesmd-cli";
  const dedupSkip = real.written === false && real.reason === "duplicate";
  const realPass = freshCreate || dedupSkip;
  if (freshCreate) console.log("PASS: notesmd-cli 경로로 실제 생성 성공");
  else if (dedupSkip) console.log("PASS: 이전 실행 결과와 중복이라 dedup이 정상적으로 재생성을 막음(재실행 시 정상 동작)");
  else console.log("FAIL: 실제 생성도, 정상적인 중복 스킵도 아닌 예상 밖 결과");

  const notePath = join(probeVaultDir, `${title}.md`);
  const noteExists = existsSync(notePath);
  console.log(noteExists ? "PASS: 실제 파일이 폴더에 생성됨" : "FAIL: 파일이 안 보임");
  let contentOk = false;
  if (noteExists) {
    const savedText = await readFile(notePath, "utf8");
    contentOk = savedText.includes(text);
    console.log(contentOk ? "PASS: 노트 내용이 정확히 반영됨" : "FAIL: 노트 내용 불일치");
  }

  console.log("\n=== 3) 에러 경로: 존재하지 않는 볼트 이름 — 조용히 무시하지 않고 명확히 실패하는지 ===");
  const errCase = await collect({ vault: "존재하지않는볼트-cli-probe-XYZ", title: "실패해야정상", url: "u", text: "x", dryRun: false, date });
  console.log(JSON.stringify(errCase, null, 2));
  const errPass = errCase.written === false && errCase.method === "notesmd-cli" && !!errCase.error;
  console.log(errPass ? "PASS: 잘못된 볼트 이름은 명확한 에러로 실패 처리됨" : "FAIL: 에러 처리 이상함");

  exitCode = dryPass && realPass && noteExists && contentOk && errPass ? 0 : 1;
} catch (e) {
  console.log("예외 발생:", e.message);
  exitCode = 1;
} finally {
  await restoreConfig();
  const after = await readFile(obsidianConfigPath, "utf8");
  const restoreOk = after === originalConfigText;
  console.log(restoreOk ? "PASS: obsidian.json 원상복구 확인됨" : "FAIL: obsidian.json 복구 실패 — 수동 확인 필요!");
  if (!restoreOk) exitCode = 1;
}

process.exit(exitCode);
