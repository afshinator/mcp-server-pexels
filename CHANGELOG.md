# Changelog

All notable changes to mcp-server-pexels are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — Unreleased

### Added

- three MCP tools: `pexels_search_photos`, `pexels_search_videos`,
  `pexels_get_details`
- Photo search with filters (query, orientation, size, color, locale)
- Video search with intelligent HD .mp4 selection (prefers quality='hd', picks
  closest to 1920px width)
- Get details for single photo or video by ID
- Structured JSON output — a machine-parseable JSON block is appended as the
  last content element in every successful response (id, kind, creatorName,
  creatorUrl, dimensions, URLs, avgColor, durationSeconds, alt)
- Content blocks use MCP `resource_link` with proper mimeType (spec-compliant)
- Typed error handling: `PexelsApiError` (401/429/404/5xx), `MissingKeyError`
  for unset API key — all return clean `isError: true` with actionable messages
- Intelligent caching via node-cache (10 min searches, 60 min ID lookups,
  `force_refresh` parameter)
- Zod input validation on all tool parameters (including Pexels named colors
  and hex codes)
- Debug logging gated behind `DEBUG=1` or `LOG_LEVEL=debug`
- MIT License
- SDK example client (`examples/client.ts`)
- Comprehensive test suite: 110 tests (unit, handler, schema compliance,
  StdioClientTransport integration, cache TTL, edge cases)
