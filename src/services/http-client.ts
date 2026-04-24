import { env } from '../config/env';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number };
}

class HttpClient {
  private baseUrl = env.API_BASE_URL;

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { signal?: AbortSignal; headers?: Record<string, string> },
  ): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });

    if (!res.ok) {
      let err: ApiError;
      try {
        const data = (await res.json()) as {
          error?: { code?: string; message?: string; details?: unknown };
        };
        err = {
          status: res.status,
          code: data.error?.code ?? 'UNKNOWN',
          message: data.error?.message ?? res.statusText,
          details: data.error?.details,
        };
      } catch {
        err = { status: res.status, code: 'UNKNOWN', message: res.statusText };
      }
      throw err;
    }

    if (res.status === 204) return undefined as T;
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  async getPaginated<T>(
    path: string,
    o?: { signal?: AbortSignal; headers?: Record<string, string> },
  ): Promise<PaginatedResult<T>> {
    const res = await fetch(this.baseUrl + path, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...o?.headers },
      signal: o?.signal,
    });

    if (!res.ok) {
      let err: ApiError;
      try {
        const data = (await res.json()) as {
          error?: { code?: string; message?: string; details?: unknown };
        };
        err = {
          status: res.status,
          code: data.error?.code ?? 'UNKNOWN',
          message: data.error?.message ?? res.statusText,
          details: data.error?.details,
        };
      } catch {
        err = { status: res.status, code: 'UNKNOWN', message: res.statusText };
      }
      throw err;
    }

    const json = (await res.json()) as {
      data: T[];
      pagination: { page: number; pageSize: number; total: number };
    };
    return { items: json.data, pagination: json.pagination };
  }

  get<T>(p: string, o?: { signal?: AbortSignal; headers?: Record<string, string> }) {
    return this.request<T>('GET', p, undefined, o);
  }

  post<T>(
    p: string,
    b?: unknown,
    o?: { signal?: AbortSignal; headers?: Record<string, string> },
  ) {
    return this.request<T>('POST', p, b, o);
  }

  put<T>(
    p: string,
    b?: unknown,
    o?: { signal?: AbortSignal; headers?: Record<string, string> },
  ) {
    return this.request<T>('PUT', p, b, o);
  }

  patch<T>(
    p: string,
    b?: unknown,
    o?: { signal?: AbortSignal; headers?: Record<string, string> },
  ) {
    return this.request<T>('PATCH', p, b, o);
  }

  delete<T>(p: string, o?: { signal?: AbortSignal; headers?: Record<string, string> }) {
    return this.request<T>('DELETE', p, undefined, o);
  }
}

export const httpClient = new HttpClient();
