import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/features/automations/api/service';
import { getAuthContext } from '@/lib/db/organization-context';
import { automationSchema } from '@/features/automations/schemas';

export async function POST(req: NextRequest) {
  try {
    const { organization } = await getAuthContext();
    const parsed = automationSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_AUTOMATION' }, { status: 400 });
    return NextResponse.json(await service.createAutomation(organization.id, parsed.data), {
      status: 201
    });
  } catch {
    return NextResponse.json({ error: 'AUTOMATION_CREATE_FAILED' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { organization } = await getAuthContext();
    const automations = await service.getAutomations(organization.id);
    return NextResponse.json(automations);
  } catch {
    return NextResponse.json({ error: 'AUTOMATIONS_REQUEST_FAILED' }, { status: 401 });
  }
}
