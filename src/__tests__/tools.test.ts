import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBooking, cancelBooking, rescheduleBooking, createBooking, listBookings } from '../tools/bookings.js';
import { getEventType, createEventType, updateEventType, deleteEventType } from '../tools/event-types.js';
import { getAvailability } from '../tools/availability.js';

function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify({ status: 'success', data })),
    headers: new Headers(),
  });
}

beforeEach(() => {
  vi.stubEnv('CAL_API_KEY', 'test-api-key');
  vi.stubEnv('CAL_BASE_URL', 'https://test.cal.com/v2');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('bookings validation', () => {
  it('getBooking throws on empty uid', async () => {
    await expect(getBooking({ uid: '' })).rejects.toThrow('uid is required');
  });

  it('getBooking throws on whitespace uid', async () => {
    await expect(getBooking({ uid: '   ' })).rejects.toThrow('uid is required');
  });

  it('cancelBooking throws on empty uid', async () => {
    await expect(cancelBooking({ uid: '' })).rejects.toThrow('uid is required');
  });

  it('rescheduleBooking throws on empty uid', async () => {
    await expect(rescheduleBooking({ uid: '', newStart: '2025-01-01T10:00:00Z' }))
      .rejects.toThrow('uid is required');
  });

  it('rescheduleBooking throws on empty newStart', async () => {
    await expect(rescheduleBooking({ uid: 'abc', newStart: '' }))
      .rejects.toThrow('newStart is required');
  });

  it('createBooking throws on missing eventTypeId', async () => {
    await expect(createBooking({
      eventTypeId: 0,
      start: '2025-01-01T10:00:00Z',
      attendeeName: 'Test',
      attendeeEmail: 'test@example.com',
      attendeeTimezone: 'UTC',
    })).rejects.toThrow('eventTypeId is required');
  });

  it('createBooking throws on empty start', async () => {
    await expect(createBooking({
      eventTypeId: 1,
      start: '',
      attendeeName: 'Test',
      attendeeEmail: 'test@example.com',
      attendeeTimezone: 'UTC',
    })).rejects.toThrow('start is required');
  });
});

describe('bookings encodeURIComponent in paths', () => {
  it('getBooking encodes uid in URL path', async () => {
    const fn = mockFetchSuccess({ uid: 'abc/def', title: 'test' });
    vi.stubGlobal('fetch', fn);
    await getBooking({ uid: 'abc/def' });
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain('/bookings/abc%2Fdef');
    expect(url).not.toContain('/bookings/abc/def');
  });

  it('cancelBooking encodes uid in URL path', async () => {
    const fn = mockFetchSuccess({});
    vi.stubGlobal('fetch', fn);
    await cancelBooking({ uid: 'a b' });
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain('/bookings/a%20b/cancel');
  });

  it('rescheduleBooking encodes uid in URL path', async () => {
    const fn = mockFetchSuccess({});
    vi.stubGlobal('fetch', fn);
    await rescheduleBooking({ uid: 'x&y', newStart: '2025-01-01T10:00:00Z' });
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain('/bookings/x%26y/reschedule');
  });
});

describe('event-types validation', () => {
  it('getEventType throws on missing id', async () => {
    await expect(getEventType({ id: 0 })).rejects.toThrow('id is required');
  });

  it('createEventType throws on empty title', async () => {
    await expect(createEventType({ title: '', slug: 'test', lengthInMinutes: 30 }))
      .rejects.toThrow('title is required');
  });

  it('createEventType throws on invalid lengthInMinutes', async () => {
    await expect(createEventType({ title: 'Test', slug: 'test', lengthInMinutes: 0 }))
      .rejects.toThrow('lengthInMinutes is required');
  });

  it('updateEventType throws on no fields to update', async () => {
    await expect(updateEventType({ id: 1 }))
      .rejects.toThrow('At least one field to update is required');
  });
});

describe('event-types encodeURIComponent in paths', () => {
  it('getEventType encodes id in URL path', async () => {
    const fn = mockFetchSuccess({ id: 42, title: 'test' });
    vi.stubGlobal('fetch', fn);
    await getEventType({ id: 42 });
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain('/event-types/42');
  });

  it('deleteEventType encodes id in URL path', async () => {
    const fn = mockFetchSuccess({});
    vi.stubGlobal('fetch', fn);
    await deleteEventType({ id: 99 });
    const url = fn.mock.calls[0][0] as string;
    expect(url).toContain('/event-types/99');
  });
});

describe('availability validation', () => {
  it('getAvailability throws on missing eventTypeId', async () => {
    await expect(getAvailability({
      eventTypeId: 0,
      dateFrom: '2025-01-01',
      dateTo: '2025-01-02',
    })).rejects.toThrow('eventTypeId is required');
  });

  it('getAvailability throws on empty dateFrom', async () => {
    await expect(getAvailability({
      eventTypeId: 1,
      dateFrom: '',
      dateTo: '2025-01-02',
    })).rejects.toThrow('dateFrom is required');
  });
});

describe('response.data handling', () => {
  it('returns data when present', async () => {
    const fn = mockFetchSuccess([{ uid: '123' }]);
    vi.stubGlobal('fetch', fn);
    const result = await listBookings({});
    expect(result).toEqual([{ uid: '123' }]);
  });

  it('returns status object when data is undefined', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify({ status: 'success' })),
      headers: new Headers(),
    }));
    const result = await listBookings({});
    expect(result).toEqual({ status: 'success' });
  });

  it('returns data null when data is explicitly null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify({ status: 'success', data: null })),
      headers: new Headers(),
    }));
    const result = await listBookings({});
    expect(result).toBeNull();
  });
});
