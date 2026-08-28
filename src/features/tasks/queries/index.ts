import type { TaskFilters, TaskStatus } from '../types';

function toSearchParams(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.search) params.set('search', filters.search);
  return params.toString();
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Task request failed');
  return data as T;
}

export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters = {}) => [...taskKeys.all, 'list', filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const
};

export async function getTasks(filters: TaskFilters = {}) {
  const query = toSearchParams(filters);
  return request<import('../types').Task[]>(`/api/tasks${query ? `?${query}` : ''}`);
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
