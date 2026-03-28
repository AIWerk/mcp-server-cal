// Booking tool handlers

import { calGet, calPost } from '../api.js';
import type { CalApiResponse, Booking } from '../types.js';

export async function listBookings(args: {
  status?: string;
  eventTypeId?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<unknown> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (args.status) params['status'] = args.status;
  if (args.eventTypeId) params['eventTypeId'] = args.eventTypeId;
  if (args.dateFrom) params['afterStart'] = args.dateFrom;
  if (args.dateTo) params['beforeEnd'] = args.dateTo;
  if (args.limit) params['take'] = args.limit;

  const response = await calGet<CalApiResponse<Booking[]>>('/bookings', params);
  return response.data !== undefined ? response.data : { status: response.status ?? 'ok' };
}

export async function getBooking(args: { uid: string }): Promise<unknown> {
  if (!args.uid?.trim()) {
    throw new Error('uid is required');
  }
  const response = await calGet<CalApiResponse<Booking>>(`/bookings/${encodeURIComponent(args.uid)}`);
  return response.data !== undefined ? response.data : { status: response.status ?? 'ok' };
}

export async function createBooking(args: {
  eventTypeId: number;
  start: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimezone: string;
  notes?: string;
  guests?: string[];
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  if (!args.eventTypeId) throw new Error('eventTypeId is required');
  if (!args.start?.trim()) throw new Error('start is required (ISO 8601 datetime)');
  if (!args.attendeeName?.trim()) throw new Error('attendeeName is required');
  if (!args.attendeeEmail?.trim()) throw new Error('attendeeEmail is required');
  if (!args.attendeeTimezone?.trim()) throw new Error('attendeeTimezone is required');

  const body: Record<string, unknown> = {
    eventTypeId: args.eventTypeId,
    start: args.start,
    attendee: {
      name: args.attendeeName,
      email: args.attendeeEmail,
      timeZone: args.attendeeTimezone,
    },
  };

  if (args.notes) body['bookingFieldsResponses'] = { notes: args.notes };
  if (args.guests?.length) body['guests'] = args.guests;
  if (args.metadata) body['metadata'] = args.metadata;

  const response = await calPost<CalApiResponse<Booking>>('/bookings', body);
  return response.data !== undefined ? response.data : { status: response.status ?? 'ok' };
}

export async function cancelBooking(args: {
  uid: string;
  cancellationReason?: string;
}): Promise<unknown> {
  if (!args.uid?.trim()) throw new Error('uid is required');

  const body: Record<string, unknown> = {};
  if (args.cancellationReason) body['cancellationReason'] = args.cancellationReason;

  const response = await calPost<CalApiResponse<Booking>>(`/bookings/${encodeURIComponent(args.uid)}/cancel`, body);
  return response.data !== undefined ? response.data : { status: response.status ?? 'ok' };
}

export async function rescheduleBooking(args: {
  uid: string;
  newStart: string;
  reschedulingReason?: string;
}): Promise<unknown> {
  if (!args.uid?.trim()) throw new Error('uid is required');
  if (!args.newStart?.trim()) throw new Error('newStart is required (ISO 8601 datetime)');

  const body: Record<string, unknown> = {
    start: args.newStart,
  };
  if (args.reschedulingReason) body['reschedulingReason'] = args.reschedulingReason;

  const response = await calPost<CalApiResponse<Booking>>(`/bookings/${encodeURIComponent(args.uid)}/reschedule`, body);
  return response.data !== undefined ? response.data : { status: response.status ?? 'ok' };
}
