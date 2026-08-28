import type { Event, EventFilters, EventPayload, EventUpdatePayload } from '../types';

function toSearchParams(filters: EventFilters = {}) {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.search) params.set('search', filters.search);
  return params.toString();
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Calendar request failed');
  return data as T;
}

export const eventKeys = {
  all: ['events'] as const,
  list: (filters: EventFilters = {}) => [...eventKeys.all, 'list', filters] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const
};

export async function getEvents(filters: EventFilters = {}) {
  const query = toSearchParams(filters);
  return request<Event[]>(`/api/events${query ? `?${query}` : ''}`);
}

export async function getEvent(id: string) {
  return request<Event>(`/api/events/${id}`);
}

export async function createEvent(input: EventPayload) {
  return request<Event>('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateEvent(id: string, input: EventUpdatePayload) {
  return request<Event>(`/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function deleteEvent(id: string) {
  return request<{ id: string }>(`/api/events/${id}`, { method: 'DELETE' });
}
