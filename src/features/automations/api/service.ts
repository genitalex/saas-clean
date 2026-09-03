import { db } from '@/lib/db';
import { automations, notifications, attentionItems } from '@/lib/db/schema';
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
  const items = await db.query.attentionItems.findMany({
    where: and(
      eq(attentionItems.organizationId, organizationId),
      eq(attentionItems.userId, userId),
      eq(attentionItems.status, status)
    ),
    orderBy: desc(attentionItems.createdAt),
    with: {
      customer: {
        columns: { id: true, name: true }
      }
    }
  });

  return items;
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
    await createNotification(organizationId, userId, {
      type: payload.type === 'task_overdue' ? 'task_overdue' : 'waiting_ready',
      title: payload.title,
      message: payload.message,
      refEntityType: payload.refEntityType,
      refEntityId: payload.refEntityId
    });
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
