# @aiwerk/mcp-server-cal

[![npm version](https://img.shields.io/npm/v/@aiwerk/mcp-server-cal)](https://www.npmjs.com/package/@aiwerk/mcp-server-cal)
[![npm downloads](https://img.shields.io/npm/dm/@aiwerk/mcp-server-cal)](https://www.npmjs.com/package/@aiwerk/mcp-server-cal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cal.com scheduling MCP server - manage bookings, event types, and availability directly from your AI assistant.

## Why this server?

Connect Claude, Cursor, or any MCP-compatible AI to your Cal.com account. Create bookings, check availability, manage event types, and view schedules - all via natural language.

## Quick Start

```bash
npx @aiwerk/mcp-server-cal
```

Set your Cal.com API key:

```bash
export CAL_API_KEY=cal_live_your_api_key_here
```

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

## License

MIT - AIWerk <kontakt@aiwerk.ch>
