// 볼트 자동탐지(listVaults) 검증 — MCP/SDK 없이 node로 직접 (증거 기반)
// 사용: node scripts/verify-vaults.mjs
// 가짜 obsidian.json을 OBSIDIAN_CONFIG_PATH로 주입해 결정론적으로 검증한다(verify-collect와 동일 기법).
import { listVaults } from "../mcp/lib/collect.mjs";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const base = join(tmpdir(), `wikimate_vaults_${process.pid}`);
const cfgFile = join(base, "obsidian.json");
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };
const setCfg = async (obj) => { await writeFile(cfgFile, JSON.stringify(obj), "utf8"); process.env.OBSIDIAN_CONFIG_PATH = cfgFile; };

try {
  await mkdir(base, { recursive: true });
  const vaultA = join(base, "VaultA");    // 현재 열린 볼트
  const vaultB = join(base, "VaultB");
  const gone = join(base, "GoneVault");   // 일부러 안 만든다(폴더 없음)
  await mkdir(vaultA, { recursive: true });
  await mkdir(vaultB, { recursive: true });

  // 1) 볼트 2개(하나 open:true)
  await setCfg({ vaults: { id1: { path: vaultA, open: true }, id2: { path: vaultB } } });
  const r1 = listVaults();
  check("1) ok:true + 볼트 2개 나열", r1.ok === true && r1.vaults.length === 2);
  check("1) open_vault = 열린 볼트(VaultA)", r1.open_vault === "VaultA");
  check("1) 정렬: open 볼트가 맨 앞", r1.vaults[0]?.name === "VaultA" && r1.vaults[0]?.open === true);
  check("1) 두 볼트 모두 exists:true", r1.vaults.every((v) => v.exists === true));

  // 2) 폴더가 사라진 볼트 → exists:false 이되 목록 유지(드롭 안 함)
  await setCfg({ vaults: { id1: { path: vaultA, open: true }, idGone: { path: gone } } });
  const r2 = listVaults();
  const goneEntry = r2.vaults.find((v) => v.name === "GoneVault");
  check("2) 폴더 없는 볼트도 목록에 남음", !!goneEntry);
  check("2) 폴더 없는 볼트 exists:false", goneEntry?.exists === false);

  // 3) 같은 이름(basename) 볼트 둘 → ambiguous_names
  await setCfg({ vaults: { id1: { path: join(base, "x", "Same") }, id2: { path: join(base, "y", "Same") } } });
  const r3 = listVaults();
  check("3) 같은 이름 → ambiguous_names에 'Same'", r3.ambiguous_names.includes("Same"));

  // 3b) open이 2개면 → open_vault null(모호 → 강제 선택)
  await setCfg({ vaults: { id1: { path: vaultA, open: true }, id2: { path: vaultB, open: true } } });
  const r3b = listVaults();
  check("3b) open 2개면 open_vault=null", r3b.open_vault === null);

  // 4) config 파일 없음 → ok:false, vaults:[], throw 없음
  process.env.OBSIDIAN_CONFIG_PATH = join(base, "no-such-config.json");
  let threw4 = false, r4;
  try { r4 = listVaults(); } catch { threw4 = true; }
  check("4) config 없음: throw 안 함", threw4 === false);
  check("4) config 없음: ok:false + vaults 빈 배열", r4?.ok === false && r4?.vaults.length === 0);

  // 5) 깨진 JSON → ok:false, vaults:[], throw 없음
  await writeFile(cfgFile, "{ this is not valid json", "utf8");
  process.env.OBSIDIAN_CONFIG_PATH = cfgFile;
  let threw5 = false, r5;
  try { r5 = listVaults(); } catch { threw5 = true; }
  check("5) 깨진 JSON: throw 안 함", threw5 === false);
  check("5) 깨진 JSON: ok:false + vaults 빈 배열", r5?.ok === false && r5?.vaults.length === 0);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  delete process.env.OBSIDIAN_CONFIG_PATH;
  await rm(base, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
