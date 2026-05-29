#!/usr/bin/env node
/**
 * CollectiveIQ MCP Server
 * Exposes Grok (and other LLMs) via the CollectiveIQ API as MCP tools.
 * Free hosting: Railway, Render, Fly.io, or run locally.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const API_BASE = "https://api.prod.collectiviq.ai";
const API_KEY = process.env.CIQ_API_KEY || "ciq_live_gpmadb2w9Sy8dymaQkTlUQzRufiYTvH0E7emhFrSR8RA";
const PORT = process.env.PORT || 3000;

// ── helpers ──────────────────────────────────────────────────────────────────

function headers(extra = {}) {
  return { Authorization: `Bearer ${API_KEY}`, ...extra };
}

async function ciqGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`CIQ ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function ciqPost(path, form) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: form,
  });
  if (!res.ok) throw new Error(`CIQ POST ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

function buildForm(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
  }
  return fd;
}

// ── MCP server factory (one per request for stateless HTTP) ──────────────────

function createServer() {
  const server = new McpServer({
    name: "collectiviq",
    version: "1.0.0",
    description: "Query Grok, GPT, Claude, Gemini & Llama via CollectiveIQ",
  });

  // ── Tool 1: ask_grok ────────────────────────────────────────────────────────
  server.tool(
    "ask_grok",
    "Send a prompt to Grok (xAI) via CollectiveIQ and get the response.",
    {
      prompt: z.string().describe("The message / question to send to Grok"),
      thread_id: z.string().optional().describe("Conversation thread ID (omit to start new)"),
      generate_combined: z.boolean().optional().default(false)
        .describe("Also return a combined summary across all LLMs"),
    },
    async ({ prompt, thread_id, generate_combined }) => {
      const form = buildForm({
        prompt,
        thread_id,
        selected_llms: "grok",
        generate_combined: generate_combined ? "true" : "false",
      });
      const data = await ciqPost("/process_message", form);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ── Tool 2: ask_llms ────────────────────────────────────────────────────────
  server.tool(
    "ask_llms",
    "Send a prompt to one or more LLMs in parallel via CollectiveIQ. Available: grok, claude, gpt, gemini, llama4",
    {
      prompt: z.string().describe("The message / question to send"),
      llms: z.string().describe(
        "Comma-separated list of LLMs: grok, claude, gpt, gemini, llama4"
      ).default("grok,claude,gpt"),
      thread_id: z.string().optional().describe("Conversation thread ID (omit to start new)"),
      generate_combined: z.boolean().optional().default(true)
        .describe("Return a combined synthesis of all responses"),
    },
    async ({ prompt, llms, thread_id, generate_combined }) => {
      const form = buildForm({
        prompt,
        thread_id,
        selected_llms: llms,
        generate_combined: generate_combined ? "true" : "false",
      });
      const data = await ciqPost("/process_message", form);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ── Tool 3: list_threads ────────────────────────────────────────────────────
  server.tool(
    "list_threads",
    "List all conversation threads in your CollectiveIQ account.",
    {},
    async () => {
      const data = await ciqGet("/get_threads");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ── Tool 4: list_api_keys ───────────────────────────────────────────────────
  server.tool(
    "list_api_keys",
    "List all API keys on the CollectiveIQ account (sanity check).",
    {},
    async () => {
      const data = await ciqGet("/api_keys");
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  // ── Tool 5: get_thread_messages ─────────────────────────────────────────────
  server.tool(
    "get_thread_messages",
    "Retrieve the full message history for a specific thread.",
    {
      thread_id: z.string().describe("The thread ID to fetch messages for"),
    },
    async ({ thread_id }) => {
      const data = await ciqGet(`/get_messages?thread_id=${encodeURIComponent(thread_id)}`);
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  return server;
}

// ── Express HTTP transport ────────────────────────────────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get("/", (_, res) => {
  res.json({
    name: "CollectiveIQ MCP Server",
    version: "1.0.0",
    status: "ok",
    tools: ["ask_grok", "ask_llms", "list_threads", "list_api_keys", "get_thread_messages"],
    mcp_endpoint: "/mcp",
  });
});

// MCP endpoint (stateless — new server instance per request)
app.all("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`\n✅ CollectiveIQ MCP Server running`);
  console.log(`   Local URL  : http://localhost:${PORT}/mcp`);
  console.log(`   Health     : http://localhost:${PORT}/`);
  console.log(`   API Key    : ${API_KEY.slice(0, 20)}...`);
  console.log(`\n   Tools exposed: ask_grok · ask_llms · list_threads · list_api_keys · get_thread_messages\n`);
});
