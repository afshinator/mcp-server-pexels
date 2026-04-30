# CLAUDE.md

This file provides guidance to Claude Code and other tools when working with code in this repository.

## Project Status

This is a **pre-implementation** TypeScript MCP server. The full specification lives in `SPEC.md` and `README.md`. No source files exist yet — implementation starts here.

Design specification consolidated into `original-specs.md` (single source of truth).

## MCP Best Practices (Researched 2026-04-30)

**CLI & Configuration:**
- No custom CLI flags — stdio MCP servers are spawned as child processes by MCP clients
- Configuration via MCP client config files (`.mcp.json`, `claude_desktop_config.json`)
- All logging via `console.error()` only — stdout is reserved for JSON-RPC messages
- API keys passed via `env` field in config, never in `args`

**Server Capabilities:**
- Initialize with metadata + instructions for the LLM
- Use `registerTool()` (MCP v2 SDK), not deprecated `tool()` method
- Tool annotations: `readOnlyHint: true`, `idempotentHint: true` for read-only tools
- Return `CallToolResult` with proper `content` array and `isError: true` for failures
- Input schemas must be wrapped in `z.object()` (Zod v4)

**Response Format:**
- Success: Array of content blocks (`{type: 'text'}`, `{type: 'image'}`)
- Error: `{type: 'text', text: '...'}` with `isError: true`
- Image blocks use `url` (remote) field for MCP compliance

## Commands

```bash
npm install                         # install dependencies
npm run build                       # compile TypeScript → build/
npm run dev                         # watch mode (tsc --watch)
npm run inspector                   # launch MCP Inspector for manual testing
npm test                            # run vitest
npm test -- --run <file>            # run a single test file
npx @modelcontextprotocol/inspector # ad-hoc inspector without npm script
```

## Architecture

**Transport:** Stdio JSON-RPC (no HTTP server). The entry point (`src/index.ts`) creates an `McpServer` instance with metadata and instructions, registers tools, then connects via `StdioServerTransport`.

**Project Structure:** Modular by tool with pure functions for testability:
- `src/index.ts` — entry point, McpServer setup
- `src/tools/photo-search.ts` — `pexels_search_photos` tool
- `src/tools/video-search.ts` — `pexels_search_videos` tool
- `src/tools/get-details.ts` — `pexels_get_details` tool
- `src/shared/cache.ts` — pure cache functions (get, set, makeKey)
- `src/shared/api-client.ts` — pure API call functions
- `src/shared/errors.ts` — pure error handling (parseRateLimit, formatError)
- `src/shared/types.ts` — shared TypeScript types
- `src/shared/video-selector.ts` — pure video selection logic
- `src/utils/validation.ts` — Zod schemas and validation helpers

**Tool namespace:** All tools are prefixed `pexels_`. Three tools total:
- `pexels_search_photos` — calls `GET /v1/search`, returns 3–5 results
- `pexels_search_videos` — calls `GET /videos/search`, applies HD resolution filter
- `pexels_get_details` — calls `GET /v1/photos/:id` or `/videos/videos/:id`

**Tool Registration (MCP v2 SDK):**
```typescript
server.registerTool('pexels_search_photos', {
  title: 'Search Pexels Photos',
  description: '...',
  inputSchema: photoSearchSchema, // z.object()
  annotations: { readOnlyHint: true, idempotentHint: true }
}, async (args) => { ... });
```

**Caching:** `node-cache` wraps every outbound Pexels fetch. Cache keys are derived from the full serialized parameter set. TTLs: 10 min for searches, 60 min for ID lookups. All search tools expose a `force_refresh: boolean` parameter to bypass the cache.

**Response shape:** Every tool call returns a `CallToolResult` with `content` array:
1. A `type: "text"` block — Markdown with metadata and hardcoded attribution (`Photo by [Photographer] on Pexels`).
2. A `type: "image"` block — `src.medium` URL for photos, or the selected `.mp4` URL for videos (using `url` field for remote images).

**Video selection logic:** Pure function `chooseBestVideo(files)` — iterate `video_files`, filter to `.mp4` only, prefer `quality === "hd"`, then pick the file whose width is closest to 1920.

**Error handling:**
- HTTP 429 → return `{content: [{type: 'text', text: 'Pexels rate limit reached. Resume at [time].'}], isError: true}`
- HTTP 400 → queries are URL-encoded and truncated to 100 chars before dispatch (via Zod `.max(100)` + `.trim()`).

## Key Dependencies

| Package | Role |
|---|---|
| `@modelcontextprotocol/sdk` | MCP server framework |
| `zod` | Input validation on all tool parameters |
| `node-cache` | In-memory TTL cache |
| `vitest` + `msw` | Test runner + API mock layer |

## Environment

`PEXELS_API_KEY` must be set at runtime. Never hardcode it. For local dev, use a `.env` file loaded via `dotenv` (dev-only dependency).

## tsconfig notes

Target `ES2022`, `module: NodeNext`, `outDir: build/`, `strict: true`. The built entry point must be invokable as `node build/index.js` — no bundler needed.
