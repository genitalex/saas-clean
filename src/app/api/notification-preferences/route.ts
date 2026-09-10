import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';

const defaults = {
  taskAssigned: true,
  taskOverdue: true,
  followUpOverdue: true,
  taskBlocked: true,
  waitingReady: true,
  automationExecuted: true,
  eventImportant: true,
  taskStatusChanged: true,
  teamMemberJoined: true,
  customerUpdated: true,
  eventUpdated: true,
  opportunityUpdated: true
};

const updateSchema = z.object({
  taskAssigned: z.boolean(),
  taskOverdue: z.boolean(),
  followUpOverdue: z.boolean(),
  taskBlocked: z.boolean(),
  waitingReady: z.boolean(),
  automationExecuted: z.boolean(),
  eventImportant: z.boolean(),
  taskStatusChanged: z.boolean(),
  teamMemberJoined: z.boolean(),
  customerUpdated: z.boolean(),
  eventUpdated: z.boolean(),
  opportunityUpdated: z.boolean()
});

async function getOrCreate(organizationId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.organizationId, organizationId),
        eq(notificationPreferences.userId, userId)
      )
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(notificationPreferences)
    .values({ organizationId, userId, ...defaults })
    .returning();
  return created;
}

export async function GET(request: NextRequest) {
  try {
    const { organization, user } = await getAuthContext(request.headers);
    return NextResponse.json(await getOrCreate(organization.id, user.id));
  } catch (error) {
    if (error instanceof AuthContextError)
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    console.error('[notification-preferences:get]', error);
    return NextResponse.json({ error: 'NOTIFICATION_PREFERENCES_REQUEST_FAILED' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { organization, user } = await getAuthContext(request.headers);
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ error: 'INVALID_NOTIFICATION_PREFERENCES' }, { status: 400 });
    await getOrCreate(organization.id, user.id);
    const [updated] = await db
      .update(notificationPreferences)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(notificationPreferences.organizationId, organization.id),
          eq(notificationPreferences.userId, user.id)
        )
      )
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthContextError)
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    console.error('[notification-preferences:update]', error);
    return NextResponse.json({ error: 'NOTIFICATION_PREFERENCES_UPDATE_FAILED' }, { status: 500 });
  }
}
