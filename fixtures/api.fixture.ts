import { test as base, request, APIRequestContext } from '@playwright/test';
import { APIClient } from '../src/api-client';
import { BasicAuth } from '../src/auth/basic-auth';

type TestFixtures = {
  api: APIClient;
};

type WorkerFixtures = {
  apiContext: APIRequestContext;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({

  apiContext: [async ({}, use) => {
    const ctx = await request.newContext();
    await use(ctx);
    await ctx.dispose();
  }, { scope: 'worker' }],

  api: async ({ apiContext }, use) => {
    const auth = new BasicAuth('user', 'pass');

    const api = new APIClient(
      apiContext,
      'https://httpbin.org',
      auth
    );

    await api.init();
    await use(api);
  },
});
