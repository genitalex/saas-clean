import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let pool: Pool | undefined;

if (connectionString) {
  pool = new Pool({
    connectionString,
    max: 3,
    maxUses: 20,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    allowExitOnIdle: true
  });
}

export const db = pool
  ? drizzle(pool, { schema })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Database access requires DATABASE_URL. Connect the project database integration or set DATABASE_URL.'
          );
        }
      }
    ) as ReturnType<typeof drizzle<typeof schema>>);
