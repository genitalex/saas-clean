import { db } from '@/lib/db';
import {
  automations,
  notifications,
  attentionItems,
  customers,
  notificationPreferences,
  organizationMembers,
  users
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type {
  Automation,
  AutomationPayload,
  AutomationFilters,
  Notification,
  NotificationPayload,
  AttentionItem,
  AttentionItemPayload
} from '../types';

/* ---------- Automations ---------- */

export async function getAutomations(
  organizationId: string,
  filters?: AutomationFilters
): Promise<Automation[]> {
  const conditions = [eq(automations.organizationId, organizationId)];

  if (filters?.enabled !== undefined) {
    conditions.push(eq(automations.enabled, filters.enabled));
  }

  if (filters?.trigger) {
    conditions.push(eq(automations.trigger, filters.trigger));
  }

  if (filters?.action) {
    conditions.push(eq(automations.action, filters.action));
  }

  return db.query.automations.findMany({
    where: and(...conditions)
  });
}

export async function createAutomation(
  organizationId: string,
  payload: AutomationPayload
): Promise<Automation> {
  const result = await db
    .insert(automations)
    .values({
      organizationId,
      trigger: payload.trigger,
      action: payload.action,
      config: payload.config || {},
      enabled: payload.enabled ?? true
    })
    .returning();

  return result[0];
}

export async function updateAutomation(
  automationId: string,
  payload: Partial<AutomationPayload>
): Promise<Automation> {
  const result = await db
    .update(automations)
    .set({
      ...payload,
      updatedAt: new Date()
    })
    .where(eq(automations.id, automationId))
    .returning();

  return result[0];
}

export async function toggleAutomation(
  automationId: string,
  enabled: boolean
): Promise<Automation> {
  return updateAutomation(automationId, { enabled });
}

export async function deleteAutomation(automationId: string): Promise<void> {
  await db.delete(automations).where(eq(automations.id, automationId));
}

/* ---------- Notifications ---------- */

const notificationPreferenceKey = {
  task_assigned: 'taskAssigned',
  task_overdue: 'taskOverdue',
  follow_up_overdue: 'followUpOverdue',
  task_blocked: 'taskBlocked',
  waiting_ready: 'waitingReady',
  automation_executed: 'automationExecuted',
  event_important: 'eventImportant',
  task_status_changed: 'taskStatusChanged',
  team_member_joined: 'teamMemberJoined',
  customer_updated: 'customerUpdated',
  event_updated: 'eventUpdated',
  opportunity_updated: 'opportunityUpdated'
} as const;

type NotificationPreferenceKey =
  (typeof notificationPreferenceKey)[keyof typeof notificationPreferenceKey];

async function notificationAllowed(
  organizationId: string,
  userId: string,
  type: Notification['type']
) {
  const [preferences] = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.organizationId, organizationId),
        eq(notificationPreferences.userId, userId)
      )
    )
    .limit(1);
  if (!preferences) return true;
  const key = notificationPreferenceKey[type] as NotificationPreferenceKey;
  return preferences[key] !== false;
}

export async function createNotificationIfAllowed(
  organizationId: string,
  userId: string,
  payload: NotificationPayload
) {
  if (!(await notificationAllowed(organizationId, userId, payload.type))) return null;
  return createNotification(organizationId, userId, payload);
}

export async function notifyOrganizationMembers(
  organizationId: string,
  actorId: string,
  payload: Omit<NotificationPayload, 'type'> & { type: Notification['type']; userIds?: string[] }
) {
  const targetUserIds =
    payload.userIds ??
    (
      await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId))
    ).map((row) => row.userId);

  const created = [];
  for (const userId of targetUserIds) {
    if (userId === actorId) continue;
    if (!(await notificationAllowed(organizationId, userId, payload.type))) continue;
    created.push(await createNotification(organizationId, userId, payload));
  }
  return created;
}

