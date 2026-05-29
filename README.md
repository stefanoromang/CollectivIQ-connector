# CollectiveIQ MCP Server

Exposes **Grok, GPT, Claude, Gemini & Llama** (via CollectiveIQ) as MCP tools
you can connect to Claude.ai or any MCP-compatible client.

## MCP Tools

| Tool | Description |
|------|-------------|
| `ask_grok` | Send a prompt specifically to Grok (xAI) |
| `ask_llms` | Query multiple LLMs in parallel (grok, claude, gpt, gemini, llama4) |
| `list_threads` | List all conversation threads |
| `list_api_keys` | Verify your API key is working |
| `get_thread_messages` | Fetch history for a thread |

---

## Deploy FREE on Railway (recommended, 5 min)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select your repo
4. Under **Variables**, add:
   ```
   CIQ_API_KEY = ciq_live_gpmadb2w9Sy8dymaQkTlUQzRufiYTvH0E7emhFrSR8RA
   ```
5. Railway gives you a public URL like `https://collectiviq-mcp-production.up.railway.app`
6. Your MCP endpoint is: `https://YOUR-APP.up.railway.app/mcp`

---

## Deploy FREE on Render

1. Push this folder to GitHub
2. Go to [render.com](https://render.com) → **New Web Service → Connect repo**
3. Build: `npm install` | Start: `node server.js`
4. Add env var `CIQ_API_KEY` in the dashboard
5. Your MCP endpoint: `https://YOUR-APP.onrender.com/mcp`

---

## Connect to Claude.ai

1. Go to **Claude.ai → Settings → Connectors → Add MCP Server**
2. Enter your deployed URL:
   ```
   https://YOUR-DEPLOYED-URL/mcp
   ```
3. Done! You'll see the CollectiveIQ tools appear in Claude.

---

## Run Locally

```bash
npm install
CIQ_API_KEY=your_key node server.js
# Server at http://localhost:3000/mcp
```

---

## Security Note

Rotate your API key at [collectiviq.ai](https://collectiviq.ai) after sharing publicly.
Store it as an environment variable, not hardcoded.
