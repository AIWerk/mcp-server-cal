import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalApiError, calGet, calPost, calPatch, calDelete } from '../api.js';

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  text?: string;
  headers?: Record<string, string>;
}) {
  const headers = new Headers(response.headers ?? {});
  return vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: response.statusText ?? 'OK',
    text: () => Promise.resolve(response.text ?? '{}'),
    headers,
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

describe('CalApiError', () => {
  it('should construct with status, statusText, and message', () => {
    const error = new CalApiError(404, 'Not Found', 'resource missing');
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.message).toBe('resource missing');
    expect(error.name).toBe('CalApiError');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('getApiKey', () => {
  it('should throw CalApiError when CAL_API_KEY is not set', async () => {
    vi.stubEnv('CAL_API_KEY', '');
    await expect(calGet('/test')).rejects.toThrow('CAL_API_KEY environment variable is not set');
  });
});

describe('handleResponse', () => {
  it('should return parsed JSON on success', async () => {
    vi.stubGlobal('fetch', mockFetch({
      text: JSON.stringify({ status: 'success', data: { id: 1 } }),
    }));
    const result = await calGet<{ status: string; data: { id: number } }>('/test');
    expect(result).toEqual({ status: 'success', data: { id: 1 } });
  });

  it('should throw on 401 with auth message', async () => {
    vi.stubGlobal('fetch', mockFetch({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: '{}',
    }));
    await expect(calGet('/test')).rejects.toThrow('401 Unauthorized - check CAL_API_KEY');
  });

  it('should throw on 404 with not found message', async () => {
    vi.stubGlobal('fetch', mockFetch({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: '{}',
    }));
    await expect(calGet('/test')).rejects.toThrow('404 Not Found');
  });

  it('should throw on 429 after retry', async () => {
    const fn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: () => Promise.resolve('{}'),
      headers: new Headers({ 'Retry-After': '0' }),
    });
    vi.stubGlobal('fetch', fn);
    await expect(calGet('/test')).rejects.toThrow('429 Too Many Requests');
    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('should throw on JSON parse error', async () => {
    vi.stubGlobal('fetch', mockFetch({
      text: 'not json at all',
    }));
    await expect(calGet('/test')).rejects.toThrow('failed to parse response as JSON');
  });

  it('should include error detail from response body', async () => {
    vi.stubGlobal('fetch', mockFetch({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: JSON.stringify({ error: { message: 'invalid field' } }),
    }));
    await expect(calGet('/test')).rejects.toThrow('invalid field');
  });
});

describe('timeout', () => {
  it('should pass AbortSignal.timeout to fetch', async () => {
    const fn = mockFetch({ text: '{"ok":true}' });
    vi.stubGlobal('fetch', fn);
    await calGet('/test');
    const init = fn.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeDefined();
  });
});

describe('HTTP methods', () => {
  it('calGet sends GET with query params', async () => {
    const fn = mockFetch({ text: '{"data":"ok"}' });
    vi.stubGlobal('fetch', fn);
    await calGet('/items', { status: 'active', limit: 10 });
    expect(fn.mock.calls[0][0]).toContain('/items?');
    expect(fn.mock.calls[0][0]).toContain('status=active');
    expect(fn.mock.calls[0][0]).toContain('limit=10');
    expect(fn.mock.calls[0][1].method).toBe('GET');
  });

  it('calPost sends POST with body', async () => {
    const fn = mockFetch({ text: '{"data":"ok"}' });
    vi.stubGlobal('fetch', fn);
    await calPost('/items', { name: 'test' });
    expect(fn.mock.calls[0][1].method).toBe('POST');
    expect(fn.mock.calls[0][1].body).toBe(JSON.stringify({ name: 'test' }));
  });

  it('calPatch sends PATCH with body', async () => {
    const fn = mockFetch({ text: '{"data":"ok"}' });
    vi.stubGlobal('fetch', fn);
    await calPatch('/items/1', { name: 'updated' });
    expect(fn.mock.calls[0][1].method).toBe('PATCH');
    expect(fn.mock.calls[0][1].body).toBe(JSON.stringify({ name: 'updated' }));
  });

  it('calDelete sends DELETE', async () => {
    const fn = mockFetch({ text: '{"data":"ok"}' });
    vi.stubGlobal('fetch', fn);
    await calDelete('/items/1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });

  it('calGet skips undefined params', async () => {
    const fn = mockFetch({ text: '{"data":"ok"}' });
    vi.stubGlobal('fetch', fn);
    await calGet('/items', { status: undefined, limit: 5 });
    const url = fn.mock.calls[0][0] as string;
    expect(url).not.toContain('status');
    expect(url).toContain('limit=5');
  });
});

describe('429 retry', () => {
  it('should retry once on 429 and succeed', async () => {
    const rateLimitResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: () => Promise.resolve('{}'),
      headers: new Headers({ 'Retry-After': '0' }),
    };
    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify({ status: 'success', data: [] })),
      headers: new Headers(),
    };
    const fn = vi.fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);
    vi.stubGlobal('fetch', fn);
    const result = await calGet('/test');
    expect(result).toEqual({ status: 'success', data: [] });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use Retry-After header for delay', async () => {
    const rateLimitResponse = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: () => Promise.resolve('{}'),
      headers: new Headers({ 'Retry-After': '0' }),
    };
    const successResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{"data":"ok"}'),
      headers: new Headers(),
    };
    const fn = vi.fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse);
    vi.stubGlobal('fetch', fn);
    await calGet('/test');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
