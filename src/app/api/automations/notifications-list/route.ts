import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  try {
    const { organization, user } = await getAuthContext();
    const notifications = await service.getNotifications(organization.id, user.id, unreadOnly, 50);
    return NextResponse.json(notifications);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[notifications-list]', error);
    return NextResponse.json({ error: 'NOTIFICATIONS_REQUEST_FAILED' }, { status: 500 });
  }
}
