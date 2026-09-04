import type { Event, EventApi, EventFilters, EventPayload, EventUpdatePayload } from '../types';
import { deserializeDate } from '@/lib/date-utils';

function deserializeEvent(event: EventApi): Event {
  return {
    ...event,
    startAt: deserializeDate(event.startAt, 'event.startAt'),
    endAt: deserializeDate(event.endAt, 'event.endAt'),
    createdAt: deserializeDate(event.createdAt, 'event.createdAt'),
    updatedAt: deserializeDate(event.updatedAt, 'event.updatedAt')
  };
}

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
  const events = await request<EventApi[]>(`/api/events${query ? `?${query}` : ''}`);
  return events.map(deserializeEvent);
}

export async function getEvent(id: string) {
  const event = await request<EventApi>(`/api/events/${id}`);
  return deserializeEvent(event);
}

export async function createEvent(input: EventPayload) {
  const event = await request<EventApi>('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return deserializeEvent(event);
}

export async function updateEvent(id: string, input: EventUpdatePayload) {
  const event = await request<EventApi>(`/api/events/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return deserializeEvent(event);
}

export async function deleteEvent(id: string) {
  return request<{ id: string }>(`/api/events/${id}`, { method: 'DELETE' });
}

export type EventWorkspace = {
  event: Event;
  tasks: Array<{
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'waiting' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueAt: Date | null;
    assigneeId: string | null;
  }>;
  activities: Array<{
    id: string;
    type: 'note' | 'call' | 'email' | 'status_change' | 'system';
    title: string;
    content: string | null;
    createdAt: Date;
    user: { id: string; name: string } | null;
  }>;
};

type EventWorkspaceApi = {
  event: EventApi;
  tasks: Array<Omit<EventWorkspace['tasks'][number], 'dueAt'> & { dueAt: string | null }>;
  activities: Array<
    Omit<EventWorkspace['activities'][number], 'createdAt'> & { createdAt: string }
  >;
};

export async function getEventWorkspace(id: string) {
  const workspace = await request<EventWorkspaceApi>(`/api/events/${id}/workspace`);
  return {
    ...workspace,
    event: deserializeEvent(workspace.event),
    tasks: workspace.tasks.map((task) => ({
      ...task,
      dueAt: task.dueAt ? deserializeDate(task.dueAt, 'event.workspace.task.dueAt') : null
    })),
    activities: workspace.activities.map((activity) => ({
      ...activity,
      createdAt: deserializeDate(activity.createdAt, 'event.workspace.activity.createdAt')
    }))
  };
}
