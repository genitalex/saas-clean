import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, notificationId, organizationId, userId } = body;

  if (action === 'mark-as-read' && notificationId) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));

    return NextResponse.json({ success: true });
  }

  if (action === 'mark-all-read' && organizationId && userId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
