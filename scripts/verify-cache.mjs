// 읽기 캐시(readFileCached) 검증 — MCP/SDK 없이 node로 직접 (증거 기반)
// 사용: node scripts/verify-cache.mjs
// 배경: v0.10.0 이후 추가된 캐시(mtime+size로 "다시 읽을지" 판단)에는 직접 시험하는 테스트가 하나도 없었고,
// 실측(2026-11-02)으로 "같은 글자 수의 내용을 거의 동시에 연달아 쓰면 낡은 값을 돌려주는" 결함이 확인됐다
// (쓰기 간격 0ms에서 150회 중 27회). 그래서 "방금 바뀐 파일은 캐시하지 않기"(Git의 racily-clean 방지와 같은 원리),
// ctime까지 확인, 읽기 실패("")는 캐시하지 않기를 넣었고, 이 스크립트가 그 안전장치와
// "오래된 파일은 여전히 캐시된다"(성능 이점 유지)를 함께 고정한다.
// 핵심 검증은 시간 운에 기대지 않도록 cacheEntryCount()(캐시에 저장됐는지)로 결정적으로 확인한다.
// 오래된 파일 검증에는 창(3초)이 지나길 한 번 기다린다(약 3.3초).
import { readFileCached, writeFileAtomic, cacheEntryCount } from "../mcp/lib/shared.mjs";
import { mkdir, writeFile, rm, utimes, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const base = join(tmpdir(), `wikimate_cache_${process.pid}`);
let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "PASS ✅" : "FAIL ❌"}  ${label}`); cond ? pass++ : fail++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowSecs = () => Math.floor(Date.now() / 1000); // 정수 초 → stat().mtimeMs와 소수점 오차 없이 일치

// 빠른 연속 쓰기 중 윈도우 백신 등이 rename을 잠깐 막는 경우(EPERM/EBUSY)를 테스트가 오탐하지 않도록 짧게 재시도
async function writeAtomicRetry(p, content) {
  for (let i = 0; ; i++) {
    try { return await writeFileAtomic(p, content); }
    catch (e) { if (i >= 5) throw e; await sleep(20); }
  }
}

try {
  await mkdir(base, { recursive: true });

  // --- 준비: "오래된 파일" 후보를 먼저 만들어 두고(창이 지나길 기다리는 동안 아래 즉시 검증을 돌린다) ---
  const agedA = join(base, "aged-a.md");
  const agedSize = join(base, "aged-size.md");
  const agedGone = join(base, "aged-gone.md");
  const agedDir = join(base, "aged-dir");
  await writeFile(agedA, "status: inbox\n", "utf8");
  await writeFile(agedSize, "short\n", "utf8");
  await writeFile(agedGone, "hello\n", "utf8");
  await mkdir(agedDir);
  const preparedAt = Date.now();

  // ========== 즉시 검증: "방금 바뀐 파일"은 캐시하지 않는다 ==========

  // 1) 방금 쓴 파일: 내용은 정확하고 캐시에는 저장되지 않는다
  const f1 = join(base, "racy.md");
  await writeFile(f1, "status: inbox\n", "utf8");
  const c1 = cacheEntryCount();
  const r1 = await readFileCached(f1);
  check("1) 방금 쓴 파일: 내용 정확", r1 === "status: inbox\n");
  check("1) 방금 쓴 파일: 캐시에 저장 안 함(낡은 값 위험 차단)", cacheEntryCount() === c1);

  // 2) 같은 크기 연속 덮어쓰기(실제 쓰기 함수): 낡은 값 0건 — 수정 전 코드에서는 이 반복에서 실제로 낡은 값이 나왔다
  const f2 = join(base, "racy2.md");
  let stale = 0;
  const N = 100;
  for (let i = 0; i < N; i++) {
    const want = i % 2 === 0 ? "status: inbox\n" : "status: draft\n"; // 둘 다 같은 길이
    await writeAtomicRetry(f2, want);
    if ((await readFileCached(f2)) !== want) stale++;
  }
  check(`2) 같은 크기 연속 덮어쓰기 ${N}회 → 낡은 값 0건 (실제: ${stale}건)`, stale === 0);

  // 3) 미래 mtime(시계가 어긋난 동기화 폴더 등): 저장하지 않고, 같은 mtime+size로 바꿔도 새 값
  const f3 = join(base, "future.md");
  const future = nowSecs() + 3600;
  await writeFile(f3, "status: inbox\n", "utf8");
  await utimes(f3, future, future);
  const c3 = cacheEntryCount();
  const r3a = await readFileCached(f3);
  await writeFile(f3, "status: draft\n", "utf8");
  await utimes(f3, future, future);
  const r3b = await readFileCached(f3);
  check("3) 미래 mtime: 캐시에 저장 안 함", cacheEntryCount() === c3);
  check("3) 미래 mtime: 같은 mtime+size로 바꿔도 새 내용", r3a === "status: inbox\n" && r3b === "status: draft\n");

  // 4) ctime 방어: mtime을 1시간 전으로 되돌리면서 같은 크기로 바꿔도(rsync -t 같은 도구) 낡은 값을 주지 않는다
  //    (파일을 방금 만들었으니 ctime은 지금 → "최근 변경"으로 판정돼 저장되지 않는다. mtime만 봤다면 옛 파일로 오인해 저장했을 것)
  const f4 = join(base, "mtime-reset.md");
  const old = nowSecs() - 3600;
  await writeFile(f4, "status: inbox\n", "utf8");
  await utimes(f4, old, old);
  const c4 = cacheEntryCount();
  const r4a = await readFileCached(f4);
  await writeFile(f4, "status: draft\n", "utf8");
  await utimes(f4, old, old);
  const r4b = await readFileCached(f4);
  check("4) mtime만 옛 값으로 되돌린 파일: 캐시에 저장 안 함(ctime으로 최근 변경 감지)", cacheEntryCount() === c4);
  check("4) mtime을 되돌리며 같은 크기로 바꿔도 새 내용", r4a === "status: inbox\n" && r4b === "status: draft\n");

  // 5) 처음부터 없는 파일: 빈 문자열, 캐시 불변
  const c5 = cacheEntryCount();
  const r5 = await readFileCached(join(base, "never-existed.md"));
  check("5) 없는 파일은 빈 문자열(throw 없음) + 캐시 불변", r5 === "" && cacheEntryCount() === c5);

  // ========== 창(3초)이 지나길 기다린 뒤: "오래된 파일"은 여전히 캐시된다 ==========
  const wait = 3300 - (Date.now() - preparedAt);
  if (wait > 0) await sleep(wait);

  // 6) 오래된 파일: 저장된다(성능 이점 유지의 직접 증거) + 재읽기도 같은 내용
  const c6 = cacheEntryCount();
  const r6a = await readFileCached(agedA);
  const stored = cacheEntryCount() === c6 + 1;
  const r6b = await readFileCached(agedA);
  check("6) 오래된 파일: 캐시에 저장됨(재스캔 이점 유지)", stored);
  check("6) 오래된 파일: 첫 읽기·재읽기 모두 정확, 항목 수 불변", r6a === "status: inbox\n" && r6b === "status: inbox\n" && cacheEntryCount() === c6 + 1);

  // 7) 캐시된 파일을 같은 크기로 수정: 새 내용 + 이전 항목도 제거(방금 수정됐으니 다시 저장하지 않음)
  await writeFile(agedA, "status: draft\n", "utf8");
  const r7 = await readFileCached(agedA);
  check("7) 캐시된 파일을 같은 크기로 수정 → 새 내용", r7 === "status: draft\n");
  check("7) 수정 후 이전 항목이 제거됨(낡은 값이 되살아날 틈 없음)", cacheEntryCount() === c6);

  // 8) 오래된 파일의 크기가 바뀌면 새 내용
  const r8a = await readFileCached(agedSize);
  await writeFile(agedSize, "a much longer content\n", "utf8");
  const r8b = await readFileCached(agedSize);
  check("8) 오래된 파일의 크기가 바뀌면 새 내용", r8a === "short\n" && r8b === "a much longer content\n");

  // 9) 삭제 → 빈 문자열 + 항목 제거, 같은 경로에 다시 만들면 새 내용
  const r9a = await readFileCached(agedGone);
  const c9 = cacheEntryCount();
  await unlink(agedGone);
  const r9b = await readFileCached(agedGone);
  const removed = cacheEntryCount() === c9 - 1;
  await writeFile(agedGone, "world\n", "utf8");
  const r9c = await readFileCached(agedGone);
  check("9) 삭제 전 읽기 정상", r9a === "hello\n");
  check("9) 삭제 후 빈 문자열(throw 없음) + 캐시 항목 제거", r9b === "" && removed);
  check("9) 같은 경로에 새로 만들면 새 내용(삭제 전 캐시가 되살아나지 않음)", r9c === "world\n");

  // 10) 읽기 실패(여기서는 폴더 경로 → EISDIR): 빈 문자열을 돌려주되 캐시에 저장하지 않는다
  //     (저장하면 잠금이 풀린 뒤에도 파일이 바뀌기 전까지 계속 빈 값이 나온다 — 리뷰에서 발견·재현된 기존 결함)
  const c10 = cacheEntryCount();
  const r10 = await readFileCached(agedDir);
  check("10) 읽기 실패: 빈 문자열(throw 없음)", r10 === "");
  check("10) 읽기 실패: 빈 값을 캐시에 저장하지 않음", cacheEntryCount() === c10);

  console.log(`\n=== 총계: PASS ${pass} / FAIL ${fail} ===`);
} finally {
  await rm(base, { recursive: true, force: true }).catch(() => {});
}
process.exit(fail === 0 ? 0 : 1);
