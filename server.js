import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "collectiviq-connector",
  version: "1.0.0",
});

const CIQ_TOKEN = "ciq_live_gpmadb2w9Sy8dymaQkTlUQzRufiYTvH0E7emhFrSR8RA";

server.tool(
  "ask_ciq",
  "Ask Collective IQ (multi-AI consensus engine). Sends your question to multiple top LLMs in parallel and returns a combined smart summary.",
  {
    prompt: z.string().describe("The full question or prompt you want to ask Collective IQ"),
  },
  async ({ prompt }) => {
    try {
      const form = new URLSearchParams();
      form.append("prompt", prompt);
      form.append("generate_combined", "true");

      const res = await fetch("https://api.prod.collectiviq.ai/process_message", {
        method: "POST",
        headers: { "Authorization": `Bearer ${CIQ_TOKEN}` },
        body: form,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const text = await res.text();

      return {
        content: [{ type: "text", text: text || "No response from Collective IQ" }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
      };
    }
  }
);

// Health check (for Render)
app.get("/health", (req, res) => res.json({ status: "ok" }));

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

await server.connect(transport);

const mcpHandler = async (req, res) => {
  await transport.handleRequest(req, res, req.body);
};

// Support both root and /mcp
app.post("/", mcpHandler);
app.get("/", mcpHandler);
app.post("/mcp", mcpHandler);
app.get("/mcp", mcpHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Collective IQ MCP server running on port ${PORT}`);
});
