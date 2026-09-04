import type { TaskFilters, TaskStatus } from '../types';
import type { Task, TaskApi, TaskWorkspaceApi } from '../types';
import { deserializeDate, deserializeNullableDate } from '@/lib/date-utils';

function deserializeTask(task: TaskApi): Task {
  return {
    ...task,
    dueAt: deserializeNullableDate(task.dueAt, 'task.dueAt') ?? null,
    createdAt: deserializeDate(task.createdAt, 'task.createdAt'),
    updatedAt: deserializeDate(task.updatedAt, 'task.updatedAt'),
    completedAt: deserializeNullableDate(task.completedAt, 'task.completedAt') ?? null
  };
}

function toSearchParams(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.eventId) params.set('eventId', filters.eventId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.search) params.set('search', filters.search);
  if (filters.parentTaskId) params.set('parentTaskId', filters.parentTaskId);
  return params.toString();
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Task request failed');
  return data as T;
}

async function requestTaskList<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(input, { ...init, cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data as T;
      if (response.status < 500 || attempt === 2) {
        throw new Error(data.error || 'Task request failed');
      }
      lastError = new Error(data.error || 'Task request failed');
    } catch (error) {
      lastError = error;
      if (attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error('Task request failed');
}

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters = {}) => [...taskKeys.all, 'list', filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  workspace: (id: string) => [...taskKeys.all, 'workspace', id] as const
};

export async function getTasks(filters: TaskFilters = {}) {
  const query = toSearchParams(filters);
  const tasks = await requestTaskList<TaskApi[]>(`/api/tasks${query ? `?${query}` : ''}`);
  return tasks.map(deserializeTask);
}

export async function getTask(id: string) {
  const task = await request<TaskApi>(`/api/tasks/${id}`);
  return deserializeTask(task);
}

export async function createTask(input: import('../types').TaskPayload) {
  const task = await request<TaskApi>('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return deserializeTask(task);
}

export async function updateTask(id: string, input: import('../types').TaskUpdatePayload) {
  const task = await request<TaskApi>(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return deserializeTask(task);
}

export async function deleteTask(id: string) {
  return request<{ id: string }>(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status });
}

export async function getTaskWorkspace(id: string) {
  const workspace = await request<TaskWorkspaceApi>(`/api/tasks/${id}/workspace`);
  return {
    ...workspace,
    task: deserializeTask(workspace.task),
    subtasks: workspace.subtasks.map(deserializeTask),
    followUp: workspace.followUp ? deserializeTask(workspace.followUp) : null,
    history: workspace.history.map((entry) => ({
      ...entry,
      createdAt: deserializeDate(entry.createdAt, 'task.history.createdAt')
    }))
  };
}

export async function addTaskDependency(taskId: string, blockingTaskId: string) {
  return request<TaskWorkspaceApi>(`/api/tasks/${taskId}/dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockingTaskId })
  });
}

export async function removeTaskDependency(taskId: string, blockingTaskId: string) {
  return request<TaskWorkspaceApi>(
    `/api/tasks/${taskId}/dependencies?blockingTaskId=${encodeURIComponent(blockingTaskId)}`,
    { method: 'DELETE' }
  );
}
