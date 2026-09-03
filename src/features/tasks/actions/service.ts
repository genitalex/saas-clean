import 'server-only';

import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import {
  customers,
  events,
  organizationMembers,
  taskDependencies,
  taskWorkflowHistory,
  tasks,
  users
} from '@/lib/db/schema';
import { taskPayloadSchema, taskUpdateSchema } from '../schemas/task';
import type {
  Task,
  TaskDependency,
  TaskFilters,
  TaskPayload,
  TaskUpdatePayload,
  TaskWorkspace
} from '../types';
import { recordSystemActivity } from '@/features/activities/actions/service';
import { executeAutomationsForTaskCompletion } from '@/features/automations/services/execution';

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
  parentTaskId: tasks.parentTaskId,
  followUpForTaskId: tasks.followUpForTaskId,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  completedAt: tasks.completedAt,
  customer: { id: customers.id, name: customers.name },
  event: { id: events.id, title: events.title },
  assignee: { id: users.id, name: users.name }
};

function pickDependency(candidate: TaskDependency | null) {
  return candidate ? { id: candidate.id, title: candidate.title, status: candidate.status } : null;
}

async function recordTaskHistory(taskId: string, type: string, message: string) {
  try {
    const { user } = await getAuthContext();
    await db.insert(taskWorkflowHistory).values({ taskId, actorId: user.id, type, message });
  } catch (error) {
    console.error('[tasks:history]', error);
  }
}

async function validateReferences(
  organizationId: string,
  customerId?: string | null,
  eventId?: string | null,
  assigneeId?: string | null,
  parentTaskId?: string | null,
  followUpForTaskId?: string | null,
  currentTaskId?: string
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

  for (const relatedTaskId of [parentTaskId, followUpForTaskId]) {
    if (!relatedTaskId) continue;
    const [relatedTask] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, relatedTaskId), eq(tasks.organizationId, organizationId)))
      .limit(1);
    if (!relatedTask)
      throw new TaskServiceError(
        'Related task does not belong to the active organization',
        'INVALID_REFERENCE'
      );
  }

  if (
    (parentTaskId && parentTaskId === followUpForTaskId) ||
    (currentTaskId && (parentTaskId === currentTaskId || followUpForTaskId === currentTaskId))
  )
    throw new TaskServiceError('A task cannot relate to itself', 'INVALID_REFERENCE');
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
        filters.parentTaskId ? eq(tasks.parentTaskId, filters.parentTaskId) : undefined,
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
    parsed.data.assigneeId,
    parsed.data.parentTaskId,
    parsed.data.followUpForTaskId
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
      recurrenceRule: parsed.data.recurrenceRule || null,
      customerId: parsed.data.customerId || null,
      eventId: parsed.data.eventId || null,
      assigneeId: parsed.data.assigneeId || null,
      parentTaskId: parsed.data.parentTaskId || null,
      followUpForTaskId: parsed.data.followUpForTaskId || null,
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
  await recordTaskHistory(created.id, 'created', 'Tarea creada');
  if (parsed.data.parentTaskId)
    await recordTaskHistory(
      parsed.data.parentTaskId,
      'subtask_created',
      `Subtarea creada: ${parsed.data.title}`
    );
  if (parsed.data.followUpForTaskId)
    await recordTaskHistory(
      parsed.data.followUpForTaskId,
      'follow_up_created',
      `Seguimiento creado: ${parsed.data.title}`
    );
  if (parsed.data.followUpForTaskId && parsed.data.customerId)
    await recordSystemActivity(parsed.data.customerId, 'Seguimiento creado', {
      taskId: created.id
    });
  return getTask(created.id);
}

