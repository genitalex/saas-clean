import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

/**
 * Keep module loading safe for routes that do not need the database (including
 * the unauthenticated dashboard redirect in the preview). The first database
 * operation still fails with an actionable message when the integration has
 * not been configured.
 */
export const db = connectionString
  ? drizzle(new Pool({ connectionString }), { schema })
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
