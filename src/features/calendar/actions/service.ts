import 'server-only';

import { and, asc, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAuthContext } from '@/lib/db/organization-context';
import { customers, events, organizationMembers, users } from '@/lib/db/schema';
import { eventFiltersSchema, eventPayloadSchema, eventUpdateSchema } from '../schemas/event';
import type { EventFilters, EventPayload, EventUpdatePayload } from '../types';

export class EventServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_REFERENCE' | 'INVALID_PAYLOAD' | 'INVALID_FILTERS'
  ) {
    super(message);
    this.name = 'EventServiceError';
  }
}

const eventSelection = {
  id: events.id,
  organizationId: events.organizationId,
  customerId: events.customerId,
  assigneeId: events.assigneeId,
  title: events.title,
  description: events.description,
  startAt: events.startAt,
  endAt: events.endAt,
  allDay: events.allDay,
  location: events.location,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
  customer: { id: customers.id, name: customers.name },
  assignee: { id: users.id, name: users.name }
};

async function validateReferences(
  organizationId: string,
  customerId?: string | null,
  assigneeId?: string | null
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
      throw new EventServiceError(
        'Customer is not available in this organization',
        'INVALID_REFERENCE'
      );
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
      throw new EventServiceError(
        'Assignee is not a member of this organization',
        'INVALID_REFERENCE'
      );
  }
}

function parseFilters(filters: EventFilters) {
  const parsed = eventFiltersSchema.safeParse(filters);
  if (!parsed.success) throw new EventServiceError('Invalid event filters', 'INVALID_FILTERS');
  return parsed.data;
}

export async function getEvents(filters: EventFilters = {}) {
  const { organization } = await getAuthContext();
  const parsed = parseFilters(filters);
  const search = parsed.search?.trim();
  return db
    .select(eventSelection)
    .from(events)
    .leftJoin(customers, eq(customers.id, events.customerId))
    .leftJoin(users, eq(users.id, events.assigneeId))
    .where(
      and(
        eq(events.organizationId, organization.id),
        parsed.startDate ? gte(events.startAt, parsed.startDate) : undefined,
        parsed.endDate ? lte(events.startAt, parsed.endDate) : undefined,
        parsed.customerId ? eq(events.customerId, parsed.customerId) : undefined,
        parsed.assigneeId ? eq(events.assigneeId, parsed.assigneeId) : undefined,
        search
          ? or(
              ilike(events.title, `%${search}%`),
              ilike(events.description, `%${search}%`),
              ilike(events.location, `%${search}%`)
            )
          : undefined
      )
    )
    .orderBy(asc(events.startAt), desc(events.createdAt));
}

export async function getEvent(id: string) {
  const { organization } = await getAuthContext();
  const [event] = await db
    .select(eventSelection)
    .from(events)
    .leftJoin(customers, eq(customers.id, events.customerId))
    .leftJoin(users, eq(users.id, events.assigneeId))
    .where(and(eq(events.id, id), eq(events.organizationId, organization.id)))
    .limit(1);
  if (!event) throw new EventServiceError('Event not found', 'NOT_FOUND');
  return event;
}

export async function createEvent(input: EventPayload) {
  const { organization } = await getAuthContext();
  const parsed = eventPayloadSchema.safeParse(input);
  if (!parsed.success) throw new EventServiceError('Invalid event payload', 'INVALID_PAYLOAD');
  await validateReferences(organization.id, parsed.data.customerId, parsed.data.assigneeId);
  const now = new Date();
  const [created] = await db
    .insert(events)
    .values({
      organizationId: organization.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      allDay: parsed.data.allDay,
      location: parsed.data.location || null,
      customerId: parsed.data.customerId || null,
      assigneeId: parsed.data.assigneeId || null,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: events.id });
  return getEvent(created.id);
}

export async function updateEvent(id: string, input: EventUpdatePayload) {
  const { organization } = await getAuthContext();
  const existing = await getEvent(id);
  const parsed = eventUpdateSchema.safeParse({
    title: input.title ?? existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    startAt: input.startAt ?? existing.startAt,
    endAt: input.endAt ?? existing.endAt,
    allDay: input.allDay ?? existing.allDay,
    location: input.location !== undefined ? input.location : existing.location,
    customerId: input.customerId !== undefined ? input.customerId : existing.customerId,
    assigneeId: input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId
  });
  if (!parsed.success) throw new EventServiceError('Invalid event payload', 'INVALID_PAYLOAD');
  await validateReferences(organization.id, parsed.data.customerId, parsed.data.assigneeId);
  const [updated] = await db
    .update(events)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description || null
      }),
      ...(parsed.data.startAt !== undefined && { startAt: parsed.data.startAt }),
      ...(parsed.data.endAt !== undefined && { endAt: parsed.data.endAt }),
      ...(parsed.data.allDay !== undefined && { allDay: parsed.data.allDay }),
      ...(parsed.data.location !== undefined && { location: parsed.data.location || null }),
      ...(parsed.data.customerId !== undefined && { customerId: parsed.data.customerId || null }),
      ...(parsed.data.assigneeId !== undefined && { assigneeId: parsed.data.assigneeId || null }),
      updatedAt: new Date()
    })
    .where(and(eq(events.id, id), eq(events.organizationId, organization.id)))
    .returning({ id: events.id });
  if (!updated) throw new EventServiceError('Event not found', 'NOT_FOUND');
  return getEvent(updated.id);
}

export async function deleteEvent(id: string) {
  const { organization } = await getAuthContext();
  const [deleted] = await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.organizationId, organization.id)))
    .returning({ id: events.id });
  if (!deleted) throw new EventServiceError('Event not found', 'NOT_FOUND');
  return deleted;
}

export async function getUpcomingEvents(startDate = new Date(), days = 30) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  return getEvents({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
}

export async function getEventsForDay(day: Date) {
  const startDate = new Date(day);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return getEvents({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
}
