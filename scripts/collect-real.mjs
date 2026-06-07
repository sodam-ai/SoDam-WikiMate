// 실제 웹페이지 1건을 수집 도구로 노트화하는 end-to-end 시연 (실데이터)
// 흐름: (에이전트가 WebFetch로 가져와 요약) → collect() 호출 → 노트 생성
import { collect } from "../mcp/lib/collect.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vault = join(root, "sandbox-vault");
const date = "2026-06-08";

const input = {
  vaultPath: vault,
  title: "Notion MCP Server",
  url: "https://github.com/makenotion/notion-mcp-server",
  summary: "Notion API용 공식 MCP 서버 — AI가 Notion 페이지·DB·댓글을 쿼리/조작",
  tags: ["MCP", "Notion-API", "AI-Integration", "TypeScript", "참고도구"],
  importance: 4,
  text: `## 핵심 내용 (실제 웹페이지 요약 · 2026-06-08 수집)

- **무엇**: Notion API를 MCP 도구로 노출하는 공식 서버. 페이지·DB·댓글 프로그래밍 접근.
- **설치**: Notion 내부 integration 토큰 필요(notion.so/profile/integrations). MCP 클라이언트(Claude Desktop·Cursor 등) 설정에 NOTION_TOKEN 환경변수로 등록.
- **인증**: integration 토큰(ntn_****). NOTION_TOKEN 또는 OPENAPI_MCP_HEADERS.
- **Breaking(v2.0.0)**: database 중심 → "data source" 추상화. database_id → data_source_id.
- **전송**: stdio(기본) 또는 Streamable HTTP(bearer).
- **⚠️ 주의**: Notion이 OAuth 기반 remote MCP 제공 → 이 로컬 저장소는 향후 sunset 가능, 이슈 지원 제한.

> Wikimate 적용 메모: Phase 1b 노션 색인 후보. sunset 위험 때문에 remote MCP 병행 검토.`,
  date,
};

console.log("=== 1) dry-run (계획만) ===");
console.log(await collect({ ...input, dryRun: true }));

console.log("\n=== 2) 실제 생성 ===");
const r = await collect({ ...input, dryRun: false });
console.log(r);

if (r.path) {
  console.log("\n=== 3) 생성된 노트 전문 ===");
  console.log(await readFile(r.path, "utf8"));
}
