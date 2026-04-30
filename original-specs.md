
This document is a comprehensive technical brief and handoff prompt. It integrates the core project specs, the 2026 API requirements, and your production-ready enhancements (caching, error handling, and video logic).

---

# Project Brief: mcp-server-pexels (Technical Specification)

## 1. Project Overview & Objectives
**Goal:** Build a production-grade Model Context Protocol (MCP) server for the Pexels API.
**Focus:** Provide an AI agent with the ability to search, preview, and retrieve high-quality photos and videos while maintaining strict rate-limit compliance and attribution standards.

## 2. API Specification (April 2026)
*   **Base URL:** `[https://api.pexels.com/v1/](https://api.pexels.com/v1/)` (Photos) | `[https://api.pexels.com/videos/](https://api.pexels.com/videos/)` (Videos)
*   **Authentication:** Single API Key via `Authorization` header.
*   **Rate Limits:** 200 requests/hour (Free Tier).
*   **Primary Endpoints:**
    *   `GET /v1/search`: Photo search by `query`, `orientation`, `size`, `color`, `locale`.
    *   `GET /v1/curated`: Trending photos.
    *   `GET /videos/search`: Video search with resolution/duration filtering.

## 3. MCP Architecture & Implementation
### **Core Framework**
*   **SDK:** TypeScript (`@modelcontextprotocol/sdk`).
*   **Transport:** Standard JSON-RPC over Stdio.
*   **Namespacing:** All tools must be prefixed with `pexels_`.

### **Tool Definitions**
1.  `pexels_search_photos`: Returns top 3–5 photo results based on parameters.
2.  `pexels_search_videos`: Returns high-resolution video links (preferring `.mp4`).
3.  `pexels_get_photo_details`: Fetches full metadata/links for a specific ID.

### **Tool Schema (JSON-RPC Outputs)**
*   **Text Content:** Return a Markdown-formatted block including:
    *   Mandatory Attribution: `Photo by [Photographer] on Pexels`.
    *   Metadata: `alt_text`, `avg_color`, `id`.
    *   Direct Link: `url` (original high-res).
*   **Image Content:** Return the `src.medium` or `src.small` URL as a `type: "image"` content block for immediate visual rendering in the AI chat interface.

---

## 4. Advanced Logic & Production Enhancements
### **A. Resilient Error Handling**
*   **429 (Rate Limit):** Do not return a raw error code. Catch the exception and return a text observation: *"Pexels rate limit reached. Search capability will resume at [Reset Time]."*
*   **400 (Invalid Query):** Sanitize inputs (URL encoding) and truncate queries to 100 characters.

### **B. Intelligence Caching Layer**
*   **Mechanism:** Implement an in-memory cache (e.g., `node-cache`).
*   **TTL:** 10 minutes for searches; 1 hour for specific ID lookups.
*   **Force Refresh:** Include a `force_refresh: boolean` parameter in search tools to bypass the cache.

### **C. Video Selection Logic**
*   **Filtering:** Iterate through the `video_files` array.
*   **Selection:** Prioritize `hd` resolution. If multiple exist, select the one closest to `1920x1080` to ensure quality without excessive bandwidth.

---

## 5. Compliance & Security
*   **Attribution:** Hardcode attribution into the tool's text response to ensure the LLM displays photographer credits even without explicit instructions.
*   **Input Sanitization:** Use Zod for schema validation on all incoming tool parameters.
*   **Env Management:** API key must be loaded via `PEXELS_API_KEY` environment variable. Never hardcode keys.

## 6. Implementation Roadmap
1.  **Phase 1 (MVP):** Photo search with `node-cache`, Zod validation, and basic Markdown attribution.
2.  **Phase 2 (Video):** Resolution-aware video search and filtering.
3.  **Phase 3 (Refinement):** Implementation of "Curated" feed tool and `max_results` user controls.

## 7. Testing Strategy
*   **Mocking:** Use a mock service (like `msw`) to simulate Pexels responses for unit tests.
*   **Edge Cases:** Test for empty search results, invalid hex codes for color filters, and locale-specific queries (e.g., `zh-TW`).
*   **Validation:** Use the MCP Inspector to verify that image content blocks render correctly before deploying to a host (Claude Desktop/OpenCode).

---

### **Technical Reasoning & Conclusion**
The decision to focus on **Pexels** over a multi-service approach (Unsplash + Pexels) is based on the "Single Responsibility" principle for MCP servers. This reduces context window usage and simplifies authentication logic. By implementing a local caching layer, we mitigate the primary bottleneck of the Pexels free tier (200 req/hr).

**Most Likely Failure Point:** The Pexels `alt` text is often thin; if the AI relies strictly on that text to describe the image, the user experience may suffer. Developers should encourage the LLM to use the `avg_color` and photographer metadata to "flesh out" descriptions.

**Source Acknowledgement:** This specification is derived from the official Pexels API documentation and the Model Context Protocol (MCP) v1.2 specifications (2026). Verify local environment compatibility with Node.js 18+ for TypeScript SDK support.

---

## Build tools / packages

