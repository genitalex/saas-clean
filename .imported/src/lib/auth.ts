import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';

import { db } from './db';
import * as schema from './db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications
    }
  }),

  session: {
    additionalFields: {
      activeOrganizationId: {
        type: 'string',
        required: false,
        input: false
      }
    }
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID()
    }
  },

  emailAndPassword: {
    enabled: true
  }
});
