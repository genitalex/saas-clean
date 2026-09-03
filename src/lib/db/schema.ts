import {
  boolean,
  type AnyPgColumn,
  index,
  jsonb,
  primaryKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer
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

export const taskStatus = pgEnum('task_status', ['todo', 'in_progress', 'waiting', 'done']);

export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high']);

export const taskRecurrence = pgEnum('task_recurrence', ['daily', 'weekly', 'monthly']);

export const eventStatus = pgEnum('event_status', ['planned', 'in_progress', 'done', 'cancelled']);

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

    website: text('website'),

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

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),

    title: text('title').notNull(),
    description: text('description'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    allDay: boolean('all_day').notNull().default(false),
    location: text('location'),
    url: text('url'),
    status: eventStatus('status').notNull().default('planned'),
    color: text('color'),
    reminderMinutes: integer('reminder_minutes'),
    repeatRule: text('repeat_rule'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('events_organization_id_idx').on(table.organizationId),
    index('events_customer_id_idx').on(table.customerId),
    index('events_assignee_id_idx').on(table.assigneeId),
    index('events_start_at_idx').on(table.startAt),
    index('events_status_idx').on(table.status),
    index('events_organization_start_at_idx').on(table.organizationId, table.startAt)
  ]
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),

    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),

    parentTaskId: uuid('parent_task_id').references((): AnyPgColumn => tasks.id, {
      onDelete: 'cascade'
    }),

    followUpForTaskId: uuid('follow_up_for_task_id').references((): AnyPgColumn => tasks.id, {
      onDelete: 'set null'
    }),

    title: text('title').notNull(),
    description: text('description'),
    status: taskStatus('status').notNull().default('todo'),
    priority: taskPriority('priority').notNull().default('medium'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    waitingOn: text('waiting_on'),
    recurrenceRule: taskRecurrence('recurrence_rule'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => [
    index('tasks_organization_id_idx').on(table.organizationId),
    index('tasks_customer_id_idx').on(table.customerId),
    index('tasks_event_id_idx').on(table.eventId),
    index('tasks_assignee_id_idx').on(table.assigneeId),
    index('tasks_parent_task_id_idx').on(table.parentTaskId),
    index('tasks_follow_up_for_task_id_idx').on(table.followUpForTaskId),
    index('tasks_status_idx').on(table.status),
    index('tasks_due_at_idx').on(table.dueAt),
    index('tasks_recurrence_rule_idx').on(table.recurrenceRule),
    index('tasks_organization_status_idx').on(table.organizationId, table.status)
  ]
);

export const taskDependencies = pgTable(
  'task_dependencies',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    blockingTaskId: uuid('blocking_task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.blockingTaskId] }),
    index('task_dependencies_blocking_task_id_idx').on(table.blockingTaskId)
  ]
);

export const taskWorkflowHistory = pgTable(
  'task_workflow_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('task_workflow_history_task_created_idx').on(table.taskId, table.createdAt)]
);

export const savedViews = pgTable(
  'saved_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    entity: text('entity').notNull().default('tasks'),
    name: text('name').notNull(),
    filters: jsonb('filters').notNull().default({}),
    sortBy: text('sort_by'),
    groupBy: text('group_by'),
    favorite: boolean('favorite').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('saved_views_org_user_idx').on(table.organizationId, table.userId),
    index('saved_views_entity_idx').on(table.entity),
    index('saved_views_favorite_idx').on(table.organizationId, table.favorite)
  ]
);

export const activityType = pgEnum('activity_type', [
  'note',
  'call',
  'email',
  'status_change',
  'system'
]);

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),

    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    type: activityType('type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('activities_organization_id_idx').on(table.organizationId),
    index('activities_customer_id_idx').on(table.customerId),
    index('activities_event_id_idx').on(table.eventId),
    index('activities_user_id_idx').on(table.userId),
    index('activities_created_at_idx').on(table.createdAt),
    index('activities_organization_customer_idx').on(table.organizationId, table.customerId)
  ]
);

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    tag: text('tag'),
    pinned: boolean('pinned').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('notes_organization_id_idx').on(table.organizationId),
    index('notes_user_id_idx').on(table.userId),
    index('notes_organization_user_updated_idx').on(
      table.organizationId,
      table.userId,
      table.updatedAt
    )
  ]
);

/* -------------------------------------------------------------------------- */
/* Automations & Notifications                                               */
/* -------------------------------------------------------------------------- */

export const automationTrigger = pgEnum('automation_trigger', [
  'task_completed',
  'event_completed',
  'waiting_due',
  'task_overdue',
  'customer_inactive'
]);

export const automationAction = pgEnum('automation_action', [
  'create_follow_up',
  'create_task',
  'create_attention',
  'mark_attention'
]);

export const automations = pgTable(
  'automations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    enabled: boolean('enabled').notNull().default(true),

    trigger: automationTrigger('trigger').notNull(),

    action: automationAction('action').notNull(),

    // Configuration varies by automation type (JSON: delays, days, etc.)
    config: jsonb('config').notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('automations_organization_id_idx').on(table.organizationId),
    index('automations_enabled_idx').on(table.enabled)
  ]
);

export const notificationType = pgEnum('notification_type', [
  'task_assigned',
  'task_overdue',
  'follow_up_overdue',
  'task_blocked',
  'waiting_ready',
  'automation_executed',
  'event_important'
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: notificationType('type').notNull(),

    title: text('title').notNull(),

    message: text('message').notNull(),

    read: boolean('read').notNull().default(false),

    // Reference to originating entity (task, event, etc.)
    refEntityType: text('ref_entity_type'),
    refEntityId: uuid('ref_entity_id'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('notifications_organization_id_idx').on(table.organizationId),
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_read_idx').on(table.read),
    index('notifications_org_user_read_idx').on(table.organizationId, table.userId, table.read),
    index('notifications_created_at_idx').on(table.createdAt)
  ]
);

export const attentionItemType = pgEnum('attention_item_type', [
  'task_overdue',
  'follow_up_overdue',
  'task_blocked',
  'waiting_ready',
  'customer_inactive'
]);

export const attentionItems = pgTable(
  'attention_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: attentionItemType('type').notNull(),

    title: text('title').notNull(),

    message: text('message').notNull(),

    // Reference to originating entity
    refEntityType: text('ref_entity_type').notNull(),
    refEntityId: uuid('ref_entity_id').notNull(),

    // Customer context if applicable
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),

    // Status: active, acknowledged, resolved
    status: text('status').notNull().default('active'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('attention_items_organization_id_idx').on(table.organizationId),
    index('attention_items_user_id_idx').on(table.userId),
    index('attention_items_status_idx').on(table.status),
    index('attention_items_org_user_status_idx').on(
      table.organizationId,
      table.userId,
      table.status
    ),
    index('attention_items_created_at_idx').on(table.createdAt),
    // Prevent duplicates: one active attention item per entity/user
    uniqueIndex('attention_items_entity_user_idx').on(
      table.refEntityType,
      table.refEntityId,
      table.userId
    )
  ]
);