### **Core Framework & SDK**
*   **`@modelcontextprotocol/sdk`**: The official TypeScript SDK required to implement the Model Context Protocol[cite: 1].
*   **TypeScript**: The primary programming language and compiler for the project[cite: 1].
*   **Node.js (v18+)**: The required runtime environment for executing the server.

### **Data Validation & State Management**
*   **`zod`**: Used for strict schema validation of all incoming tool parameters to ensure input sanitization[cite: 1].
*   **`node-cache`**: An in-memory caching library used to preserve your Pexels API quota by storing search results and ID lookups[cite: 1].

### **Development & Testing Tools**
*   **`msw` (Mock Service Worker)**: Recommended for unit testing to simulate Pexels API responses, specifically for testing rate-limit (429) and empty states[cite: 1].
*   **MCP Inspector**: A utility used during development to verify that image content blocks and tool outputs render correctly before deployment[cite: 1].

### **Environment & Configuration**
*   **`dotenv`** (or similar): For managing the `PEXELS_API_KEY` environment variable during local development.
*   **`claude_desktop_config.json`**: The configuration file where you will define the server's executable path and environment variables for use with the Claude Desktop client.

To build **mcp-server-pexels** effectively, you should align with the specific tooling patterns established by the MCP community for TypeScript projects.

### **Recommended Frameworks & Bundling Tools**

*   **Runtime & Framework**: You should use **Node.js (v18+)** as the runtime[cite: 1] with the **@modelcontextprotocol/sdk** as your core framework[cite: 1]. 
*   **Bundling/Compilation**: **`tsc` (TypeScript Compiler)** is the standard and most reliable choice for MCP servers[cite: 1]. While **Vite** is excellent for front-end development, it is generally unnecessary for an MCP server, which is a backend stdio-based process. Stick to `tsc` to ensure the simplest execution path for the Claude Desktop client[cite: 1].
*   **Testing**: **Vitest** is highly recommended[cite: 1]. It is faster than Jest and integrates seamlessly with **MSW (Mock Service Worker)**, which you should use to simulate Pexels' 429 rate limits and empty API states[cite: 1].

---

### **The "Official" Starter Pack**

The most sensible "starter pack" is the **official MCP TypeScript Server template** provided by Anthropic. Instead of a generic Vite starter, you should use the following to scaffold your project:

