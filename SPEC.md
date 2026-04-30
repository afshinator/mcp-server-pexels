
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