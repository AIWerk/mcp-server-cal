# Changelog

## [1.0.0] - 2026-03-28

### Added
- MCP server for Cal.com API v2 integration
- 12 tools: booking CRUD (list, get, create, cancel, reschedule), event type CRUD (list, get, create, update, delete), availability & schedule queries
- 3 resources: upcoming bookings, event types, schedules (auto-available in context)
- 3 prompts: daily-schedule, find-free-slot, reschedule-suggestion
- Lazy credentials: starts without CAL_API_KEY, tool/list works
- Configurable via `CAL_API_KEY` and optional `CAL_BASE_URL` environment variables
- TypeScript strict mode, graceful shutdown (SIGTERM/SIGINT)
- MIT license

### Security
- Path traversal protection: `encodeURIComponent()` on all URL path parameters
- Request timeout: 30s `AbortSignal.timeout()` on all fetch calls
- 429 rate limit: single retry with Retry-After header support (max 60s, default 2s)

### Tests
- 37 Vitest tests (api.test.ts: 16, tools.test.ts: 21) — full mock coverage
