import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');
  const userId = searchParams.get('userId');

  if (!organizationId || !userId) {
    return NextResponse.json({ error: 'Missing organizationId or userId' }, { status: 400 });
  }

  const attentionItems = await service.getAttentionItems(organizationId, userId);
  return NextResponse.json(attentionItems);
}
