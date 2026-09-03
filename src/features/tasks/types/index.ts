import type { InferSelectModel } from 'drizzle-orm';
import type { customers, tasks, users } from '@/lib/db/schema';

export type Task = InferSelectModel<typeof tasks> & {
  customer: { id: string; name: string } | null;
  event: { id: string; title: string } | null;
  assignee: { id: string; name: string } | null;
};

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type TaskRecurrence = NonNullable<Task['recurrenceRule']>;
export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  customerId?: string;
  eventId?: string;
  assigneeId?: string;
  search?: string;
};

export type TaskPayload = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueAt?: string | null;
  waitingOn?: string | null;
  recurrenceRule?: TaskRecurrence | null;
  customerId?: string | null;
  eventId?: string | null;
  assigneeId?: string | null;
};

export type TaskUpdatePayload = Partial<TaskPayload> & { status?: TaskStatus };

export type CustomerOption = Pick<InferSelectModel<typeof customers>, 'id' | 'name' | 'kind'>;
export type UserOption = Pick<InferSelectModel<typeof users>, 'id' | 'name'>;