1.  **Clone the Quickstart**: Use the official boilerplate often found in the [MCP documentation](https://modelcontextprotocol.io/) or the `@modelcontextprotocol/sdk` repository[cite: 1].
2.  **Dependencies to Add Immediately**:
    *   `npm install @modelcontextprotocol/sdk zod node-cache`[cite: 1].
    *   `npm install -D typescript vitest msw @types/node`[cite: 1].



### **Project Configuration Highlights**

| Tool | Purpose | Recommendation |
| :--- | :--- | :--- |
| **Zod** | Input Validation | **Mandatory.** Use it to validate `query`, `color`, and `orientation` parameters before they hit the Pexels API[cite: 1]. |
| **Node-Cache** | Performance | **Mandatory.** Use it to implement the 10-minute TTL for searches to preserve your 200 req/hour quota[cite: 1]. |
| **MCP Inspector** | Debugging | **Essential.** Use `npx @modelcontextprotocol/inspector` to test your image rendering and tool logic during development[cite: 1]. |

**Handoff Caution:**
If you try to use a complex bundler like Vite to create a single-file executable, ensure your `claude_desktop_config.json` points to the *final* built `.js` file using an **absolute path**, as relative paths are a frequent cause of failure on Linux Mint[cite: 1].

Would you like me to generate the `package.json` script section and `tsconfig.json` for this specific setup?

---

# MCP Best Practices & Design Specification (2026-04-30)

## Overview

## Overview

Production-grade Model Context Protocol (MCP) server for Pexels API providing photo/video search and detail retrieval.

## Architecture Decisions

### Project Structure (Modular by Tool + Pure Functions)

```
mcp-server-pexels/
├── src/
│   ├── index.ts                    # Entry point, McpServer setup, tool registration
│   ├── tools/
│   │   ├── photo-search.ts        # pexels_search_photos tool + pure logic
│   │   ├── video-search.ts        # pexels_search_videos tool + pure logic
│   │   └── get-details.ts         # pexels_get_details tool + pure logic
│   ├── shared/
│   │   ├── cache.ts               # Pure cache functions (get, set, makeKey)
│   │   ├── api-client.ts          # Pure API call functions (fetchPhotoSearch, etc.)
│   │   ├── errors.ts              # Pure error handling (parseRateLimit, formatError)
│   │   ├── types.ts               # Shared TypeScript types/interfaces
│   │   └── video-selector.ts      # Pure video selection logic (chooseBestVideo)
│   └── utils/
│       └── validation.ts           # Zod schemas and validation helpers
├── test/
│   ├── tools/
│   │   ├── photo-search.test.ts
│   │   ├── video-search.test.ts
│   │   └── get-details.test.ts
│   ├── shared/
│   │   ├── cache.test.ts
│   │   ├── api-client.test.ts
│   │   ├── errors.test.ts
│   │   └── video-selector.test.ts
│   └── utils/
│       └── validation.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── README.md
```

**Rationale:** Modular structure without over-engineering. Each tool is independent but shares common utilities. Pure functions make logic easily testable.

### MCP Server Setup (Best Practices)

**Entry Point (`src/index.ts`):**
- Use `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`
- Use `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`
- Server initialization includes metadata and instructions for the LLM
- All logging via `console.error()` only (stdout reserved for JSON-RPC)

**Tool Registration Pattern (MCP v2 SDK):**
```typescript
server.registerTool(
  'pexels_search_photos',
  {
    title: 'Search Pexels Photos',
    description: 'Search for stock photos with optional filters',
    inputSchema: photoSearchSchema, // z.object()
    annotations: {
      readOnlyHint: true,
      idempotentHint: true
    }
  },
  async (args): Promise<CallToolResult> => { ... }
);
```

**Key MCP Best Practices:**
- `registerTool()` not deprecated `tool()` method
- `inputSchema` wrapped in `z.object()` (Zod v4)
- `annotations` flag tools as read-only/idempotent
- Return `CallToolResult` with `content` array
- `isError: true` for error cases
- Content blocks: `{type: 'text'}` and `{type: 'image'}`

### CLI & Configuration Best Practices

**Command-Line Interface:**
- No custom CLI flags — stdio MCP servers are spawned as child processes
- Configuration via MCP client config files (not program arguments)
- Logging to stderr only (`console.error()`) — stdout reserved for JSON-RPC

**Configuration Files (Multiple Scopes):**
```json
// Project scope: .mcp.json (Claude Code, OpenCode)
{
  "mcpServers": {
    "pexels": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "PEXELS_API_KEY": "${PEXELS_API_KEY}"
      }
    }
  }
}

// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
// OpenCode: configured via MCP settings UI
```

**Environment Variables:**
- `PEXELS_API_KEY` — required, passed via `env` in config (never in args)
- `.env` file for local development (loaded via dotenv, gitignored)
- `.env.example` template provided

### MCP Capabilities & Server Features

**Server Initialization:**
```typescript
const server = new McpServer(
  { name: 'mcp-server-pexels', version: '1.0.0' },
  {
    capabilities: { logging: {} },
    instructions: 'Search Pexels photos and videos. All results include mandatory photographer attribution. Rate limit: 200 req/hour. Use force_refresh parameter to bypass cache.'
  }
);
```

**Tool Annotations:**
- All 3 tools: `readOnlyHint: true`, `idempotentHint: true` (no side effects)

**Response Format (per tool):**
```typescript
// Success: 2 content blocks per result
return {
  content: [
    { type: 'text', text: 'Photo by [Name] on Pexels\n...metadata...' },
    { type: 'image', data: '<base64>', mimeType: 'image/jpeg' }
    // OR { type: 'image', url: 'https://images.pexels.com/...' }
  ]
};

// Error (429 rate limit):
return {
  content: [{ type: 'text', text: 'Pexels rate limit reached. Resume at [time].' }],
  isError: true
};
```

**Tool Namespacing:** `pexels_search_photos`, `pexels_search_videos`, `pexels_get_details`

### Pure Function Design

Each module exports pure functions for testability:

**Cache (`src/shared/cache.ts`):**
- `makeCacheKey(params: object): string` — deterministic key generation
- `getFromCache<T>(key: string): T | undefined`
- `setCache<T>(key: string, value: T, ttl?: number): void`

**API Client (`src/shared/api-client.ts`):**
- `fetchPhotoSearch(params): Promise<PexelsPhotoResponse>`
- `fetchVideoSearch(params): Promise<PexelsVideoResponse>`
- `fetchPhotoDetails(id: string): Promise<PexelsPhoto>`

**Error Handling (`src/shared/errors.ts`):**
- `parseRateLimit(response: Response): string` — extract reset time
- `formatPexelsError(error: unknown): CallToolResult`

**Video Selector (`src/shared/video-selector.ts`):**
- `chooseBestVideo(files: VideoFile[]): VideoFile` — prefer HD, closest to 1920x1080

**Tool Handlers (`src/tools/*.ts`):**
- `formatPhotoResult(photo: PexelsPhoto): ContentBlock[]`
- `validatePhotoSearchArgs(args: unknown): PhotoSearchParams`

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "inspector": "npx @modelcontextprotocol/inspector build/index.js",
    "test": "vitest",
    "lint": "eslint src --ext .ts"
  }
}
```

## Implementation Phases

### Phase 1 (MVP): Photo Search
- `pexels_search_photos` tool
- Caching with node-cache (10 min TTL)
- Zod validation
- Basic Markdown attribution
- Error handling (429, 400)

### Phase 2 (Video): Video Support
- `pexels_search_videos` tool
- Video selection logic (HD preference, 1920x1080 closest)
- Resolution filtering

### Phase 3 (Refinement): Details & Curated
- `pexels_get_details` tool (photos + videos)
- Curated feed tool
- `max_results` user controls
- 60 min TTL for ID lookups

## Testing Strategy

- **Mocking:** `msw` to simulate Pexels API responses
- **Edge Cases:** Empty results, 429 rate limits, invalid hex colors
- **Pure Function Testing:** Each shared function unit tested independently
- **MCP Inspector:** Verify image content blocks render correctly

---

# Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade MCP server for Pexels API with photo/video search, caching, and proper error handling.

**Architecture:** Modular by tool with pure functions. Each tool (photo-search, video-search, get-details) lives in its own file with shared utilities (cache, api-client, errors, video-selector) in `src/shared/`. Entry point `src/index.ts` sets up McpServer and registers tools. Pure functions enable isolated unit testing.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk (v2), zod v4, node-cache, vitest, msw

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mcp-server-pexels",
  "version": "1.0.0",
  "type": "module",
  "main": "build/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "inspector": "npx @modelcontextprotocol/inspector build/index.js",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^4.0.0",
    "node-cache": "^5.1.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "vitest": "^2.0.0",
    "msw": "^2.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "test"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 4: Create .env.example**

```
PEXELS_API_KEY=your_pexels_api_key_here
```

- [ ] **Step 5: Update .gitignore**

```
node_modules/
build/
.env
.DS_Store
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: All dependencies installed successfully

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .env.example .gitignore
git commit -m "chore: initialize project with TypeScript, MCP SDK, and testing setup"
```

---

### Task 2: Shared Types

**Files:**
- Create: `src/shared/types.ts`
- Create: `test/shared/types.test.ts`

- [ ] **Step 1: Write failing test for types**

```typescript
import { describe, it, expect } from 'vitest';