export async function updateTask(id: string, input: TaskUpdatePayload) {
  const { organization, user } = await getAuthContext();
  const parsed = taskUpdateSchema.safeParse(input);
  if (!parsed.success) throw new TaskServiceError('Invalid task payload', 'INVALID_PAYLOAD');
  const previous = await getTask(id);
  await validateReferences(
    organization.id,
    parsed.data.customerId,
    parsed.data.eventId,
    parsed.data.assigneeId,
    parsed.data.parentTaskId,
    parsed.data.followUpForTaskId,
    id
  );
  const nextDueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;
  let linkedEvent: { id: string; startAt: Date; endAt: Date } | null = null;
  if (parsed.data.dueAt !== undefined && previous.eventId && nextDueAt) {
    [linkedEvent] = await db
      .select({ id: events.id, startAt: events.startAt, endAt: events.endAt })
      .from(events)
      .where(and(eq(events.id, previous.eventId), eq(events.organizationId, organization.id)))
      .limit(1);
  }
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
        dueAt: nextDueAt
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
      ...(parsed.data.parentTaskId !== undefined && {
        parentTaskId: parsed.data.parentTaskId || null
      }),
      ...(parsed.data.followUpForTaskId !== undefined && {
        followUpForTaskId: parsed.data.followUpForTaskId || null
      }),
      ...(parsed.data.status !== undefined && {
        status: parsed.data.status,
        completedAt: parsed.data.status === 'done' ? now : null
      }),
      updatedAt: now
    })
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organization.id)))
    .returning({ id: tasks.id });
  if (!updated) throw new TaskServiceError('Task not found', 'NOT_FOUND');
  if (linkedEvent && nextDueAt) {
    const durationMs = linkedEvent.endAt.getTime() - linkedEvent.startAt.getTime();
    await db
      .update(events)
      .set({
        startAt: nextDueAt,
        endAt: new Date(nextDueAt.getTime() + durationMs),
        updatedAt: now
      })
      .where(and(eq(events.id, linkedEvent.id), eq(events.organizationId, organization.id)));
  }
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
    try {
      await executeAutomationsForTaskCompletion(
        organization.id,
        id,
        previous.assigneeId ?? user.id
      );
    } catch (error) {
      console.error('[automations:task-completed]', error);
    }
  }
  if (parsed.data.status && parsed.data.status !== previous.status) {
    const labels = { todo: 'Todo', in_progress: 'En curso', waiting: 'Esperando', done: 'Hecha' };
    await recordTaskHistory(id, 'status_changed', `Pasó a “${labels[parsed.data.status]}”`);
  }
  if (parsed.data.waitingOn !== undefined && parsed.data.waitingOn !== previous.waitingOn) {
    await recordTaskHistory(
      id,
      parsed.data.waitingOn ? 'waiting_set' : 'waiting_cleared',
      parsed.data.waitingOn ? `Esperando a ${parsed.data.waitingOn}` : 'Se eliminó la espera'
    );
    if (previous.customerId)
      await recordSystemActivity(
        previous.customerId,
        parsed.data.waitingOn ? 'Tarea en espera' : 'Tarea dejó de esperar',
        { taskId: id }
      );
  }
  if (parsed.data.dueAt !== undefined && parsed.data.dueAt !== previous.dueAt?.toISOString())
    await recordTaskHistory(
      id,
      'scheduled',
      parsed.data.dueAt ? 'Fecha planificada cambiada' : 'Se quitó la fecha planificada'
    );
  if (parsed.data.priority !== undefined && parsed.data.priority !== previous.priority)
    await recordTaskHistory(id, 'priority_changed', `Prioridad cambiada a ${parsed.data.priority}`);
  if (
    parsed.data.recurrenceRule !== undefined &&
    parsed.data.recurrenceRule !== previous.recurrenceRule
  )
    await recordTaskHistory(
      id,
      'recurrence_changed',
      parsed.data.recurrenceRule ? 'Recurrencia modificada' : 'Recurrencia eliminada'
    );
  if (parsed.data.status === 'done' && previous.status !== 'done' && previous.parentTaskId)
    await recordTaskHistory(
      previous.parentTaskId,
      'subtask_completed',
      `Subtarea completada: ${previous.title}`
    );
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

