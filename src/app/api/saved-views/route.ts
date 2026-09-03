import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { savedViews } from '@/lib/db/schema';

const entitySelection = {
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
} as const;

export async function GET(request: NextRequest) {
  try {
    const { organization, user } = await getAuthContext();
    const entity = request.nextUrl.searchParams.get('entity') ?? 'tasks';

    const rows = await db
      .select(entitySelection)
      .from(savedViews)
      .where(
        and(
          eq(savedViews.organizationId, organization.id),
          eq(savedViews.userId, user.id),
          eq(savedViews.entity, entity)
        )
      )
      .orderBy(desc(savedViews.favorite), desc(savedViews.updatedAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[saved-views:get]', error);
    return NextResponse.json({ error: 'SAVED_VIEWS_REQUEST_FAILED' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization, user } = await getAuthContext();
    const payload = await request.json();
    const name = String(payload.name ?? '').trim();
    const entity = String(payload.entity ?? 'tasks');

    if (!name || !['tasks'].includes(entity)) {
      return NextResponse.json({ error: 'INVALID_SAVED_VIEW' }, { status: 400 });
    }

    const [created] = await db
      .insert(savedViews)
      .values({
        organizationId: organization.id,
        userId: user.id,
        entity,
        name,
        filters: payload.filters ?? {},
        sortBy: payload.sortBy ?? null,
        groupBy: payload.groupBy ?? null,
        favorite: Boolean(payload.favorite)
      })
      .returning(entitySelection);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[saved-views:create]', error);
    return NextResponse.json({ error: 'SAVED_VIEW_CREATE_FAILED' }, { status: 500 });
  }
}
