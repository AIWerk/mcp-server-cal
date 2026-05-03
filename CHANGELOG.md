# Changelog

## [1.0.5] - 2026-05-03

### Internal

- Added `vitest.config.ts` with `pool: 'threads'`, `singleThread: true`, `testTimeout: 10000`. Prevents worker-orphan OOM scenarios when the parent `npm test` process is killed mid-run (vitest fork-pool default could leave busy-spinning workers attached to systemd). No tool-surface or API change.

## [1.0.4] - 2026-04-21

### Added
- **`createSandboxServer` export** — Smithery scan-time entry. Smithery's CLI bundles the module to CJS and calls this export to introspect tools/resources/prompts without starting a stdio transport. Returns the bare `McpServer` instance (not the `{ server, close }` wrapper). Enables publishing to smithery.ai catalog.
- Default export is now `createSandboxServer` — accommodates both Smithery conventions (named vs default lookup).

### Fixed
- `readPackageVersion` — safely falls back to `0.0.0-sandbox` when `import.meta.url` is empty (CJS bundle case, e.g. Smithery's sandbox). Previously would throw and abort the scan.

### Notes
- No breaking change: `main()`, `createServer()`, and the CLI flow (`npx @aiwerk/mcp-server-cal`) behave exactly as in 1.0.3.

## [1.0.3] - 2026-04-21

### Docs
- README: Split install into Hosted (aiwerkmcp.com) and Self-hosted (npx) options. The hosted option lands on `bridge.aiwerk.ch/u/<user-id>/mcp` with zero local setup — secrets AES-256-GCM encrypted via Vault.
- README: Replaced the stale `catalog.aiwerk.ch` link (sunsetted 2026-04-09) with `aiwerkmcp.com`. Cleaned up the "100+ recipes" overclaim on mcp-bridge.
- README: New "About AIWerk MCP" footer cross-linking sibling servers (imap, wise, clawhub).

### Package metadata
- Added `homepage`, `repository`, and `bugs` fields — surfaces on npmjs.com and external catalogs (Smithery, Glama, Pulse MCP).

## [1.0.2] - 2026-04-20

### Fixed
- **CLI entry fix** — `isCliEntry` now compares realpath of `import.meta.url` against realpath of `process.argv[1]`. The old `pathToFileURL(argv[1]).href === import.meta.url` check returned false under npm's bin-shim indirection, so `npx @aiwerk/mcp-server-cal` silently exited (code 0, no stdout/stderr) without running `main()`. Discovered via bridge spawn audit — cal was silent-exiting on `bridge.aiwerk.ch` the same way clawhub@0.1.0 and wise@0.1.0 did.

## [1.0.1] - 2026-04-03

### Fixed
- Remove `cal-api-version: 2024-08-13` header that caused 404 errors on Cal.com v2 API endpoints (`/event-types`, `/schedules`, etc.). Cal.com changed v2 endpoint routing — without the header, all endpoints return 200.

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
