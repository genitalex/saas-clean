import type { InferSelectModel } from 'drizzle-orm';
import type { customers, events, users } from '@/lib/db/schema';

export type Event = InferSelectModel<typeof events> & {
  customer: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
};

export type EventApi = Omit<Event, 'startAt' | 'endAt' | 'createdAt' | 'updatedAt'> & {
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
};

export type EventFilters = {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  assigneeId?: string;
  search?: string;
};

export type EventPayload = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string | null;
  url?: string | null;
  status?: 'planned' | 'in_progress' | 'done' | 'cancelled';
  color?: string | null;
  reminderMinutes?: number | null;
  repeatRule?: string | null;
  customerId?: string | null;
  assigneeId?: string | null;
};

export type EventUpdatePayload = Partial<EventPayload>;
export type CustomerOption = Pick<InferSelectModel<typeof customers>, 'id' | 'name' | 'kind'>;
export type UserOption = Pick<InferSelectModel<typeof users>, 'id' | 'name'>;
