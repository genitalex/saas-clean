import 'server-only';

import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { customers, events, organizationMembers, tasks, users } from '@/lib/db/schema';
import { taskPayloadSchema, taskUpdateSchema } from '../schemas/task';
import type { TaskFilters, TaskPayload, TaskUpdatePayload } from '../types';
import { recordSystemActivity } from '@/features/activities/actions/service';

export class TaskServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_REFERENCE' | 'INVALID_PAYLOAD'
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

const taskSelection = {
  id: tasks.id,
  organizationId: tasks.organizationId,
  customerId: tasks.customerId,
  eventId: tasks.eventId,
  assigneeId: tasks.assigneeId,
  title: tasks.title,
  description: tasks.description,
  status: tasks.status,
  priority: tasks.priority,
  dueAt: tasks.dueAt,
  waitingOn: tasks.waitingOn,
  recurrenceRule: tasks.recurrenceRule,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  completedAt: tasks.completedAt,
  customer: { id: customers.id, name: customers.name },
  event: { id: events.id, title: events.title },
  assignee: { id: users.id, name: users.name }
};

async function validateReferences(
  organizationId: string,
  customerId?: string | null,
  eventId?: string | null,
  assigneeId?: string | null
) {
  if (customerId) {
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.organizationId, organizationId),
          eq(customers.archived, false)
        )
      )
      .limit(1);
    if (!customer)
      throw new TaskServiceError(
        'Customer does not belong to the active organization',
        'INVALID_REFERENCE'
      );
  }

  if (eventId) {
    const [event] = await db
      .select({ id: events.id, customerId: events.customerId })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizationId, organizationId)))
      .limit(1);
    if (!event) {
      throw new TaskServiceError(
        'Event does not belong to the active organization',
        'INVALID_REFERENCE'
      );
    }
    if (customerId && event.customerId && event.customerId !== customerId) {
      throw new TaskServiceError(
        'Task customer does not match the linked event',
        'INVALID_REFERENCE'
      );
    }
  }

  if (assigneeId) {
    const [member] = await db
      .select({ id: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, assigneeId)
        )
      )
      .limit(1);
    if (!member)
      throw new TaskServiceError(
        'Assignee does not belong to the active organization',
        'INVALID_REFERENCE'
      );
  }
}

export async function getTasks(filters: TaskFilters = {}) {
  const { organization } = await getAuthContext();
  const search = filters.search?.trim();
  return db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(customers, eq(customers.id, tasks.customerId))
    .leftJoin(events, eq(events.id, tasks.eventId))
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(
      and(
        eq(tasks.organizationId, organization.id),
        filters.status ? eq(tasks.status, filters.status) : undefined,
        filters.priority ? eq(tasks.priority, filters.priority) : undefined,
        filters.customerId ? eq(tasks.customerId, filters.customerId) : undefined,
        filters.eventId ? eq(tasks.eventId, filters.eventId) : undefined,
        filters.assigneeId ? eq(tasks.assigneeId, filters.assigneeId) : undefined,
        search
          ? or(ilike(tasks.title, `%${search}%`), ilike(tasks.description, `%${search}%`))
          : undefined
      )
    )
    .orderBy(desc(tasks.createdAt));
}

export async function getTask(id: string) {
  const { organization } = await getAuthContext();
  const [task] = await db
    .select(taskSelection)
    .from(tasks)
    .leftJoin(customers, eq(customers.id, tasks.customerId))
    .leftJoin(events, eq(events.id, tasks.eventId))
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organization.id)))
    .limit(1);
  if (!task) throw new TaskServiceError('Task not found', 'NOT_FOUND');
  return task;
}

