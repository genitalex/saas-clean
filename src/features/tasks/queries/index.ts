import type { TaskFilters, TaskStatus } from '../types';
import type { TaskWorkspace } from '../types';

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
  return requestTaskList<import('../types').Task[]>(`/api/tasks${query ? `?${query}` : ''}`);
}

export async function getTask(id: string) {
  return request<import('../types').Task>(`/api/tasks/${id}`);
}

export async function createTask(input: import('../types').TaskPayload) {
  return request<import('../types').Task>('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateTask(id: string, input: import('../types').TaskUpdatePayload) {
  return request<import('../types').Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function deleteTask(id: string) {
  return request<{ id: string }>(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return updateTask(id, { status });
}

export async function getTaskWorkspace(id: string) {
  return request<TaskWorkspace>(`/api/tasks/${id}/workspace`);
}

export async function addTaskDependency(taskId: string, blockingTaskId: string) {
  return request<TaskWorkspace>(`/api/tasks/${taskId}/dependencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockingTaskId })
  });
}

export async function removeTaskDependency(taskId: string, blockingTaskId: string) {
  return request<TaskWorkspace>(
    `/api/tasks/${taskId}/dependencies?blockingTaskId=${encodeURIComponent(blockingTaskId)}`,
    { method: 'DELETE' }
  );
}
