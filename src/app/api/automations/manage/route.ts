import { db } from '@/lib/db';
import { automations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, automationId, enabled } = body;

  if (action === 'toggle' && automationId) {
    const result = await db
      .update(automations)
      .set({ enabled })
      .where(eq(automations.id, automationId))
      .returning();

    return NextResponse.json(result[0]);
  }

  if (action === 'delete' && automationId) {
    await db.delete(automations).where(eq(automations.id, automationId));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
