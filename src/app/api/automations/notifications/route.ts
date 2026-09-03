import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/db/organization-context';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, notificationId, organizationId, userId } = body;
  const { organization, user } = await getAuthContext();

  if (action === 'mark-as-read' && notificationId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.organizationId, organization.id),
          eq(notifications.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  }

  if (action === 'mark-all-read' && organizationId && userId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.organizationId, organization.id),
          eq(notifications.userId, user.id),
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
