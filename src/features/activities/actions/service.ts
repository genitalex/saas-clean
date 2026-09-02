import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAuthContext } from '@/lib/db/organization-context';
import { activities, customers, events, users } from '@/lib/db/schema';
import { activityPayloadSchema } from '../schemas/activity';
import type { ActivityPayload } from '../types';

export class ActivityServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_CUSTOMER' | 'INVALID_PAYLOAD'
  ) {
    super(message);
    this.name = 'ActivityServiceError';
  }
}

const activitySelection = {
  id: activities.id,
  organizationId: activities.organizationId,
  customerId: activities.customerId,
  eventId: activities.eventId,
  userId: activities.userId,
  type: activities.type,
  title: activities.title,
  content: activities.content,
  metadata: activities.metadata,
  createdAt: activities.createdAt,
  user: { id: users.id, name: users.name }
};

async function assertCustomer(customerId: string, organizationId: string) {
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
  if (!customer) {
    throw new ActivityServiceError(
      'Customer is not available in this organization',
      'INVALID_CUSTOMER'
    );
  }
}

export async function getCustomerActivities(customerId: string) {
  const { organization } = await getAuthContext();
  await assertCustomer(customerId, organization.id);
  return db
    .select(activitySelection)
    .from(activities)
    .leftJoin(users, eq(users.id, activities.userId))
    .where(
      and(eq(activities.customerId, customerId), eq(activities.organizationId, organization.id))
    )
    .orderBy(desc(activities.createdAt));
}

export async function getActivities(limit = 100) {
  const { organization } = await getAuthContext();
  return db
    .select({
      ...activitySelection,
      customer: { id: customers.id, name: customers.name },
      event: { id: events.id, title: events.title }
    })
    .from(activities)
    .innerJoin(customers, eq(customers.id, activities.customerId))
    .leftJoin(events, eq(events.id, activities.eventId))
    .leftJoin(users, eq(users.id, activities.userId))
    .where(eq(activities.organizationId, organization.id))
    .orderBy(desc(activities.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function getActivity(id: string) {
  const { organization } = await getAuthContext();
  const [activity] = await db
    .select(activitySelection)
    .from(activities)
    .leftJoin(users, eq(users.id, activities.userId))
    .where(and(eq(activities.id, id), eq(activities.organizationId, organization.id)))
    .limit(1);
  if (!activity) throw new ActivityServiceError('Activity not found', 'NOT_FOUND');
  return activity;
}

export async function createActivity(customerId: string, input: ActivityPayload) {
  const { organization, user } = await getAuthContext();
  await assertCustomer(customerId, organization.id);
  const parsed = activityPayloadSchema.safeParse(input);
  if (!parsed.success)
    throw new ActivityServiceError('Invalid activity payload', 'INVALID_PAYLOAD');
  if (parsed.data.eventId) {
    const [event] = await db
      .select({ id: events.id, customerId: events.customerId })
      .from(events)
      .where(and(eq(events.id, parsed.data.eventId), eq(events.organizationId, organization.id)))
      .limit(1);
    if (!event || (event.customerId && event.customerId !== customerId)) {
      throw new ActivityServiceError(
        'Event is not available for this customer',
        'INVALID_CUSTOMER'
      );
    }
  }
  const [created] = await db
    .insert(activities)
    .values({
      organizationId: organization.id,
      customerId,
      eventId: parsed.data.eventId || null,
      userId: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      content: parsed.data.content || null,
      metadata: parsed.data.metadata || null
    })
    .returning({ id: activities.id });
  return getActivity(created.id);
}

export async function recordSystemActivity(
  customerId: string,
  title: string,
  metadata?: Record<string, unknown>,
  eventId?: string | null
) {
  try {
    return await createActivity(customerId, {
      type: 'system',
      title,
      metadata: metadata ?? null,
      eventId: eventId ?? null
    });
  } catch (error) {
    console.error('[activities:system]', error);
    return null;
  }
}
