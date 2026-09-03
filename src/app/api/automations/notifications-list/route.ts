import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  if (!organizationId || !userId) {
    return NextResponse.json({ error: 'Missing organizationId or userId' }, { status: 400 });
  }

  const notifications = await service.getNotifications(organizationId, userId, unreadOnly, 50);
  return NextResponse.json(notifications);
}
