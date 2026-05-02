# mcp-server-pexels

An MCP server for Pexels stock photo and video search.  Optimized for LLMs.

[Pexels](https://www.pexels.com/api/) provides free stock photos and videos.


## Features
- **Photo Search** — Search photos with filters (query, orientation, size, color, locale)
- **Video Search** — Search videos, auto-selects HD .mp4 closest to 1920x1080
- **Get Details** — Retrieve full metadata for a photo/video by ID
- **Intelligent Caching** — 10 min TTL for searches, 60 min for ID lookups
- **Error Handling** — Graceful failures with helpful messages (per MCP best practices)
- **Attribution** — Mandatory photographer credits in every result

## Prerequisites
- Node.js v20+
- Pexels API key (free at [pexels.com/api](https://www.pexels.com/api/))


## Quick Start (2 minutes)

### 1. Get an API Key
Sign up at [pexels.com/api](https://www.pexels.com/api/) — free, no credit card.

### 2. Build the Server
```bash
npm install && npm run build
```

### 3. Add to Claude Desktop
Open `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows), add:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-pexels/build/index.js"],
      "env": {
        "PEXELS_API_KEY": "YOUR_PEXELS_API_KEY"
      }
    }
  }
}
```

> **Windows note:** Use `node.exe` full path or add Node to PATH. Forward slashes in paths work on Windows.

### 4. Restart Claude Desktop
The server is now available as `pexels_search_photos`, `pexels_search_videos`, and `pexels_get_details`.

## Configuration

Add to your `.mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "PEXELS_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Environment
Set `PEXELS_API_KEY` in your environment. For local dev, create a `.env` file:
```
PEXELS_API_KEY=your_pexels_api_key
```

## Development
```bash
npm run dev      # watch mode
npm run inspector # MCP Inspector
npm test          # run tests
```

## Tools
| Tool | Description |
|------|-------------|
| `pexels_search_photos` | Search for photos by query |
| `pexels_search_videos` | Search for videos |
| `pexels_get_details` | Get details by ID and type |

## Architecture
- `src/index.ts` — Entry point, MCP server setup
- `src/tools/` — Tool implementations
- `src/shared/` — Cache, API client, errors, types, video selector
- `src/utils/` — Zod validation schemas

## Engineering Decisions

| Decision | Rationale |
|----------|----------|
| **Cache-first architecture** | Pexels API allows 200 requests/hour. Caching (10m TTL for searches, 60m for ID lookups) preserves quota, reduces latency to <5ms on cache hit, and demonstrates awareness of API costs — critical for production AI systems where agents frequently re-request the same context. |
| **Fail-fast at call time** | MCP servers are spawned as child processes — starting is not the time to fail. Server warns on startup but fails gracefully on first tool call with structured `isError: true`. |
| **Zod validation schemas** | MCP v2 SDK requires `z.object()` wrappers. Catches invalid input before it reaches the API. |
| **resource_link for media** | Remote images and videos are provided as MCP `resource_link` content blocks with proper mimeType. The markdown image link in the text block remains as a fallback for clients that do not render `resource_link`. |
| **Pure video selection** | Video selection logic isolated in `video-selector.ts` — testable independently from tool handler. |
| **Hardcoded attribution** | Required by Pexels Terms of Service. Embedded in every text response. |

## Compatibility

Tested with `@modelcontextprotocol/sdk` v1.29+ via `StdioClientTransport`. The integration test suite spawns the built server and validates every tool call against the SDK's `CallToolResultSchema` and `ContentBlockSchema`.

A structured JSON block is appended as the last content element in every successful response, containing typed data (id, kind, creatorName, dimensions, URLs). Downstream clients and agent frameworks can parse this block directly instead of regex-parsing the markdown text.

## Future Improvements
- **Tool execution telemetry** — Add structured logging for cache hits/misses, query execution time, and error rates. This supports troubleshooting AI agents in production and demonstrates observability best practices.
- **Metrics endpoint** — Expose counters (requests served, cache hit ratio, API quota remaining) for monitoring.
- **Custom TTL configuration** — Allow users to tune cache TTL via environment variables.

## License
Unofficial community project. Not affiliated with Pexels.