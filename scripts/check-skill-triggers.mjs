// 스킬 트리거/Run Log 정합성 검사 (읽기 전용, 쓰기 없음)
//
// 이 프로젝트가 반복 겪은 결함 유형: "## 도구: wikimate_X" 절에 새 action(쓰기 동작)이 추가됐는데
// 바로 아래 "### 노션 Run Log" 절의 "범위" 서술이 그 action 이름을 언급하지 않아, 실제로는 쓰기를
// 했는데도 노션 Run Log 기록 대상에서 조용히 빠지는 것(안전 불변 조건 #6 "Run Log 매 변경 기록" 위반).
// 과거엔 사람이 grep으로 우연히 발견해왔다(2026-08-18 MOC 트리거, 2026-08-31 status/project 트리거,
// 2026-08-21(2) 노션 Run Log 배선 누락 등) — 이 스크립트는 같은 유형을 자동으로 매번 잡는다.
//
// 대상: skills/*/SKILL.md 중 "## 도구: wikimate_X" 절이 action:"..." 목록을 갖는 파일만(classify/link/
// summarize). organize(단일 도구, action 파라미터 없음)·lint(읽기전용, 자기 도구에 action 목록 없음)·
// query(읽기전용, Run Log 대상 자체가 없음)는 이 패턴이 애초에 적용되지 않아 자연히 스킵된다(오탐 아님).

import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(here, "..", "skills");

let pass = 0;
let fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };

const dirs = await readdir(skillsDir, { withFileTypes: true });
for (const d of dirs) {
  if (!d.isDirectory()) continue;
  const file = path.join(skillsDir, d.name, "SKILL.md");
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    continue;
  }

  // "## 도구:" 절 추출 (다음 "### 노션 Run Log" 전까지)
  const toolSecMatch = /## 도구:[\s\S]*?(?=### 노션 Run Log|\n## |$)/.exec(text);
  if (!toolSecMatch) continue; // 이 패턴이 없는 스킬(organize/lint/query)은 자연히 스킵
  const toolSec = toolSecMatch[0];

  // action:"x" 또는 action="x" 를 가진 불릿 줄 전체를 하나씩
  const actionLineRe = /^-\s+`action[:=]"?([a-zA-Z_]+)"?`.*$/gm;
  const writeActions = [];
  let m;
  while ((m = actionLineRe.exec(toolSec)) !== null) {
    const line = m[0];
    const name = m[1];
    const isReadOnly = /읽기\s*전용/.test(line);
    if (!isReadOnly) writeActions.push(name);
  }
  if (writeActions.length === 0) continue; // 쓰기 action이 없는 스킬(사실상 없음, 방어적 처리)

  const runLogMatch = /### 노션 Run Log[\s\S]*?(?=\n## |$)/.exec(text);
  const runLogSec = runLogMatch ? runLogMatch[0] : "";

  check(
    `${d.name}/SKILL.md — "### 노션 Run Log" 절 존재`,
    !!runLogMatch,
  );
  for (const a of writeActions) {
    check(
      `${d.name}/SKILL.md — 쓰기 action \`${a}\`이(가) Run Log 범위 서술에 포함됨`,
      runLogSec.includes(`\`${a}\``),
    );
  }
}

console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
process.exit(fail > 0 ? 1 : 0);
