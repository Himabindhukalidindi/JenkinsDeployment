//auth context
export interface AuthContext {
  accessToken?: string;
  tokenType?: string;
  apiKey?: {
    name: string;
    value: string;
    location: 'header' | 'query' | 'cookie';
  };
  cookies?: string;
  csrfToken?: string;
  expiresAt?: number;
  tenantId?: any;
}

export interface AuthStrategy {
  authenticate(): Promise<AuthContext>;
}

export interface RefreshableAuth {
  refresh(): Promise<AuthContext>;
}
