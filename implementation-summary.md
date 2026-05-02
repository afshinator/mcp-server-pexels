# mcp-server-pexels Implementation Summary

## System Boundary

**Transport**: Stdio (stdin/stdout JSON-RPC) — MCP client spawns server as child process

---

## Data Flow

```
MCP Client (stdin)
    ↓ JSON-RPC
StdioServerTransport
    ↓
McpServer (router)
    ↓ registers tools
├── pexels_search_photos
├── pexels_search_videos
└── pexels_get_details
    ↓ (on execute)
Cache (node-cache) → API Client → Pexels API (https://api.pexels.com/v1/*)
    ↓ (hit/miss)
Return content blocks + metadata
    ↓ JSON-RPC
MCP Client (stdout)
```

---

## Functional Parts

| Component | Role | Location |
|-----------|------|---------|
| **Entry Point** | McpServer init, tool registration, transport setup | `src/index.ts` |
| **Photo Search Tool** | `pexels_search_photos` handler, caching, response formatting | `src/tools/photo-search.ts` |
| **Video Search Tool** | `pexels_search_videos` handler, video selection, caching | `src/tools/video-search.ts` |
| **Get Details Tool** | `pexels_get_details` handler (photos + videos), caching | `src/tools/get-details.ts` |
| **Cache Module** | TTL cache (10m searches, 60m ID lookups) | `src/shared/cache.ts` |
| **API Client** | `fetchPexels()` wrapper with auth, error parsing | `src/shared/api-client.ts` |
| **Error Handling** | Rate limit parsing, error formatting | `src/shared/errors.ts` |
| **Video Selector** | Filter .mp4, prefer HD, pick closest to 1920 width | `src/shared/video-selector.ts` |
| **Validation** | Zod schemas (photoSearch, videoSearch, getDetails) | `src/utils/validation.ts` |
| **Types** | Shared TypeScript interfaces | `src/shared/types.ts` |

---

## Architecture Decisions

### 1. Modular by Tool
Each tool in its own file, pure functions for testability.

### 2. Cache-First Architecture
Tools check cache before API call. `force_refresh` parameter bypasses cache.

### 3. Fail-Fast at Call Time
API key check at runtime, not startup. Server warns but starts; fails gracefully on first tool call with structured error.

### 4. Dual Content Blocks
Every result returns two content blocks:
- Text: metadata + markdown image link + photographer attribution
- Image: `url` field pointing to medium-resolution thumbnail

### 5. Hardcoded Attribution
"Photo by [Photographer] on Pexels" in every text response (required by Pexels TOS).

### 6. Pure Video Selection
Video selection logic isolated in `video-selector.ts` for testability — not buried in tool handler.

### 7. Zod Validation
Input schemas wrapped in `z.object()` per MCP v2 SDK requirement.

---

## External Dependencies

| Package | Role |
|---------|------|
| `@modelcontextprotocol/sdk` | MCP server framework |
| `node-cache` | In-memory TTL cache |
| `zod` | Input validation |

---

## Project Structure

```
src/
├── index.ts                  # Entry: McpServer + transport
├── tools/
│   ├── photo-search.ts       # pexels_search_photos
│   ├── video-search.ts     # pexels_search_videos
│   └── get-details.ts    # pexels_get_details
├── shared/
│   ├── cache.ts          # TTL cache (get/set/makeKey)
│   ├── api-client.ts   # fetchPexels wrapper
│   ├── errors.ts       # parseRateLimit, formatError
│   ├── types.ts       # Shared interfaces
│   └── video-selector.ts  # chooseBestVideo
└── utils/
    └── validation.ts  # Zod schemas
```

---

## User-Facing Functionality

### Tools Available

- **pexels_search_photos** — Search for stock photos by keyword
  - `query` (required): Search term
  - `per_page`: Number of results (default 5, max 20)
  - `orientation`: Filter by orientation (landscape, portrait, square)
  - `size`: Filter by size (large, medium, small)
  - `color`: Filter by color (name or hex code)
  - `locale`: Locale for trending results (e.g., "US", "GB")
  - `force_refresh`: Bypass cache, fetch fresh from API

- **pexels_search_videos** — Search for stock videos by keyword
  - `query` (required): Search term
  - `per_page`: Number of results (default 5, max 20)
  - `orientation`: Filter by orientation (landscape, portrait, square)
  - `force_refresh`: Bypass cache, fetch fresh from API

- **pexels_get_details** — Get full metadata for a specific item
  - `id` (required): The Pexels ID
  - `type` (required): "photo" or "video"
  - `force_refresh`: Bypass cache, fetch fresh from API

### Response Format

Every tool returns two content blocks per result:
1. **Text block**: Metadata, markdown image link, and photographer attribution
2. **Image block**: URL field pointing to medium-resolution thumbnail

### Error Handling

- **Rate limited (429)**: Returns structured error with retry time
- **Invalid input**: Returns validation error with field-specific feedback
- **Network/API failure**: Returns descriptive error message

### Caching Behavior

- **Searches**: Cached for 10 minutes
- **ID lookups**: Cached for 60 minutes
- **force_refresh**: Parameter to bypass cache and fetch fresh data