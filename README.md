# mcp-server-pexels

A production-grade MCP server for Pexels photo and video search.

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

## Quick Start
```bash
npm install
npm run build
```

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

## License
Unofficial community project. Not affiliated with Pexels.