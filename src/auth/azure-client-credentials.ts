import { request, APIRequestContext } from '@playwright/test';
import { AuthStrategy, AuthContext, RefreshableAuth } from './auth.types';

/**
 * Azure Client Credentials Auth (OAuth2)
 * - Worker-scoped caching to avoid multiple token fetches per worker
 * - Safe for parallel tests
 * - Supports refresh logic
 */

export class AzureClientCredentialsAuth
  implements AuthStrategy, RefreshableAuth {
  private readonly tokenUrl: string;
  private cachedAuth?: AuthContext;
  private ctx?: APIRequestContext;

  constructor(
    private readonly tenantId: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly scope: string
  ) {
    // this.tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    this.tokenUrl = `http://localhost:3000/oauth/token`;

  }

  /**
   * Authenticate - fetches token or returns cached token
   */
  async authenticate(): Promise<AuthContext> {
    if (this.cachedAuth && !this.isExpired(this.cachedAuth)) {
      return this.cachedAuth;
    }
    return this.fetchToken();
  }

  /**
   * Refresh - forces token fetch
   */
  async refresh(): Promise<AuthContext> {
    return this.fetchToken();
  }

  /**
   * Internal method to fetch token from Azure
   */
  private async fetchToken(): Promise<AuthContext> {
    // reuse context if already created (worker-scoped)
    if (!this.ctx) {
      this.ctx = await request.newContext();
    }

    const res = await this.ctx.post(this.tokenUrl, {
      form: {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: this.scope,
      },
    });

    if (!res.ok()) {
      throw new Error(`Azure token fetch failed: ${res.status()}`);
    }

    const json = await res.json();
    console.log("OAUTH JSON", json);
    this.cachedAuth = {
      accessToken: json.access_token,
      tokenType: 'Bearer',
      expiresAt: Date.now() + json.expires_in * 1000 - 60_000, // refresh 1 min early
      tenantId: this.tenantId,
    };

    return this.cachedAuth;
  }

  /**
   * Checks if cached token is expired
   */
  private isExpired(auth: AuthContext) {
    return !auth.expiresAt || Date.now() > auth.expiresAt;
  }

  /**
   * Dispose context when worker exits
   */
  async dispose() {
    if (this.ctx) {
      await this.ctx.dispose();
      this.ctx = undefined;
      this.cachedAuth = undefined;
    }
  }
}
