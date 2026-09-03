import { db } from '@/lib/db';
import { attentionItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/db/organization-context';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, attentionItemId } = body;
  const { organization, user } = await getAuthContext();

  if (action === 'acknowledge' && attentionItemId) {
    await db
      .update(attentionItems)
      .set({ status: 'acknowledged' })
      .where(
        and(
          eq(attentionItems.id, attentionItemId),
          eq(attentionItems.organizationId, organization.id),
          eq(attentionItems.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  }

  if (action === 'resolve' && attentionItemId) {
    await db
      .update(attentionItems)
      .set({ status: 'resolved' })
      .where(
        and(
          eq(attentionItems.id, attentionItemId),
          eq(attentionItems.organizationId, organization.id),
          eq(attentionItems.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
