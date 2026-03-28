// Availability and schedule tool handlers

import { calGet } from '../api.js';
import type { CalApiResponse, Schedule, SlotsResponse } from '../types.js';

export async function getAvailability(args: {
  eventTypeId: number;
  dateFrom: string;
  dateTo: string;
  timeZone?: string;
}): Promise<unknown> {
  if (!args.eventTypeId) throw new Error('eventTypeId is required');
  if (!args.dateFrom?.trim()) throw new Error('dateFrom is required (ISO 8601 datetime)');
  if (!args.dateTo?.trim()) throw new Error('dateTo is required (ISO 8601 datetime)');

  const params: Record<string, string | number | boolean | undefined> = {
    eventTypeId: args.eventTypeId,
    startTime: args.dateFrom,
    endTime: args.dateTo,
  };

  if (args.timeZone) params['timeZone'] = args.timeZone;

  const response = await calGet<CalApiResponse<SlotsResponse>>('/slots', params);
  return response.data ?? response;
}

export async function listSchedules(): Promise<unknown> {
  const response = await calGet<CalApiResponse<Schedule[]>>('/schedules');
  return response.data ?? response;
}