export async function getNotifications(
  organizationId: string,
  userId: string,
  unreadOnly: boolean = false,
  take: number = 50
): Promise<Notification[]> {
  const conditions = [
    eq(notifications.organizationId, organizationId),
    eq(notifications.userId, userId)
  ];

  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  return db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: desc(notifications.createdAt),
    limit: take ?? 50
  });
}

export async function getUnreadNotificationCount(
  organizationId: string,
  userId: string
): Promise<number> {
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )
    );

  return result.length;
}

export async function createNotification(
  organizationId: string,
  userId: string,
  payload: NotificationPayload
): Promise<Notification> {
  const result = await db
    .insert(notifications)
    .values({
      organizationId,
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      refEntityType: payload.refEntityType,
      refEntityId: payload.refEntityId,
      read: false
    })
    .returning();

  return result[0];
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(
  organizationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )
    );
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

/* ---------- Attention Items ---------- */

export async function getAttentionItems(
  organizationId: string,
  userId: string,
  status: string = 'active'
): Promise<(AttentionItem & { customer?: { id: string; name: string } | null })[]> {
  const rows = await db
    .select({
      attentionItem: attentionItems,
      customer: { id: customers.id, name: customers.name }
    })
    .from(attentionItems)
    .leftJoin(customers, eq(customers.id, attentionItems.customerId))
    .where(
      and(
        eq(attentionItems.organizationId, organizationId),
        eq(attentionItems.userId, userId),
        eq(attentionItems.status, status)
      )
    )
    .orderBy(desc(attentionItems.createdAt));

  return rows.map(({ attentionItem, customer }) => ({ ...attentionItem, customer }));
}

export async function createAttentionItem(
  organizationId: string,
  userId: string,
  payload: AttentionItemPayload
): Promise<AttentionItem> {
  // Check if attention item already exists for this entity
  const existing = await db
    .select()
    .from(attentionItems)
    .where(
      and(
        eq(attentionItems.refEntityType, payload.refEntityType),
        eq(attentionItems.refEntityId, payload.refEntityId),
        eq(attentionItems.userId, userId)
      )
    );

  // If exists and active, update status instead
  if (existing.length > 0 && existing[0].status === 'active') {
    return existing[0];
  }

  const result = await db
    .insert(attentionItems)
    .values({
      organizationId,
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      refEntityType: payload.refEntityType,
      refEntityId: payload.refEntityId,
      customerId: payload.customerId,
      status: 'active'
    })
    .returning();

  const created = result[0];
  try {
    if (
      await notificationAllowed(
        organizationId,
        userId,
        payload.type === 'task_overdue' ? 'task_overdue' : 'waiting_ready'
      )
    ) {
      await createNotificationIfAllowed(organizationId, userId, {
        type: payload.type === 'task_overdue' ? 'task_overdue' : 'waiting_ready',
        title: payload.title,
        message: payload.message,
        refEntityType: payload.refEntityType,
        refEntityId: payload.refEntityId
      });
    }
  } catch (error) {
    console.error('[automations:notification]', error);
  }
  return created;
}

export async function acknowledgeAttentionItem(attentionItemId: string): Promise<void> {
  await db
    .update(attentionItems)
    .set({ status: 'acknowledged' })
    .where(eq(attentionItems.id, attentionItemId));
}

export async function resolveAttentionItem(attentionItemId: string): Promise<void> {
  await db
    .update(attentionItems)
    .set({ status: 'resolved' })
    .where(eq(attentionItems.id, attentionItemId));
}

export async function deleteAttentionItem(attentionItemId: string): Promise<void> {
  await db.delete(attentionItems).where(eq(attentionItems.id, attentionItemId));
}

export async function getAttentionItemsForEntity(
  refEntityType: string,
  refEntityId: string,
  organizationId?: string,
  userId?: string
): Promise<AttentionItem[]> {
  return db.query.attentionItems.findMany({
    where: and(
      eq(attentionItems.refEntityType, refEntityType),
      eq(attentionItems.refEntityId, refEntityId),
      organizationId ? eq(attentionItems.organizationId, organizationId) : undefined,
      userId ? eq(attentionItems.userId, userId) : undefined
    )
  });
}
