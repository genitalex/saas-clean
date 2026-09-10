import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { opportunities } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSchema = z
  .object({
    stage: z.string().trim().min(1).optional(),
    probability: z.number().int().min(0).max(100).optional()
  })
  .refine((value) => value.stage !== undefined || value.probability !== undefined, {
    message: 'At least one opportunity field is required'
  });

function authError(error: unknown) {
  if (!(error instanceof AuthContextError)) throw error;
  return NextResponse.json(
    { error: error.code },
    { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
  );
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    return authError(error);
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_OPPORTUNITY_UPDATE' }, { status: 400 });
  const { id } = await params;
  const [updated] = await db
    .update(opportunities)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(opportunities.id, id), eq(opportunities.organizationId, context.organization.id)))
    .returning();
  if (!updated) return NextResponse.json({ error: 'OPPORTUNITY_NOT_FOUND' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    return authError(error);
  }
  const { id } = await params;
  const deleted = await db
    .delete(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.organizationId, context.organization.id)))
    .returning({ id: opportunities.id });
  if (!deleted.length)
    return NextResponse.json({ error: 'OPPORTUNITY_NOT_FOUND' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
