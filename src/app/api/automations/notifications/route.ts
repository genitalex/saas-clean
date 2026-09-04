import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, notificationId } = body;
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

    if (action === 'mark-all-read') {
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
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[notifications]', error);
    return NextResponse.json({ error: 'NOTIFICATIONS_REQUEST_FAILED' }, { status: 500 });
  }
}
