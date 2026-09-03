import { db } from '@/lib/db';
import { automations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/db/organization-context';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, automationId, enabled, payload } = body;
  const { organization } = await getAuthContext();

  if (action === 'toggle' && automationId) {
    const result = await db
      .update(automations)
      .set({ enabled })
      .where(and(eq(automations.id, automationId), eq(automations.organizationId, organization.id)))
      .returning();

    return NextResponse.json(result[0]);
  }

  if (action === 'update' && automationId && payload) {
    const result = await db
      .update(automations)
      .set({
        ...(payload.trigger !== undefined && { trigger: payload.trigger }),
        ...(payload.action !== undefined && { action: payload.action }),
        ...(payload.config !== undefined && { config: payload.config }),
        ...(payload.enabled !== undefined && { enabled: payload.enabled }),
        updatedAt: new Date()
      })
      .where(and(eq(automations.id, automationId), eq(automations.organizationId, organization.id)))
      .returning();
    return result[0]
      ? NextResponse.json(result[0])
      : NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  if (action === 'delete' && automationId) {
    await db
      .delete(automations)
      .where(
        and(eq(automations.id, automationId), eq(automations.organizationId, organization.id))
      );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
