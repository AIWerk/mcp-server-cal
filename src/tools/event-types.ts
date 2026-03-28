// Event type tool handlers

import { calGet, calPost, calPatch, calDelete } from '../api.js';
import type { CalApiResponse, EventType } from '../types.js';

export async function listEventTypes(args: {
  teamId?: number;
  userId?: number;
}): Promise<unknown> {
  const params: Record<string, string | number | boolean | undefined> = {};
  if (args.teamId) params['teamId'] = args.teamId;
  if (args.userId) params['userId'] = args.userId;

  const response = await calGet<CalApiResponse<EventType[]>>('/event-types', params);
  return response.data ?? response;
}

export async function getEventType(args: { id: number }): Promise<unknown> {
  if (!args.id) throw new Error('id is required');

  const response = await calGet<CalApiResponse<EventType>>(`/event-types/${args.id}`);
  return response.data ?? response;
}

export async function createEventType(args: {
  title: string;
  slug: string;
  lengthInMinutes: number;
  description?: string;
  locations?: Array<{ type: string; address?: string; link?: string }>;
  hidden?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  if (!args.title?.trim()) throw new Error('title is required');
  if (!args.slug?.trim()) throw new Error('slug is required');
  if (!args.lengthInMinutes || args.lengthInMinutes <= 0) {
    throw new Error('lengthInMinutes is required and must be > 0');
  }

  const body: Record<string, unknown> = {
    title: args.title,
    slug: args.slug,
    lengthInMinutes: args.lengthInMinutes,
  };

  if (args.description) body['description'] = args.description;
  if (args.locations?.length) body['locations'] = args.locations;
  if (args.hidden !== undefined) body['hidden'] = args.hidden;
  if (args.metadata) body['metadata'] = args.metadata;

  const response = await calPost<CalApiResponse<EventType>>('/event-types', body);
  return response.data ?? response;
}

export async function updateEventType(args: {
  id: number;
  title?: string;
  slug?: string;
  lengthInMinutes?: number;
  description?: string;
  locations?: Array<{ type: string; address?: string; link?: string }>;
  hidden?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<unknown> {
  if (!args.id) throw new Error('id is required');

  const body: Record<string, unknown> = {};
  if (args.title !== undefined) body['title'] = args.title;
  if (args.slug !== undefined) body['slug'] = args.slug;
  if (args.lengthInMinutes !== undefined) body['lengthInMinutes'] = args.lengthInMinutes;
  if (args.description !== undefined) body['description'] = args.description;
  if (args.locations !== undefined) body['locations'] = args.locations;
  if (args.hidden !== undefined) body['hidden'] = args.hidden;
  if (args.metadata !== undefined) body['metadata'] = args.metadata;

  if (Object.keys(body).length === 0) {
    throw new Error('At least one field to update is required');
  }

  const response = await calPatch<CalApiResponse<EventType>>(`/event-types/${args.id}`, body);
  return response.data ?? response;
}

export async function deleteEventType(args: { id: number }): Promise<unknown> {
  if (!args.id) throw new Error('id is required');

  const response = await calDelete<CalApiResponse<EventType>>(`/event-types/${args.id}`);
  return response.data ?? response;
}
