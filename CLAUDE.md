# CLAUDE.md

This file provides guidance to Claude Code and other tools when working with code in this repository.

## Project Status

**Phase 1 (MVP) complete** — all implementation tasks finished.

| Task | Status |
|------|--------|
| 1. Project Setup | Done |
| 2. Shared Types | Done |
| 3. Cache Module | Done |
| 4. Video Selector | Done |
| 5. Error Handling | Done |
| 6. Validation | Done |
| 7. API Client | Done |
| 8. Photo Search Tool | Done |
| 9. Video Search Tool | Done |
| 10. Get Details Tool | Done |
| 11. Entry Point | Done |
| 12. Final Verification | Done |

Design specification consolidated into `original-specs.md` (single source of truth).

## Dev Environment Notes

- **Vitest**: Locked to `^4.1.5`. The `Bus error (core dumped)` with v4 was machine-specific (laptop); v4.1.5 passes all tests on this desktop (Node v22, Debian 12).
- **`import type`**: Erased at runtime by vitest/esbuild — tests relying solely on `import type` will pass even when the module doesn't exist. Include a dynamic `import()` assertion to force runtime resolution.
- **vitest CLI**: Run via `./node_modules/.bin/vitest` or `npm test` — the `rtk` passthrough proxy breaks vitest's output parsing.
- **`@vitest/coverage-v8`**: Removed. Re-add if needed.

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

**Server instructions string** (passed to `McpServer` constructor — shown to the consuming agent at connection time):
> "This server provides access to the Pexels library of high-quality stock photos and videos. Every result includes mandatory photographer attribution — always display it. Each tool response contains two content blocks per result: (1) a text block with metadata and a markdown image link, and (2) an image block with a `url` field pointing to the medium-resolution thumbnail. If the image block does not render in your client, use the markdown image link in the text block. Pexels rate limit is 200 requests/hour; the server caches results to preserve quota."

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
1. A `type: "text"` block — Markdown with metadata, hardcoded attribution (`Photo by [Photographer] on Pexels`), and a markdown image link `![Preview](src.medium_url)` as fallback.
2. A `type: "image"` block — `{ type: 'image', url: src.medium_url }` type-asserted past SDK types (renders in Claude Desktop / Claude.ai). For videos, the selected `.mp4` link URL.

**Image content rationale (decided 2026-05-01):** The MCP SDK `ImageContent` only types `data`/`mimeType`, but modern clients support `url` for remote images. We use a hybrid: the `url` field on the image block renders visually; the same URL in the text block is the fallback. Base64-encoding was ruled out (5 extra fetches, ~1MB bloat per response). Full decision in `original-specs.md §3b`.

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

`PEXELS_API_KEY` must be set at runtime. Never hardcode it. For local dev, create a `.env` file and use the `start:dev` script, which loads it via Node's native `--env-file` flag (v20.6+). No `dotenv` package is needed or installed.

## tsconfig notes

Target `ES2022`, `module: NodeNext`, `outDir: build/`, `strict: true`. The built entry point must be invokable as `node build/index.js` — no bundler needed.
