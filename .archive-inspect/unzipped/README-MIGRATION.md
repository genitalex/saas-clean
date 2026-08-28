# Clean Clerk -> Better Auth migration

This project starts from the Kiranism dashboard after its official Clerk cleanup, then adds a local Better Auth + PostgreSQL/Drizzle authentication layer, local workspaces/organizations, and the Customers module.

## Environment

Create `.env.local` (never commit it):

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
```

## Database

The base Better Auth migration is `drizzle/0000_adorable_nemesis.sql` from the clean project. The SaaS-specific migration is `drizzle/0001_better_auth_saas.sql`.

Apply pending migrations with:

```bash
bunx drizzle-kit migrate
```

## Run

```bash
bun run typecheck
bun run build
bun run dev
```

Then open `http://localhost:3000/auth/sign-up`.
