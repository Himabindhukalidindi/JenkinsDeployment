import { AuthStrategy, AuthContext } from './auth.types';

export class ApiKeyAuth implements AuthStrategy {
  constructor(
    private keyName: string,
    private keyValue: string,
    private location: 'header' | 'query' | 'cookie' = 'header'
  ) {}

  async authenticate(): Promise<AuthContext> {
    return {
      apiKey: {
        name: this.keyName,
        value: this.keyValue,
        location: this.location,
      },
    };
  }
}