export async function createTask(input: TaskPayload) {
  const { organization } = await getAuthContext();
  const parsed = taskPayloadSchema.safeParse(input);
  if (!parsed.success) throw new TaskServiceError('Invalid task payload', 'INVALID_PAYLOAD');
  await validateReferences(
    organization.id,
    parsed.data.customerId,
    parsed.data.eventId,
    parsed.data.assigneeId
  );
  const now = new Date();
  const [created] = await db
    .insert(tasks)
    .values({
      organizationId: organization.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      customerId: parsed.data.customerId || null,
      eventId: parsed.data.eventId || null,
      assigneeId: parsed.data.assigneeId || null,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: tasks.id });
  if (parsed.data.customerId)
    await recordSystemActivity(
      parsed.data.customerId,
      'Tarea creada',
      { taskId: created.id },
      parsed.data.eventId
    );
  return getTask(created.id);
}

export async function updateTask(id: string, input: TaskUpdatePayload) {
  const { organization } = await getAuthContext();
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) throw new TaskServiceError('Invalid task payload', 'INVALID_PAYLOAD');
  const previous = parsed.data.status === 'done' ? await getTask(id) : null;
  await validateReferences(
    organization.id,
    parsed.data.customerId,
    parsed.data.eventId,
    parsed.data.assigneeId
  );
  const now = new Date();
  const [updated] = await db
    .update(tasks)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description || null
      }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.dueAt !== undefined && {
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null
      }),
      ...(parsed.data.waitingOn !== undefined && {
        waitingOn: parsed.data.waitingOn || null
      }),
      ...(parsed.data.recurrenceRule !== undefined && {
        recurrenceRule: parsed.data.recurrenceRule || null
      }),
      ...(parsed.data.customerId !== undefined && { customerId: parsed.data.customerId || null }),
      ...(parsed.data.eventId !== undefined && { eventId: parsed.data.eventId || null }),
      ...(parsed.data.assigneeId !== undefined && { assigneeId: parsed.data.assigneeId || null }),
      ...(parsed.data.status !== undefined && {
        status: parsed.data.status,
        completedAt: parsed.data.status === 'done' ? now : null
      }),
      updatedAt: now
    })
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organization.id)))
    .returning({ id: tasks.id });
  if (!updated) throw new TaskServiceError('Task not found', 'NOT_FOUND');
  if (
    parsed.data.status === 'done' &&
    previous &&
    previous.status !== 'done' &&
    previous.customerId
  ) {
    await recordSystemActivity(
      previous.customerId,
      'Tarea completada',
      { taskId: id },
      previous.eventId
    );
  }
  if (
    parsed.data.status === 'done' &&
    previous &&
    previous.status !== 'done' &&
    previous.recurrenceRule
  ) {
    const nextDueAt = nextRecurrenceDate(previous.dueAt, previous.recurrenceRule);
    await db.insert(tasks).values({
      organizationId: organization.id,
      customerId: previous.customerId,
      eventId: null,
      assigneeId: previous.assigneeId,
      title: previous.title,
      description: previous.description,
      priority: previous.priority,
      dueAt: nextDueAt,
      recurrenceRule: previous.recurrenceRule,
      waitingOn: null,
      createdAt: now,
      updatedAt: now
    });
  }
  return getTask(updated.id);
}

function nextRecurrenceDate(dueAt: Date | null, rule: 'daily' | 'weekly' | 'monthly') {
  const next = new Date(dueAt ?? new Date());
  if (rule === 'daily') next.setDate(next.getDate() + 1);
  if (rule === 'weekly') next.setDate(next.getDate() + 7);
  if (rule === 'monthly') next.setMonth(next.getMonth() + 1);
  return next;
}

export async function deleteTask(id: string) {
  const { organization } = await getAuthContext();
  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organization.id)))
    .returning({ id: tasks.id });
  if (!deleted) throw new TaskServiceError('Task not found', 'NOT_FOUND');
  return deleted;
}

export async function completeTask(id: string) {
  return updateTask(id, { status: 'done' });
}

export async function updateTaskStatus(
  id: string,
  status: 'todo' | 'in_progress' | 'waiting' | 'done'
) {
  return updateTask(id, { status });
}
