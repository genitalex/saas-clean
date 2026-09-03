import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';
import { getAuthContext } from '@/lib/db/organization-context';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  try {
    const { organization, user } = await getAuthContext();
    const notifications = await service.getNotifications(organization.id, user.id, unreadOnly, 50);
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: 'NOTIFICATIONS_REQUEST_FAILED' }, { status: 401 });
  }
}
