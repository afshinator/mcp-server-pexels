# mcp-server-pexels: FULL PROJECT SPECIFICATION & README

## 1. TECHNICAL SPECIFICATIONS
- **Project Name:** mcp-server-pexels[cite: 1]
- **Environment:** Linux Mint (Desktop/Laptop)[cite: 1]
- **Runtime:** Node.js (v18+) with TypeScript SDK[cite: 1]
- **Primary API:** Pexels (Photos & Videos)[cite: 1]
- **Auth:** API Key via `PEXELS_API_KEY` environment variable[cite: 1]
- **Base URLs:** `https://api.pexels.com/v1/` and `https://api.pexels.com/videos/`[cite: 1]
- **Rate Limits:** 200 requests per hour[cite: 1]
- **Namespace:** `pexels_`[cite: 1]

## 2. ADVANCED LOGIC & COMPLIANCE
- **Caching:** Implement `node-cache` (TTL: 10m for searches, 60m for ID lookups).[cite: 1]
- **Error Handling:** Catch 429 errors and return text: "Rate limit reached. Resets at [time]."[cite: 1]
- **Video Logic:** Filter the `video_files` array for the highest resolution under or at 1080p.[cite: 1]
- **Attribution:** Hardcode "Photo by [Photographer] on Pexels" into every text response.[cite: 1]
- **Visuals:** Return `type: "image"` content blocks using `src.medium` for UI rendering.[cite: 1]

## 3. FULL README.md CONTENT
# mcp-server-pexels

A production-grade Model Context Protocol (MCP) server that provides AI agents with access to the Pexels library of high-quality stock photography and video.

## Features
- **Photo Search**: Retrieve curated stock images with orientation, color, and size filters.[cite: 1]
- **Video Search**: Intelligent video retrieval that automatically selects the highest quality .mp4 (prioritizing 1080p).[cite: 1]
- **Intelligent Caching**: In-memory caching (via node-cache) to preserve your Pexels API quota.[cite: 1]
- **Resilient Error Handling**: Graceful handling of Pexels rate limits (429) with descriptive feedback for the AI.[cite: 1]
- **Automatic Attribution**: Every result includes mandatory photographer credits to ensure compliance.[cite: 1]
- **Rich Media Support**: Returns both metadata and visual image content blocks for immediate rendering.[cite: 1]

## Prerequisites
- Node.js (v18 or higher)[cite: 1]
- A Pexels API Key[cite: 1]

## Installation
1. Clone the repository and navigate to the directory.[cite: 1]
2. `npm install`[cite: 1]
3. `npm run build`[cite: 1]

## Configuration (claude_desktop_config.json)
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-pexels/build/index.js"],
      "env": {
        "PEXELS_API_KEY": "YOUR_PEXELS_API_KEY_HERE"
      }
    }
  }
}

## Tools
- **pexels_search_photos**: Search for stock photos with criteria (query, orientation, size, color, locale).[cite: 1]
- **pexels_search_videos**: Search for stock videos with resolution filtering.[cite: 1]
- **pexels_get_details**: Retrieve comprehensive metadata and direct links for a specific ID.[cite: 1]

## Development
To run the server in development mode with the MCP Inspector: `npm run inspector`.[cite: 1]

---
*Note: This is an unofficial community-maintained MCP server and is not affiliated with Pexels.*

## 4. ROADMAP & TESTING
- **Phase 1 (MVP)**: Basic photo search, caching, Zod validation, and basic Markdown attribution.[cite: 1]
- **Phase 2 (Video)**: Resolution-aware video search and filtering; ID-based detail retrieval.[cite: 1]
- **Phase 3 (Refinement)**: Implementation of "Curated" feed tool and `max_results` user controls.[cite: 1]
- **Testing**: Use `msw` to mock Pexels responses for 429 and empty states; verify via MCP Inspector.[cite: 1]

## 5. CRITICAL RISKS
- **Path Config**: Absolute paths in configuration are the most common cause of failure on Linux systems.[cite: 1]
- **Token Usage**: Returning too many results (max_results) can exhaust the LLM context window; keep default at 5.[cite: 1]
- **Stale Content**: High TTL on caching may result in stale results for trending topics.[cite: 1]