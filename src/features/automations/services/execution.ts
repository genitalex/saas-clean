import { db } from '@/lib/db';
import { eq, and, lt, ne } from 'drizzle-orm';
import { tasks, events, customers, activities, attentionItems } from '@/lib/db/schema';
import type { AutomationTrigger } from '../types';
import * as service from '../api/service';

/**
 * Automation Execution Engine
 *
 * This service handles:
 * 1. Detecting automation triggers
 * 2. Executing automation actions
 * 3. Preventing duplicate executions (idempotency)
 */

/* ---------- Automation Actions ---------- */

async function createFollowUpTask(
  organizationId: string,
  userId: string,
  originalTaskId: string,
  daysDelay: number = 3
) {
  const originalTask = await db.query.tasks.findFirst({
    where: eq(tasks.id, originalTaskId)
  });

  if (!originalTask) return null;

  // Create follow-up task
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + daysDelay);

  const followUpTask = await db
    .insert(tasks)
    .values({
      organizationId,
      assigneeId: userId,
      title: `Follow-up: ${originalTask.title}`,
      description: originalTask.description ? `Original: ${originalTask.description}` : undefined,
      status: 'todo',
      priority: originalTask.priority,
      dueAt: followUpDate,
      customerId: originalTask.customerId,
      followUpForTaskId: originalTaskId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return followUpTask[0];
}

async function createAttentionForOverdueTask(
  organizationId: string,
  taskId: string,
  userId: string
) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task || task.status === 'done') return null;

  const customer = task.customerId
    ? await db.query.customers.findFirst({
        where: eq(customers.id, task.customerId)
      })
    : null;

  await service.createAttentionItem(organizationId, userId, {
    type: 'task_overdue',
    title: `Task overdue: ${task.title}`,
    message: `"${task.title}" is overdue${customer ? ` for ${customer.name}` : ''}`,
    refEntityType: 'task',
    refEntityId: taskId,
    customerId: task.customerId
  });
}

async function createAttentionForWaitingDue(
  organizationId: string,
  taskId: string,
  userId: string
) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task || task.status !== 'waiting') return null;

  const customer = task.customerId
    ? await db.query.customers.findFirst({
        where: eq(customers.id, task.customerId)
      })
    : null;

  await service.createAttentionItem(organizationId, userId, {
    type: 'waiting_ready',
    title: `Ready to resume: ${task.title}`,
    message: `"${task.title}" is ready to resume${customer ? ` for ${customer.name}` : ''}`,
    refEntityType: 'task',
    refEntityId: taskId,
    customerId: task.customerId
  });
}

async function checkCustomerInactivity(
  organizationId: string,
  customerId: string,
  userId: string,
  daysSinceActivity: number = 7
) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId)
  });

  if (!customer || customer.archived) return null;

  // Check if customer has any recent activities
  const recentActivities = await db.query.activities.findMany({
    where: and(eq(activities.customerId, customerId))
  });

  if (recentActivities.length === 0) {
    await service.createAttentionItem(organizationId, userId, {
      type: 'customer_inactive',
      title: `No activity: ${customer.name}`,
      message: `No activity from ${customer.name} in the last ${daysSinceActivity} days`,
      refEntityType: 'customer',
      refEntityId: customerId,
      customerId
    });
  }
}

/* ---------- Automation Detection & Execution ---------- */

export async function executeAutomationsForTaskCompletion(
  organizationId: string,
  taskId: string,
  userId: string
) {
  const automations = await service.getAutomations(organizationId, {
    trigger: 'task_completed',
    enabled: true
  });

  for (const automation of automations) {
    if (automation.action === 'create_follow_up') {
      const daysDelay = (automation.config as any)?.daysDelay || 3;
      await createFollowUpTask(organizationId, userId, taskId, daysDelay);

      await service.createNotification(organizationId, userId, {
        type: 'automation_executed',
        title: 'Follow-up created',
        message: 'A follow-up task has been created automatically',
        refEntityType: 'task',
        refEntityId: taskId
      });
    }
  }
}

