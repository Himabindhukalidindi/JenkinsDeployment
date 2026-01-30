import { request, APIRequestContext } from '@playwright/test';
import { AuthStrategy, AuthContext } from './auth.types';

export class CookieCsrfAuth implements AuthStrategy {
  private cachedAuth?: AuthContext;
  private ctx?: APIRequestContext;

  constructor(
    private loginUrl: string,
    private credentials: any
  ) {}

  async authenticate(): Promise<AuthContext> {
    if (this.cachedAuth) {
      return this.cachedAuth;
    }

    this.ctx = await request.newContext();

    const res = await this.ctx.post(this.loginUrl, {
      data: this.credentials,
    });

    const cookies = (await this.ctx.storageState()).cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    this.cachedAuth = {
      cookies,
      csrfToken: res.headers()['x-csrf-token'],
    };

    return this.cachedAuth;
  }
}
