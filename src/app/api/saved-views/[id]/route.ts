import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { savedViews } from '@/lib/db/schema';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organization, user } = await getAuthContext();
    const { id } = await params;
    const payload = await request.json();

    const update: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (payload.name !== undefined) update.name = String(payload.name ?? '').trim();
    if (payload.filters !== undefined) update.filters = payload.filters ?? {};
    if (payload.sortBy !== undefined) update.sortBy = payload.sortBy ?? null;
    if (payload.groupBy !== undefined) update.groupBy = payload.groupBy ?? null;
    if (payload.favorite !== undefined) update.favorite = Boolean(payload.favorite);

    const [updated] = await db
      .update(savedViews)
      .set(update)
      .where(
        and(
          eq(savedViews.id, id),
          eq(savedViews.organizationId, organization.id),
          eq(savedViews.userId, user.id)
        )
      )
      .returning({
        id: savedViews.id,
        organizationId: savedViews.organizationId,
        userId: savedViews.userId,
        entity: savedViews.entity,
        name: savedViews.name,
        filters: savedViews.filters,
        sortBy: savedViews.sortBy,
        groupBy: savedViews.groupBy,
        favorite: savedViews.favorite,
        createdAt: savedViews.createdAt,
        updatedAt: savedViews.updatedAt
      });

    if (!updated) {
      return NextResponse.json({ error: 'SAVED_VIEW_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[saved-views:patch]', error);
    return NextResponse.json({ error: 'SAVED_VIEW_UPDATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organization, user } = await getAuthContext();
    const { id } = await params;

    const [deleted] = await db
      .delete(savedViews)
      .where(
        and(
          eq(savedViews.id, id),
          eq(savedViews.organizationId, organization.id),
          eq(savedViews.userId, user.id)
        )
      )
      .returning({ id: savedViews.id });

    if (!deleted) {
      return NextResponse.json({ error: 'SAVED_VIEW_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ id: deleted.id });
  } catch (error) {
    console.error('[saved-views:delete]', error);
    return NextResponse.json({ error: 'SAVED_VIEW_DELETE_FAILED' }, { status: 500 });
  }
}