export async function getTaskWorkspace(id: string): Promise<TaskWorkspace> {
  const { organization } = await getAuthContext();
  const allTasks = await getTasks();
  const task = allTasks.find((candidate) => candidate.id === id);
  if (!task) throw new TaskServiceError('Task not found', 'NOT_FOUND');
  const subtasks = allTasks.filter((candidate) => candidate.parentTaskId === id);
  const parentTask = task.parentTaskId
    ? (allTasks.find((candidate) => candidate.id === task.parentTaskId) ?? null)
    : null;
  const dependencyRows = await db
    .select({ taskId: taskDependencies.taskId, blockingTaskId: taskDependencies.blockingTaskId })
    .from(taskDependencies)
    .innerJoin(tasks, eq(tasks.id, taskDependencies.taskId))
    .where(and(eq(tasks.organizationId, organization.id), eq(taskDependencies.taskId, id)));
  const blockingRows = await db
    .select({ taskId: taskDependencies.taskId, blockingTaskId: taskDependencies.blockingTaskId })
    .from(taskDependencies)
    .innerJoin(tasks, eq(tasks.id, taskDependencies.blockingTaskId))
    .where(and(eq(tasks.organizationId, organization.id), eq(taskDependencies.blockingTaskId, id)));
  const blockedBy = dependencyRows
    .map((row) => allTasks.find((candidate) => candidate.id === row.blockingTaskId))
    .filter((candidate): candidate is Task => Boolean(candidate));
  const blocks = blockingRows
    .map((row) => allTasks.find((candidate) => candidate.id === row.taskId))
    .filter((candidate): candidate is Task => Boolean(candidate));
  const followUp = allTasks.find((candidate) => candidate.followUpForTaskId === id) ?? null;
  const history = await db
    .select({
      id: taskWorkflowHistory.id,
      type: taskWorkflowHistory.type,
      message: taskWorkflowHistory.message,
      createdAt: taskWorkflowHistory.createdAt,
      actor: { id: users.id, name: users.name }
    })
    .from(taskWorkflowHistory)
    .leftJoin(users, eq(users.id, taskWorkflowHistory.actorId))
    .where(eq(taskWorkflowHistory.taskId, id))
    .orderBy(desc(taskWorkflowHistory.createdAt))
    .limit(40);
  return {
    task,
    parent: pickDependency(parentTask),
    subtasks,
    blockedBy: blockedBy.map((candidate) => pickDependency(candidate)!),
    blocks: blocks.map((candidate) => pickDependency(candidate)!),
    followUp,
    history
  };
}

export async function addTaskDependency(taskId: string, blockingTaskId: string) {
  const { organization } = await getAuthContext();
  if (taskId === blockingTaskId)
    throw new TaskServiceError('A task cannot block itself', 'INVALID_REFERENCE');
  const allTasks = await getTasks();
  const taskIds = new Set(allTasks.map((task) => task.id));
  if (!taskIds.has(taskId) || !taskIds.has(blockingTaskId))
    throw new TaskServiceError('Tasks must belong to the active organization', 'INVALID_REFERENCE');
  const edges = await db
    .select({ taskId: taskDependencies.taskId, blockingTaskId: taskDependencies.blockingTaskId })
    .from(taskDependencies)
    .innerJoin(tasks, eq(tasks.id, taskDependencies.taskId))
    .where(eq(tasks.organizationId, organization.id));
  const graph = new Map<string, string[]>();
  for (const edge of edges)
    graph.set(edge.taskId, [...(graph.get(edge.taskId) ?? []), edge.blockingTaskId]);
  const stack = [blockingTaskId];
  const visited = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === taskId)
      throw new TaskServiceError('Dependency would create a cycle', 'INVALID_REFERENCE');
    if (visited.has(current)) continue;
    visited.add(current);
    stack.push(...(graph.get(current) ?? []));
  }
  await db.insert(taskDependencies).values({ taskId, blockingTaskId });
  await recordTaskHistory(taskId, 'dependency_added', 'Se añadió una tarea bloqueante');
  await recordTaskHistory(
    blockingTaskId,
    'dependency_added',
    'Esta tarea ahora bloquea otra tarea'
  );
  const task = allTasks.find((candidate) => candidate.id === taskId);
  if (task?.customerId)
    await recordSystemActivity(task.customerId, 'Tarea bloqueada', { taskId, blockingTaskId });
  return getTaskWorkspace(taskId);
}

export async function removeTaskDependency(taskId: string, blockingTaskId: string) {
  const task = await getTask(taskId);
  await db
    .delete(taskDependencies)
    .where(
      and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.blockingTaskId, blockingTaskId))
    );
  await recordTaskHistory(taskId, 'dependency_removed', 'Se eliminó una tarea bloqueante');
  await recordTaskHistory(blockingTaskId, 'dependency_removed', 'Dejó de bloquear otra tarea');
  if (task.customerId)
    await recordSystemActivity(task.customerId, 'Bloqueo eliminado', { taskId, blockingTaskId });
  return getTaskWorkspace(taskId);
}