export async function executeAutomationsForTaskOverdue(
  organizationId: string,
  taskId: string,
  userId: string
) {
  const automations = await service.getAutomations(organizationId, {
    trigger: 'task_overdue',
    enabled: true
  });

  for (const automation of automations) {
    if (automation.action === 'create_attention' || automation.action === 'mark_attention') {
      await createAttentionForOverdueTask(organizationId, taskId, userId);
    }
  }
}

export async function executeAutomationsForWaitingDue(
  organizationId: string,
  taskId: string,
  userId: string
) {
  const automations = await service.getAutomations(organizationId, {
    trigger: 'waiting_due',
    enabled: true
  });

  for (const automation of automations) {
    if (automation.action === 'create_attention' || automation.action === 'mark_attention') {
      await createAttentionForWaitingDue(organizationId, taskId, userId);
    }
  }
}

export async function executeAutomationsForCustomerInactivity(
  organizationId: string,
  customerId: string,
  userId: string
) {
  const automations = await service.getAutomations(organizationId, {
    trigger: 'customer_inactive',
    enabled: true
  });

  for (const automation of automations) {
    if (automation.action === 'create_attention' || automation.action === 'mark_attention') {
      const daysSinceActivity = (automation.config as any)?.daysSinceActivity || 7;
      await checkCustomerInactivity(organizationId, customerId, userId, daysSinceActivity);
    }
  }
}

export async function executeAutomationsForEventCompletion(
  organizationId: string,
  eventId: string,
  userId: string
) {
  const automations = await service.getAutomations(organizationId, {
    trigger: 'event_completed',
    enabled: true
  });

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId)
  });

  if (!event) return;

  for (const automation of automations) {
    if (automation.action === 'create_task') {
      // Create a new task from completed event
      await db
        .insert(tasks)
        .values({
          organizationId,
          assigneeId: userId,
          title: `Follow-up: ${event.title}`,
          description: event.description,
          status: 'todo',
          priority: 'medium',
          customerId: event.customerId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      await service.createNotification(organizationId, userId, {
        type: 'automation_executed',
        title: 'Task created',
        message: 'A task has been created from the completed event',
        refEntityType: 'event',
        refEntityId: eventId
      });
    }
  }
}

/* ---------- Batch Processing (for scheduled execution) ---------- */

/**
 * Check all tasks for overdue status and create attention items
 * This should be run periodically (e.g., via cron or scheduled job)
 */
export async function checkAndProcessOverdueTasks(organizationId: string) {
  // Get all tasks that are not done
  const allTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.organizationId, organizationId), ne(tasks.status, 'done'))
  });

  // Filter for overdue in JavaScript
  const now = new Date();
  const overdueTasks = allTasks.filter((task) => task.dueAt && task.dueAt <= now);

  for (const task of overdueTasks) {
    // Check if attention item already exists
    const existingAttention = await db.query.attentionItems.findFirst({
      where: and(
        eq(attentionItems.refEntityType, 'task'),
        eq(attentionItems.refEntityId, task.id),
        eq(attentionItems.status, 'active')
      )
    });

    if (!existingAttention && task.assigneeId) {
      await createAttentionForOverdueTask(organizationId, task.id, task.assigneeId);
    }
  }
}

/**
 * Check waiting tasks for due dates
 */
export async function checkAndProcessWaitingTasks(organizationId: string) {
  const waitingTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.organizationId, organizationId), eq(tasks.status, 'waiting'))
  });

  for (const task of waitingTasks) {
    // Check if the waiting period has ended (dueAt is now or in the past)
    if (task.dueAt && task.dueAt <= new Date()) {
      const existingAttention = await db.query.attentionItems.findFirst({
        where: and(
          eq(attentionItems.refEntityType, 'task'),
          eq(attentionItems.refEntityId, task.id),
          eq(attentionItems.status, 'active')
        )
      });

      if (!existingAttention && task.assigneeId) {
        await createAttentionForWaitingDue(organizationId, task.id, task.assigneeId);
      }
    }
  }
}
