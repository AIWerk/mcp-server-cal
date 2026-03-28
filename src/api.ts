// Cal.com API v2 client

const CAL_API_VERSION = '2024-08-13';

export class CalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'CalApiError';
  }
}

function getApiKey(): string {
  const key = process.env.CAL_API_KEY;
  if (!key) {
    throw new CalApiError(
      401,
      'Unauthorized',
      'CAL_API_KEY environment variable is not set. Please configure your Cal.com API key.'
    );
  }
  return key;
}

function getBaseUrl(): string {
  return (process.env.CAL_BASE_URL ?? 'https://api.cal.com/v2').replace(/\/$/, '');
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'cal-api-version': CAL_API_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

const REQUEST_TIMEOUT_MS = 30_000;

async function handleResponse<T>(response: Response, context: string): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    let errorMessage = `${context}: ${response.status} ${response.statusText}`;
    try {
      const body = JSON.parse(text) as { error?: { message?: string }; message?: string };
      const detail = body?.error?.message ?? body?.message;
      if (detail) {
        errorMessage = `${context}: ${response.status} ${response.statusText} - ${detail}`;
      }
    } catch {
      // ignore parse errors, use status text
    }

    if (response.status === 401) {
      errorMessage = `Cal.com API error: 401 Unauthorized - check CAL_API_KEY`;
    } else if (response.status === 404) {
      errorMessage = `Cal.com API error: 404 Not Found - ${context.toLowerCase()} not found`;
    } else if (response.status === 429) {
      errorMessage = `Cal.com API error: 429 Too Many Requests - rate limit exceeded`;
    }

    throw new CalApiError(response.status, response.statusText, errorMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${context}: failed to parse response as JSON`);
  }
}

async function fetchWithRetry(url: string, init: RequestInit, _context?: string): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const delayMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 60_000) : 2000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  }

  return response;
}

export async function calGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const apiKey = getApiKey();
  const base = getBaseUrl();

  let url = `${base}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: buildHeaders(apiKey),
  }, `GET ${path}`);

  return handleResponse<T>(response, `GET ${path}`);
}

export async function calPost<T>(path: string, body: unknown): Promise<T> {
  const apiKey = getApiKey();
  const base = getBaseUrl();

  const response = await fetchWithRetry(`${base}${path}`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  }, `POST ${path}`);

  return handleResponse<T>(response, `POST ${path}`);
}

export async function calPatch<T>(path: string, body: unknown): Promise<T> {
  const apiKey = getApiKey();
  const base = getBaseUrl();

  const response = await fetchWithRetry(`${base}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  }, `PATCH ${path}`);

  return handleResponse<T>(response, `PATCH ${path}`);
}

export async function calDelete<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  const base = getBaseUrl();

  const response = await fetchWithRetry(`${base}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(apiKey),
  }, `DELETE ${path}`);

  return handleResponse<T>(response, `DELETE ${path}`);
}
