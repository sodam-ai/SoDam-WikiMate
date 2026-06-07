// MCP 서버 end-to-end 스모크 테스트: SDK 클라이언트로 서버를 띄워 실제 프로토콜로 대화
// 사용: node scripts/smoke-server.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const transport = new StdioClientTransport({
  command: "node",
  args: [join(root, "mcp", "server.mjs")],
});
const client = new Client({ name: "smoke", version: "1.0.0" }, { capabilities: {} });

await client.connect(transport);
console.log("연결 ✅");

const tools = await client.listTools();
console.log("도구 목록:", tools.tools.map((t) => t.name));

const res = await client.callTool({
  name: "wikimate_collect",
  arguments: {
    title: "스모크_서버경유 테스트",
    text: "서버를 거쳐 호출되는지 검증",
    vault_path: join(root, "sandbox-vault"),
    dry_run: true,
  },
});
console.log("수집 도구 dry-run 응답:");
console.log(res.content?.[0]?.text);

await client.close();
console.log("종료 ✅");
