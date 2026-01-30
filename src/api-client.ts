import { APIRequestContext } from '@playwright/test';
import { AuthContext, AuthStrategy, RefreshableAuth } from './auth/auth.types';
import crypto from 'crypto';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class APIClient {
  private auth?: AuthContext;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string,
    private readonly authStrategy?: AuthStrategy
  ) { }

  async init(): Promise<void> {
    if (this.authStrategy) {
      this.auth = await this.authStrategy.authenticate();
    }
  }

  /* ---------------- AUTH ---------------- */

  private async ensureAuth(): Promise<void> {
    if (
      this.authStrategy &&
      'refresh' in this.authStrategy &&
      this.auth?.expiresAt &&
      Date.now() > this.auth.expiresAt
    ) {
      this.auth = await (this.authStrategy as RefreshableAuth).refresh();
    }
  }

  /* ---------------- HEADERS ---------------- */

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      ...(this.auth?.accessToken && {
        Authorization: `${this.auth.tokenType ?? 'Bearer'} ${this.auth.accessToken}`,
      }),
      ...(this.auth?.cookies && {
        Cookie: this.auth.cookies,
      }),
      ...(this.auth?.csrfToken && {
        'X-CSRF-Token': this.auth.csrfToken,
      }),
      ...(this.auth?.apiKey?.location === 'header' && {
        [this.auth.apiKey.name]: this.auth.apiKey.value,
      }),
      'x-correlation-id': crypto.randomUUID(),
      ...extra,
    };
  }

  /* ---------------- REQUEST CORE ---------------- */

  private async requestInternal<T>(
    method: HttpMethod,
    url: string,
    options?: {
      data?: unknown;
      multipart?: Record<string, any>;
      headers?: Record<string, string>;
      retries?: number;
    }
  ): Promise<T> {
    await this.ensureAuth();

    const response = await this.request.fetch(this.baseURL + url, {
      method,
      headers: this.buildHeaders(options?.headers),
      data: options?.data,
      multipart: options?.multipart,
    });

    if (response.status() === 429 && (options?.retries ?? 0) < 3) {
      await new Promise(r => setTimeout(r, 1000));
      return this.requestInternal(method, url, {
        ...options,
        retries: (options?.retries ?? 0) + 1,
      });
    }

    if (!response.ok()) {
      throw new Error(
        `API ${method} ${url} failed with ${response.status()}`
      );
    }

    return response.json();
  }

  /* ---------------- PUBLIC METHODS ---------------- */

  get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.requestInternal<T>('GET', url, { headers });
  }

  post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.requestInternal<T>('POST', url, { data, headers });
  }

  postMultipart<T>(
    url: string,
    multipart: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.requestInternal<T>('POST', url, { multipart, headers });
  }

  put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.requestInternal<T>('PUT', url, { data, headers });
  }

  patch<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.requestInternal<T>('PATCH', url, { data, headers });
  }

  delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.requestInternal<T>('DELETE', url, { headers });
  }
}
