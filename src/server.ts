#!/usr/bin/env node
// Cal.com MCP server - manage bookings, event types, and availability

import * as z from 'zod/v4';
import { readFileSync, realpathSync } from 'fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';

import { listBookings, getBooking, createBooking, cancelBooking, rescheduleBooking } from './tools/bookings.js';
import { listEventTypes, getEventType, createEventType, updateEventType, deleteEventType } from './tools/event-types.js';
import { getAvailability, listSchedules } from './tools/availability.js';
// Resources and Prompts use the MCP SDK's built-in resource()/prompt() methods

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string };
    return pkg.version;
  } catch {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')) as { version: string };
    return pkg.version;
  }
}

const VERSION = readPackageVersion();

function toolSuccess(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

export function createServer() {
  const server = new McpServer({
    name: '@aiwerk/mcp-server-cal',
    version: VERSION,
  });

  // ---- Bookings ----

  server.registerTool(
    'cal_list_bookings',
    {
      description: 'List bookings with optional filters. Optional: status (upcoming|recurring|past|cancelled|unconfirmed), eventTypeId, dateFrom (ISO 8601), dateTo (ISO 8601), limit.',
      inputSchema: {
        status: z.enum(['upcoming', 'recurring', 'past', 'cancelled', 'unconfirmed']).optional(),
        eventTypeId: z.number().int().positive().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20).optional(),
      },
    },
    async (args) => {
      try {
        const result = await listBookings(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_get_booking',
    {
      description: 'Get details of a specific booking by its UID. Required: uid.',
      inputSchema: {
        uid: z.string().min(1),
      },
    },
    async (args) => {
      try {
        const result = await getBooking(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_create_booking',
    {
      description: 'Create a new booking. Required: eventTypeId, start (ISO 8601), attendeeName, attendeeEmail, attendeeTimezone. Optional: notes, guests (array of emails), metadata.',
      inputSchema: {
        eventTypeId: z.number().int().positive(),
        start: z.string().min(1),
        attendeeName: z.string().min(1),
        attendeeEmail: z.string().email(),
        attendeeTimezone: z.string().min(1),
        notes: z.string().optional(),
        guests: z.array(z.string().email()).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (args) => {
      try {
        const result = await createBooking(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_cancel_booking',
    {
      description: 'Cancel a booking by UID. Required: uid. Optional: cancellationReason.',
      inputSchema: {
        uid: z.string().min(1),
        cancellationReason: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const result = await cancelBooking(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_reschedule_booking',
    {
      description: 'Reschedule a booking to a new time. Required: uid, newStart (ISO 8601). Optional: reschedulingReason.',
      inputSchema: {
        uid: z.string().min(1),
        newStart: z.string().min(1),
        reschedulingReason: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const result = await rescheduleBooking(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  // ---- Event Types ----

  server.registerTool(
    'cal_list_event_types',
    {
      description: 'List all event types. Optional: teamId, userId to filter by team or user.',
      inputSchema: {
        teamId: z.number().int().positive().optional(),
        userId: z.number().int().positive().optional(),
      },
    },
    async (args) => {
      try {
        const result = await listEventTypes(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_get_event_type',
    {
      description: 'Get details of a specific event type by ID. Required: id.',
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    async (args) => {
      try {
        const result = await getEventType(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_create_event_type',
    {
      description: 'Create a new event type. Required: title, slug, lengthInMinutes. Optional: description, locations, hidden, metadata.',
      inputSchema: {
        title: z.string().min(1),
        slug: z.string().min(1),
        lengthInMinutes: z.number().int().positive(),
        description: z.string().optional(),
        locations: z.array(z.object({
          type: z.string(),
          address: z.string().optional(),
          link: z.string().optional(),
        })).optional(),
        hidden: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (args) => {
      try {
        const result = await createEventType(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_update_event_type',
    {
      description: 'Update an existing event type. Required: id. Optional fields to update: title, slug, lengthInMinutes, description, locations, hidden, metadata.',
      inputSchema: {
        id: z.number().int().positive(),
        title: z.string().optional(),
        slug: z.string().optional(),
        lengthInMinutes: z.number().int().positive().optional(),
        description: z.string().optional(),
        locations: z.array(z.object({
          type: z.string(),
          address: z.string().optional(),
          link: z.string().optional(),
        })).optional(),
        hidden: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async (args) => {
      try {
        const result = await updateEventType(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_delete_event_type',
    {
      description: 'Delete an event type by ID. Required: id.',
      inputSchema: {
        id: z.number().int().positive(),
      },
    },
    async (args) => {
      try {
        const result = await deleteEventType(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  // ---- Availability & Schedules ----

  server.registerTool(
    'cal_get_availability',
    {
      description: 'Get available time slots for an event type in a date range. Required: eventTypeId, dateFrom (ISO 8601), dateTo (ISO 8601). Optional: timeZone.',
      inputSchema: {
        eventTypeId: z.number().int().positive(),
        dateFrom: z.string().min(1),
        dateTo: z.string().min(1),
        timeZone: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const result = await getAvailability(args);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    'cal_list_schedules',
    {
      description: 'List all schedules (working hours and availability rules).',
      inputSchema: {},
    },
    async () => {
      try {
        const result = await listSchedules();
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );

  // ---- Resources ----

  server.resource(
    'upcoming-bookings',
    'cal://bookings/upcoming',
    {
      description: 'Upcoming bookings for today and tomorrow — automatically available in context',
      mimeType: 'application/json',
    },
    async () => {
      try {
        const result = await listBookings({ status: 'upcoming', limit: 20 });
        return {
          contents: [{
            uri: 'cal://bookings/upcoming',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          contents: [{
            uri: 'cal://bookings/upcoming',
            mimeType: 'text/plain',
            text: `Error loading bookings: ${message}`,
          }],
        };
      }
    }
  );

  server.resource(
    'event-types',
    'cal://event-types',
    {
      description: 'All configured event types — know what can be booked',
      mimeType: 'application/json',
    },
    async () => {
      try {
        const result = await listEventTypes({});
        return {
          contents: [{
            uri: 'cal://event-types',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          contents: [{
            uri: 'cal://event-types',
            mimeType: 'text/plain',
            text: `Error loading event types: ${message}`,
          }],
        };
      }
    }
  );

  server.resource(
    'schedules',
    'cal://schedules',
    {
      description: 'Working hours and availability rules',
      mimeType: 'application/json',
    },
    async () => {
      try {
        const result = await listSchedules();
        return {
          contents: [{
            uri: 'cal://schedules',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          contents: [{
            uri: 'cal://schedules',
            mimeType: 'text/plain',
            text: `Error loading schedules: ${message}`,
          }],
        };
      }
    }
  );

  // ---- Prompts ----

  server.prompt(
    'daily-schedule',
    'Summarize today\'s schedule — shows all bookings and free slots',
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: 'Please summarize my Cal.com schedule for today. List all upcoming bookings with times, attendees, and event types. Also mention any gaps where I\'m free. Use cal_list_bookings with status "upcoming" and cal_list_schedules to check my working hours.',
        },
      }],
    })
  );

  server.prompt(
    'find-free-slot',
    {
      eventType: z.string().describe('Name or ID of the event type to check'),
      days: z.string().optional().describe('How many days ahead to search (default: 7)'),
    },
    async (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Find the next available time slot for the "${args.eventType}" event type. Search the next ${args.days || '7'} days. Use cal_list_event_types to find the event type ID, then cal_get_availability with the appropriate date range. Show me the first 5 available slots.`,
        },
      }],
    })
  );

  server.prompt(
    'reschedule-suggestion',
    {
      bookingUid: z.string().describe('UID of the booking to reschedule'),
    },
    async (args) => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I need to reschedule booking ${args.bookingUid}. Use cal_get_booking to get the details (event type, duration), then cal_get_availability to find alternative slots in the next 7 days. Suggest 3 alternative times and ask which one I prefer. Then use cal_reschedule_booking to make the change.`,
        },
      }],
    })
  );

  return {
    server,
    close: async () => {
      await server.close();
    },
  };
}

async function main() {
  const { server, close } = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    await close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export function isCliEntry(moduleUrl: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(argv1);
  } catch {
    return false;
  }
}

if (isCliEntry(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
