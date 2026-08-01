// 실제 웹페이지 1건을 수집 도구로 노트화하는 end-to-end 시연 (실데이터)
// 흐름: (에이전트가 WebFetch로 원문 전체를 추출) → collect() 호출(text=원문 전체, summary=한 줄 요약) → 노트 생성
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
  text: `## 원문 내용 (실제 웹페이지에서 추출한 텍스트 · 2026-06-08 수집)

Notion API를 Model Context Protocol(MCP) 도구로 노출하는 공식 서버 저장소다. AI 에이전트가 Notion 페이지·데이터베이스·댓글에 프로그래밍 방식으로 접근할 수 있게 해준다.

**설치**: Notion 내부 integration 토큰이 필요하다(notion.so/profile/integrations에서 발급). Claude Desktop·Cursor 등 MCP 클라이언트 설정에 NOTION_TOKEN 환경변수로 등록한다.

**인증**: integration 토큰(ntn_**** 형식)을 NOTION_TOKEN 또는 OPENAPI_MCP_HEADERS 환경변수로 전달한다.

**Breaking Change(v2.0.0)**: 기존 database 중심 모델에서 "data source" 추상화로 전환됐다. database_id 인자가 data_source_id로 바뀌었으므로 기존 통합 코드는 마이그레이션이 필요하다.

**전송 방식**: 기본은 stdio, Streamable HTTP(bearer 인증)도 지원한다.

**주의사항**: Notion이 자체 OAuth 기반 remote MCP 서버(mcp.notion.com)를 제공하기 시작하면서, 이 로컬 오픈소스 저장소는 향후 유지보수가 줄거나 sunset될 가능성이 있다. 이슈 대응이 활발하지 않은 편이다.

> Wikimate 적용 메모: Phase 1b 노션 색인 후보. sunset 위험 때문에 remote MCP 병행 검토 필요.`,
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
