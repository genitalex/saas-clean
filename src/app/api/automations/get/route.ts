import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
  }

  const automations = await service.getAutomations(organizationId);
  return NextResponse.json(automations);
}
