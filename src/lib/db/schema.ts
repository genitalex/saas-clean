import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/* Better Auth                                                               */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)]
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),
    token: text('token').notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),
    activeOrganizationId: uuid('active_organization_id')
  },
  (table) => [
    uniqueIndex('sessions_token_idx').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_active_organization_id_idx').on(table.activeOrganizationId)
  ]
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    accountId: text('account_id').notNull(),

    providerId: text('provider_id').notNull(),

    // Better Auth uses issuer + accountId to identify
    // the provider-side account identity.
    issuer: text('issuer').notNull(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),

    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),

    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true
    }),

    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true
    }),

    scope: text('scope'),
    password: text('password'),

    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex('accounts_issuer_account_idx').on(table.issuer, table.accountId),
    index('accounts_user_id_idx').on(table.userId)
  ]
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    identifier: text('identifier').notNull(),
    value: text('value').notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)]
);

/* -------------------------------------------------------------------------- */
/* Organizations / Workspaces                                                */
/* -------------------------------------------------------------------------- */

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),

    slug: text('slug').notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex('organizations_slug_idx').on(table.slug),
    index('organizations_name_idx').on(table.name)
  ]
);

export const organizationMembers = pgTable(
  'organization_members',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, {
        onDelete: 'cascade'
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade'
      }),

    role: text('role').notNull().default('member'),

    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex('organization_members_org_user_idx').on(table.organizationId, table.userId),

    index('organization_members_user_id_idx').on(table.userId),

    index('organization_members_organization_id_idx').on(table.organizationId)
  ]
);

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export const customerKind = pgEnum('customer_kind', ['person', 'company']);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, {
        onDelete: 'cascade'
      }),

    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'set null'
    }),

    kind: customerKind('kind').notNull(),

    name: text('name').notNull(),

    email: text('email'),

    phone: text('phone'),

    address: text('address'),

    nextAction: text('next_action'),

    nextActionAt: timestamp('next_action_at', {
      withTimezone: true
    }),

    archived: boolean('archived').notNull().default(false),

    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index('customers_organization_id_idx').on(table.organizationId),

    index('customers_organization_archived_idx').on(table.organizationId, table.archived),

    index('customers_organization_kind_idx').on(table.organizationId, table.kind),

    index('customers_organization_updated_at_idx').on(table.organizationId, table.updatedAt)
  ]
);