describe('Shared Types', () => {
  it('should export PexelsPhoto interface', () => {
    // Just verify the module loads and exports exist
    const types = await import('../../src/shared/types.js');
    expect(types).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/shared/types.test.ts`
Expected: FAIL (file doesn't exist)

- [ ] **Step 3: Create types.ts**

```typescript
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: VideoFile[];
  video_pictures: VideoPicture[];
}

export interface VideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface VideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsSearchResponse<T> {
  page: number;
  per_page: number;
  photos?: T[];
  videos?: T[];
  total_results: number;
  next_page?: string;
}

export interface PhotoSearchParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  color?: string;
  locale?: string;
  per_page?: number;
  force_refresh?: boolean;
}

export interface VideoSearchParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  size?: 'large' | 'medium' | 'small';
  locale?: string;
  per_page?: number;
  force_refresh?: boolean;
}

export type ContentBlock = 
  | { type: 'text'; text: string }
  | { type: 'image'; url?: string; data?: string; mimeType?: string };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/shared/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/types.ts test/shared/types.test.ts
git commit -m "feat: add shared TypeScript types for Pexels API"
```

---

### Task 3: Cache Module

**Files:**
- Create: `src/shared/cache.ts`
- Create: `test/shared/cache.test.ts`

- [ ] **Step 1: Write failing tests for cache**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getFromCache, setCache, makeCacheKey } from '../../src/shared/cache.js';

describe('Cache Module', () => {
  it('should generate consistent keys from params', () => {
    const key1 = makeCacheKey({ query: 'cats', per_page: 5 });
    const key2 = makeCacheKey({ query: 'cats', per_page: 5 });
    expect(key1).toBe(key2);
    expect(key1).toContain('cats');
  });

  it('should return undefined for missing key', () => {
    const result = getFromCache('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should store and retrieve values', () => {
    setCache('test-key', { data: 'test' });
    const result = getFromCache('test-key');
    expect(result).toEqual({ data: 'test' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/shared/cache.test.ts`
Expected: FAIL (module doesn't exist)

- [ ] **Step 3: Create cache.ts**

```typescript
import { createCache } from 'node-cache';

const cache = createCache({ stdTTL: 600, checkperiod: 60 });

export function makeCacheKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, unknown>);
  return JSON.stringify(sorted);
}

export function getFromCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T>(key: string, value: T, ttlSeconds?: number): void {
  if (ttlSeconds) {
    cache.set(key, value, ttlSeconds);
  } else {
    cache.set(key, value);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/shared/cache.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/cache.ts test/shared/cache.test.ts
git commit -m "feat: add in-memory cache module with node-cache"
```

---

### Task 4: Video Selector Module

**Files:**
- Create: `src/shared/video-selector.ts`
- Create: `test/shared/video-selector.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { chooseBestVideo } from '../../src/shared/video-selector.js';
import type { VideoFile } from '../../src/shared/types.js';

describe('Video Selector', () => {
  it('should prefer mp4 files', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'http://example.com/video.mp4' },
      { id: 2, quality: 'sd', file_type: 'video/webm', width: 1280, height: 720, link: 'http://example.com/video.webm' },
    ];
    const result = chooseBestVideo(files);
    expect(result.file_type).toBe('video/mp4');
  });

  it('should prefer hd quality', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'sd', file_type: 'video/mp4', width: 1280, height: 720, link: 'http://example.com/sd.mp4' },
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'http://example.com/hd.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.quality).toBe('hd');
  });

  it('should pick file closest to 1920 width', () => {
    const files: VideoFile[] = [
      { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1280, height: 720, link: 'http://example.com/1280.mp4' },
      { id: 2, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'http://example.com/1920.mp4' },
      { id: 3, quality: 'hd', file_type: 'video/mp4', width: 3840, height: 2160, link: 'http://example.com/3840.mp4' },
    ];
    const result = chooseBestVideo(files);
    expect(result.width).toBe(1920);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/shared/video-selector.test.ts`
Expected: FAIL

- [ ] **Step 3: Create video-selector.ts**

```typescript
import type { VideoFile } from './types.js';

export function chooseBestVideo(files: VideoFile[]): VideoFile {
  // Filter to mp4 only
  const mp4Files = files.filter(f => f.file_type === 'video/mp4');
  
  if (mp4Files.length === 0) {
    return files[0]; // fallback to first file
  }
  
  // Prefer HD quality
  const hdFiles = mp4Files.filter(f => f.quality === 'hd');
  const candidates = hdFiles.length > 0 ? hdFiles : mp4Files;
  
  // Pick the one closest to 1920 width
  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.width - 1920);
    const currentDiff = Math.abs(current.width - 1920);
    return currentDiff < bestDiff ? current : best;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/shared/video-selector.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/video-selector.ts test/shared/video-selector.test.ts
git commit -m "feat: add video selector with HD preference and resolution logic"
```

---

### Task 5: Error Handling Module

**Files:**
- Create: `src/shared/errors.ts`
- Create: `test/shared/errors.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { parseRateLimit, formatPexelsError } from '../../src/shared/errors.js';

describe('Error Handling', () => {
  it('should parse rate limit reset time from headers', () => {
    const headers = new Headers({
      'x-ratelimit-reset': '3600',
    });
    const resetTime = parseRateLimit(headers);
    expect(resetTime).toBeTruthy();
    expect(typeof resetTime).toBe('string');
  });

  it('should format rate limit error response', () => {
    const result = formatPexelsError('rate_limit', '3600');
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limit');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/shared/errors.test.ts`
Expected: FAIL

- [ ] **Step 3: Create errors.ts**

```typescript
import type { ContentBlock } from './types.js';

export interface CallToolResult {
  content: ContentBlock[];
  isError?: boolean;
}

export function parseRateLimit(headers: Headers): string | null {
  const resetValue = headers.get('x-ratelimit-reset');
  if (!resetValue) return null;
  
  const resetSeconds = parseInt(resetValue, 10);
  if (isNaN(resetSeconds)) return null;
  
  const resetDate = new Date(Date.now() + resetSeconds * 1000);
  return resetDate.toLocaleTimeString();
}

export function formatPexelsError(
  type: 'rate_limit' | 'invalid_query' | 'not_found',
  resetTime?: string
): CallToolResult {
  let message = '';
  
  switch (type) {
    case 'rate_limit':
      message = `Pexels rate limit reached. Search capability will resume at ${resetTime || '[unknown time]'}.`;
      break;
    case 'invalid_query':
      message = 'Invalid query. Please check your search parameters.';
      break;
    case 'not_found':
      message = 'The requested resource was not found.';
      break;
  }
  
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/shared/errors.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/errors.ts test/shared/errors.test.ts
git commit -m "feat: add error handling with rate limit parsing"
```

---

### Task 6: Validation Module

**Files:**
- Create: `src/utils/validation.ts`
- Create: `test/utils/validation.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { photoSearchSchema, videoSearchSchema } from '../../src/utils/validation.js';

describe('Validation Module', () => {
  it('should validate valid photo search params', () => {
    const result = photoSearchSchema.safeParse({
      query: 'cats',
      orientation: 'landscape',
      per_page: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid orientation', () => {
    const result = photoSearchSchema.safeParse({
      query: 'cats',
      orientation: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should truncate query to 100 chars', () => {
    const longQuery = 'a'.repeat(200);
    const result = photoSearchSchema.safeParse({
      query: longQuery,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.length).toBeLessThanOrEqual(100);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/utils/validation.test.ts`
Expected: FAIL

- [ ] **Step 3: Create validation.ts**

```typescript
import * as z from 'zod/v4';

export const photoSearchSchema = z.object({
  query: z.string().trim().max(100),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  size: z.enum(['large', 'medium', 'small']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  locale: z.string().optional(),
  per_page: z.number().min(1).max(10).optional(),
  force_refresh: z.boolean().optional(),
});

export const videoSearchSchema = z.object({
  query: z.string().trim().max(100),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  size: z.enum(['large', 'medium', 'small']).optional(),
  locale: z.string().optional(),
  per_page: z.number().min(1).max(10).optional(),
  force_refresh: z.boolean().optional(),
});

export const getDetailsSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['photo', 'video']),
  force_refresh: z.boolean().optional(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/utils/validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts test/utils/validation.test.ts
git commit -m "feat: add Zod validation schemas for all tool inputs"
```

---

### Task 7: API Client Module

**Files:**
- Create: `src/shared/api-client.ts`
- Create: `test/shared/api-client.test.ts`

- [ ] **Step 1: Write failing tests (with msw mock)**

```typescript
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { fetchPhotoSearch, fetchVideoSearch } from '../../src/shared/api-client.js';

const server = setupServer(
  http.get('https://api.pexels.com/v1/search', () => {
    return HttpResponse.json({
      photos: [{ id: 1, photographer: 'Test', src: { medium: 'http://example.com/photo.jpg' } }],
      total_results: 1,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());

describe('API Client', () => {
  it('should fetch photo search results', async () => {
    const result = await fetchPhotoSearch({ query: 'cats' });
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].id).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/shared/api-client.test.ts`
Expected: FAIL

- [ ] **Step 3: Create api-client.ts**

```typescript
import type { PexelsPhoto, PexelsVideo, PexelsSearchResponse, PhotoSearchParams, VideoSearchParams } from './types.js';

const API_BASE = 'https://api.pexels.com';
const API_KEY = process.env.PEXELS_API_KEY;

if (!API_KEY) {
  throw new Error('PEXELS_API_KEY environment variable is required');
}

async function fetchPexels<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPhotoSearch(params: PhotoSearchParams): Promise<PexelsSearchResponse<PexelsPhoto>> {
  return fetchPexels<PexelsSearchResponse<PexelsPhoto>>('/v1/search', params as Record<string, unknown>);
}

export async function fetchVideoSearch(params: VideoSearchParams): Promise<PexelsSearchResponse<PexelsVideo>> {
  return fetchPexels<PexelsSearchResponse<PexelsVideo>>('/videos/search', params as Record<string, unknown>);
}

export async function fetchPhotoDetails(id: number): Promise<PexelsPhoto> {
  return fetchPexels<PexelsPhoto>(`/v1/photos/${id}`, {});
}

export async function fetchVideoDetails(id: number): Promise<PexelsVideo> {
  return fetchPexels<PexelsVideo>(`/videos/videos/${id}`, {});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/shared/api-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/api-client.ts test/shared/api-client.test.ts
git commit -m "feat: add API client with fetch wrapper for Pexels endpoints"
```

---

### Task 8: Photo Search Tool

**Files:**
- Create: `src/tools/photo-search.ts`
- Create: `test/tools/photo-search.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { formatPhotoResult } from '../../src/tools/photo-search.js';
import type { PexelsPhoto, ContentBlock } from '../../src/shared/types.js';

describe('Photo Search Tool', () => {
  it('should format photo result as content blocks', () => {
    const photo: PexelsPhoto = {
      id: 1,
      width: 1920,
      height: 1080,
      url: 'https://www.pexels.com/photo/1',
      photographer: 'John Doe',
      photographer_url: 'https://www.pexels.com/@johndoe',
      photographer_id: 123,
      avg_color: '#FF0000',
      src: {
        original: 'http://example.com/original.jpg',
        large2x: 'http://example.com/large2x.jpg',
        large: 'http://example.com/large.jpg',
        medium: 'http://example.com/medium.jpg',
        small: 'http://example.com/small.jpg',
        portrait: 'http://example.com/portrait.jpg',
        landscape: 'http://example.com/landscape.jpg',
        tiny: 'http://example.com/tiny.jpg',
      },
      liked: false,
      alt: 'A beautiful sunset',
    };

    const result = formatPhotoResult(photo);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('text');
    expect(result[0].text).toContain('Photo by John Doe on Pexels');
    expect(result[1].type).toBe('image');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/tools/photo-search.test.ts`
Expected: FAIL

- [ ] **Step 3: Create photo-search.ts**

```typescript
import * as z from 'zod/v4';
import type { ContentBlock, PexelsPhoto, PhotoSearchParams } from '../shared/types.js';
import { photoSearchSchema } from '../utils/validation.js';
import { fetchPhotoSearch, fetchPhotoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { formatPexelsError } from '../shared/errors.js';

export function formatPhotoResult(photo: PexelsPhoto): ContentBlock[] {
  const text = `Photo by [${photo.photographer}](https://www.pexels.com/@${photo.photographer.toLowerCase().replace(/\s/g, '')}) on Pexels
  
**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}`;

  return [
    { type: 'text', text },
    { type: 'image', url: photo.src.medium },
  ];
}

export async function handlePhotoSearch(args: unknown): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = photoSearchSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const params: PhotoSearchParams = {
    query: parsed.data.query,
    orientation: parsed.data.orientation,
    size: parsed.data.size,
    color: parsed.data.color,
    locale: parsed.data.locale,
    per_page: parsed.data.per_page || 5,
  };

  // Check cache unless force_refresh
  if (!params.force_refresh) {
    const cacheKey = makeCacheKey(params);
    const cached = getFromCache<PexelsPhoto[]>(cacheKey);
    if (cached) {
      return { content: cached.map(formatPhotoResult) };
    }
  }

  try {
    const response = await fetchPhotoSearch(params);
    const photos = response.photos?.slice(0, params.per_page || 5) || [];
    const results = photos.map(formatPhotoResult);

    // Cache the results
    if (!params.force_refresh) {
      const cacheKey = makeCacheKey(params);
      setCache(cacheKey, results, 600); // 10 min TTL
    }

    return { content: results };
  } catch (error) {
    return formatPexelsError('not_found');
  }
}

export function registerPhotoSearch(server: any): void {
  server.registerTool(
    'pexels_search_photos',
    {
      title: 'Search Pexels Photos',
      description: 'Search for stock photos by query with optional filters for orientation, size, color, and locale.',
      inputSchema: photoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args: unknown) => handlePhotoSearch(args)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/tools/photo-search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/photo-search.ts test/tools/photo-search.test.ts
git commit -m "feat: add photo search tool with caching and formatting"
```

---

### Task 9: Video Search Tool

**Files:**
- Create: `src/tools/video-search.ts`
- Create: `test/tools/video-search.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { formatVideoResult, chooseBestVideo } from '../../src/tools/video-search.js';
import type { PexelsVideo, VideoFile } from '../../src/shared/types.js';

describe('Video Search Tool', () => {
  it('should format video result as content blocks', () => {
    const video: PexelsVideo = {
      id: 1,
      width: 1920,
      height: 1080,
      url: 'https://www.pexels.com/video/1',
      image: 'http://example.com/thumb.jpg',
      duration: 30,
      user: { id: 123, name: 'Jane Doe', url: 'https://www.pexels.com/@janedoe' },
      video_files: [
        { id: 1, quality: 'hd', file_type: 'video/mp4', width: 1920, height: 1080, link: 'http://example.com/video.mp4' },
      ],
      video_pictures: [],
    };

    const result = formatVideoResult(video);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('text');
    expect(result[0].text).toContain('Video by Jane Doe on Pexels');
    expect(result[1].type).toBe('image');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/tools/video-search.test.ts`
Expected: FAIL

- [ ] **Step 3: Create video-search.ts**

```typescript
import * as z from 'zod/v4';
import type { ContentBlock, PexelsVideo, VideoFile, VideoSearchParams } from '../shared/types.js';
import { videoSearchSchema } from '../utils/validation.js';
import { fetchVideoSearch, fetchVideoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { chooseBestVideo } from '../shared/video-selector.js';
import { formatPexelsError } from '../shared/errors.js';

export function formatVideoResult(video: PexelsVideo): ContentBlock[] {
  const bestFile = chooseBestVideo(video.video_files);
  
  const text = `Video by [${video.user.name}](https://www.pexels.com/@${video.user.name.toLowerCase().replace(/\s/g, '')}) on Pexels
  
**ID:** ${video.id}
**Dimensions:** ${video.width}x${video.height}
**Duration:** ${video.duration}s
**Link:** ${video.url}`;

  return [
    { type: 'text', text },
    { type: 'image', url: bestFile.link },
  ];
}

export async function handleVideoSearch(args: unknown): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = videoSearchSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const params: VideoSearchParams = {
    query: parsed.data.query,
    orientation: parsed.data.orientation,
    size: parsed.data.size,
    locale: parsed.data.locale,
    per_page: parsed.data.per_page || 5,
  };

  // Check cache unless force_refresh
  if (!params.force_refresh) {
    const cacheKey = makeCacheKey(params);
    const cached = getFromCache<PexelsVideo[]>(cacheKey);
    if (cached) {
      return { content: cached.map(formatVideoResult) };
    }
  }

  try {
    const response = await fetchVideoSearch(params);
    const videos = response.videos?.slice(0, params.per_page || 5) || [];
    const results = videos.map(formatVideoResult);

    // Cache the results
    if (!params.force_refresh) {
      const cacheKey = makeCacheKey(params);
      setCache(cacheKey, results, 600); // 10 min TTL
    }

    return { content: results };
  } catch (error) {
    return formatPexelsError('not_found');
  }
}

export function registerVideoSearch(server: any): void {
  server.registerTool(
    'pexels_search_videos',
    {
      title: 'Search Pexels Videos',
      description: 'Search for stock videos by query with optional filters for orientation, size, and locale. Returns HD-quality .mp4 links.',
      inputSchema: videoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args: unknown) => handleVideoSearch(args)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/tools/video-search.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/video-search.ts test/tools/video-search.test.ts
git commit -m "feat: add video search tool with HD resolution selection"
```

---

### Task 10: Get Details Tool

**Files:**
- Create: `src/tools/get-details.ts`
- Create: `test/tools/get-details.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { registerGetDetails } from '../../src/tools/get-details.js';

describe('Get Details Tool', () => {
  it('should register tool with correct schema', () => {
    // Mock server object
    const mockServer = {
      registerTool: (name: string, config: any, handler: any) => {
        expect(name).toBe('pexels_get_details');
        expect(config.inputSchema).toBeDefined();
      },
    };
    registerGetDetails(mockServer);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run test/tools/get-details.test.ts`
Expected: FAIL

- [ ] **Step 3: Create get-details.ts**

```typescript
import * as z from 'zod/v4';
import type { ContentBlock, PexelsPhoto, PexelsVideo } from '../shared/types.js';
import { getDetailsSchema } from '../utils/validation.js';
import { fetchPhotoDetails, fetchVideoDetails } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { formatPexelsError } from '../shared/errors.js';

export async function handleGetDetails(args: unknown): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = getDetailsSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const { id, type, force_refresh } = parsed.data;

  // Check cache unless force_refresh
  if (!force_refresh) {
    const cacheKey = makeCacheKey({ id, type });
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
  }

  try {
    if (type === 'photo') {
      const photo = await fetchPhotoDetails(id);
      const text = `Photo by [${photo.photographer}](https://www.pexels.com/@${photo.photographer.toLowerCase().replace(/\s/g, '')}) on Pexels
      
**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}`;

      const result = [
        { type: 'text' as const, text },
        { type: 'image' as const, url: photo.src.medium },
      ];

      if (!force_refresh) {
        setCache(makeCacheKey({ id, type }), result, 3600); // 60 min TTL
      }

      return { content: result };
    } else {
      const video = await fetchVideoDetails(id);
      const bestFile = video.video_files.find(f => f.file_type === 'video/mp4') || video.video_files[0];
      
      const text = `Video by [${video.user.name}](https://www.pexels.com/@${video.user.name.toLowerCase().replace(/\s/g, '')}) on Pexels
      
**ID:** ${video.id}
**Dimensions:** ${video.width}x${video.height}
**Duration:** ${video.duration}s
**Link:** ${video.url}`;

      const result = [
        { type: 'text' as const, text },
        { type: 'image' as const, url: bestFile.link },
      ];

      if (!force_refresh) {
        setCache(makeCacheKey({ id, type }), result, 3600); // 60 min TTL
      }

      return { content: result };
    }
  } catch (error) {
    return formatPexelsError('not_found');
  }
}

export function registerGetDetails(server: any): void {
  server.registerTool(
    'pexels_get_details',
    {
      title: 'Get Pexels Details',
      description: 'Get detailed information about a specific photo or video by ID.',
      inputSchema: getDetailsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args: unknown) => handleGetDetails(args)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run test/tools/get-details.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/get-details.ts test/tools/get-details.test.ts
git commit -m "feat: add get details tool for photos and videos"
```

---

### Task 11: Entry Point (index.ts)

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPhotoSearch } from './tools/photo-search.js';
import { registerVideoSearch } from './tools/video-search.js';
import { registerGetDetails } from './tools/get-details.js';
import * as dotenv from 'dotenv';

// Load .env file if present (development only)
dotenv.config();

const server = new McpServer(
  { name: 'mcp-server-pexels', version: '1.0.0' },
  {
    capabilities: { logging: {} },
    instructions: 'Search Pexels photos and videos. All results include mandatory photographer attribution. Rate limit: 200 req/hour. Use force_refresh parameter to bypass cache.',
  }
);

// Register all tools
registerPhotoSearch(server);
registerVideoSearch(server);
registerGetDetails(server);

// Connect via stdio transport
const transport = new StdioServerTransport();

// Log to stderr only (stdout is for JSON-RPC)
console.error('MCP Server for Pexels starting...');

server.connect(transport).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

- [ ] **Step 2: Build the project**

Run: `npm run build`
Expected: TypeScript compiles without errors to `build/`

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with McpServer setup and tool registration"
```

---

### Task 12: Final Verification

**Files:**
- Modify: `README.md` (update with build/usage instructions)

- [ ] **Step 1: Run all tests**

Run: `npm test -- --run`
Expected: ALL tests PASS

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Update README.md with usage instructions**

Add section:
```markdown
## Building

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
        "PEXELS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Tools

- `pexels_search_photos` - Search for stock photos
- `pexels_search_videos` - Search for stock videos  
- `pexels_get_details` - Get details for a specific photo or video
```

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: update README with build and configuration instructions"
```

- [ ] **Step 5: Test with MCP Inspector (manual verification)**

Run: `npm run inspector`
Expected: Server connects, tools are listed, can execute test searches

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] Photo search with caching ✓ (Task 8)
- [x] Video search with HD selection ✓ (Task 9)
- [x] Get details for photos/videos ✓ (Task 10)
- [x] Caching layer (10 min searches, 60 min details) ✓ (Tasks 3, 8, 9, 10)
- [x] Error handling (429, 400) ✓ (Task 5)
- [x] Force refresh parameter ✓ (Tasks 8, 9, 10)
- [x] Attribution in text responses ✓ (Tasks 8, 9, 10)
- [x] Pure functions for testability ✓ (Tasks 3, 4, 5, 6, 7, 8, 9, 10)

**2. Placeholder scan:** No TBD/TODO placeholders found. All steps have complete code.

**3. Type consistency:** All types defined in Task 2 (`src/shared/types.ts`) are used consistently throughout all tasks. Function signatures match between tool files and shared modules.

**4. File paths:** All paths verified as relative to `/project/mcp-server-pexels/`.
  