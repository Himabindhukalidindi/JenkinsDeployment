import { AuthStrategy, AuthContext } from './auth.types';

export class BasicAuth implements AuthStrategy {
  constructor(
    private readonly user: string,
    private readonly pass: string
  ) {}

  async authenticate(): Promise<AuthContext> {
    const token = Buffer
      .from(`${this.user}:${this.pass}`)
      .toString('base64');

    return {
      accessToken: token,
      tokenType: 'Basic',
    };
  }
}

/** Response model for httpbin basic-auth API */
export interface BasicAuthResponse {
  authenticated: boolean;
  user: string;
}
