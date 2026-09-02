import type { InferSelectModel } from 'drizzle-orm';
import type { activities } from '@/lib/db/schema';

export type Activity = InferSelectModel<typeof activities> & {
  user: { id: string; name: string } | null;
};

export type GlobalActivity = Activity & {
  customer: { id: string; name: string };
  event: { id: string; title: string } | null;
};

export type ActivityType = Activity['type'];

export type ActivityPayload = {
  type: ActivityType;
  title: string;
  content?: string | null;
  eventId?: string | null;
  metadata?: Record<string, unknown> | null;
};
