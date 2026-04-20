# @aiwerk/mcp-server-cal

[![npm version](https://img.shields.io/npm/v/@aiwerk/mcp-server-cal)](https://www.npmjs.com/package/@aiwerk/mcp-server-cal)
[![npm downloads](https://img.shields.io/npm/dm/@aiwerk/mcp-server-cal)](https://www.npmjs.com/package/@aiwerk/mcp-server-cal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cal.com scheduling MCP server - manage bookings, event types, and availability directly from your AI assistant.

## Why this server?

Connect Claude, Cursor, or any MCP-compatible AI to your Cal.com account. Create bookings, check availability, manage event types, and view schedules - all via natural language.

## Install

Two ways to run this server — pick the one that fits.

### Option 1 — Hosted (zero setup)

No local runtime, no env vars on your machine — secrets are AES-256-GCM encrypted server-side via HashiCorp Vault.

1. Sign up at **[aiwerkmcp.com](https://aiwerkmcp.com)**.
2. Install **Cal.com** from the catalog and paste your `CAL_API_KEY`.
3. Point your MCP client (Claude.ai, Cursor, Hermes, …) at your hosted endpoint:
   ```
   https://bridge.aiwerk.ch/u/<your-user-id>/mcp
   ```
   with your Bearer token.

All 12 tools, 3 resources, and 3 prompts appear. Install other AIWerk recipes from the same bridge.

### Option 2 — Self-hosted (npx)

Run directly — you manage the API key:

```bash
CAL_API_KEY=cal_live_your_api_key_here npx @aiwerk/mcp-server-cal
```

Or wire it into your MCP client config — see [Configuration](#configuration) below.

## Tools

| Tool | Description |
|------|-------------|
| `cal_list_bookings` | List bookings with optional filters (status, event type, date range) |
| `cal_get_booking` | Get details of a specific booking by UID |
| `cal_create_booking` | Create a new booking (event type, attendee info, time) |
| `cal_cancel_booking` | Cancel a booking by UID |
| `cal_reschedule_booking` | Reschedule a booking to a new time |
| `cal_list_event_types` | List all event types |
| `cal_get_event_type` | Get event type details by ID |
| `cal_create_event_type` | Create a new event type |
| `cal_update_event_type` | Update an existing event type |
| `cal_delete_event_type` | Delete an event type |
| `cal_get_availability` | Check available slots for an event type in a date range |
| `cal_list_schedules` | List all schedules (working hours / availability rules) |

## Resources

Resources are automatically available in the AI's context — no need to ask for them.

| Resource | URI | Description |
|----------|-----|-------------|
| Upcoming Bookings | `cal://bookings/upcoming` | Today's and tomorrow's bookings |
| Event Types | `cal://event-types` | All configured event types |
| Schedules | `cal://schedules` | Working hours and availability rules |

## Prompts

Ready-made prompt templates for common scheduling tasks.

| Prompt | Description |
|--------|-------------|
| `daily-schedule` | Summarize today's schedule with bookings and free slots |
| `find-free-slot` | Find next available time for a specific event type |
| `reschedule-suggestion` | Suggest alternative times for rescheduling a booking |

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cal": {
      "command": "npx",
      "args": ["@aiwerk/mcp-server-cal"],
      "env": {
        "CAL_API_KEY": "cal_live_your_api_key_here"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "cal": {
      "command": "npx",
      "args": ["@aiwerk/mcp-server-cal"],
      "env": {
        "CAL_API_KEY": "cal_live_your_api_key_here"
      }
    }
  }
}
```

### OpenClaw / Universal Recipe

```json
{
  "name": "cal",
  "command": "npx",
  "args": ["@aiwerk/mcp-server-cal"],
  "env": {
    "CAL_API_KEY": "${CAL_API_KEY}"
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CAL_API_KEY` | Yes (on tool call) | - | Cal.com API key (`cal_` or `cal_live_` prefix) |
| `CAL_BASE_URL` | No | `https://api.cal.com/v2` | Override the Cal.com API base URL |

The server starts and responds to `tools/list` without `CAL_API_KEY`. The key is only required when an actual tool is called (lazy credentials pattern).

## Getting Your API Key

1. Go to [Cal.com Settings](https://app.cal.com/settings/developer/api-keys)
2. Create a new API key
3. Copy the key (starts with `cal_live_` for production)

## Security

- Never commit your API key to version control
- Use environment variables or a secrets manager
- The server only reads `CAL_API_KEY` at tool call time, never logs it

## About AIWerk MCP

Part of the **[AIWerk MCP platform](https://aiwerkmcp.com)** — curated, signed MCP recipes served either as npm packages for self-hosting or through our multi-tenant hosted bridge (`bridge.aiwerk.ch`).

Other AIWerk MCP servers:

- [@aiwerk/mcp-server-imap](https://github.com/AIWerk/mcp-server-imap) — IMAP/SMTP email, provider-agnostic
- [@aiwerk/mcp-server-wise](https://github.com/AIWerk/mcp-server-wise) — Wise (TransferWise) Personal API, read-only
- [@aiwerk/mcp-server-clawhub](https://github.com/AIWerk/mcp-server-clawhub) — ClawHub skill catalog

Browse the full catalog (20+ recipes including GitHub, Linear, Notion, Stripe, …) at [aiwerkmcp.com](https://aiwerkmcp.com).

## Contributing

Issues and PRs are welcome! Please open an issue first for larger changes.

## License

MIT - [AIWerk](https://aiwerk.ch)
