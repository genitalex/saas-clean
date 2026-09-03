import { db } from '@/lib/db';
import { attentionItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, attentionItemId, status } = body;

  if (action === 'acknowledge' && attentionItemId) {
    await db
      .update(attentionItems)
      .set({ status: 'acknowledged' })
      .where(eq(attentionItems.id, attentionItemId));

    return NextResponse.json({ success: true });
  }

  if (action === 'resolve' && attentionItemId) {
    await db
      .update(attentionItems)
      .set({ status: 'resolved' })
      .where(eq(attentionItems.id, attentionItemId));

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
