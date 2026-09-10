import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { opportunities } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const opportunitySchema = z.object({
  title: z.string().trim().min(1),
  customer: z.string().trim().min(1),
  value: z.number().int().nonnegative(),
  probability: z.number().int().min(0).max(100).optional(),
  stage: z.string().trim().min(1).optional(),
  close: z.string().trim().min(1).optional(),
  owner: z.string().trim().min(1).optional()
});

function authError(error: unknown) {
  if (!(error instanceof AuthContextError)) throw error;
  return NextResponse.json(
    { error: error.code },
    { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
  );
}

export async function GET(request: NextRequest) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    return authError(error);
  }
  try {
    const rows = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.organizationId, context.organization.id))
      .orderBy(asc(opportunities.createdAt));
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[opportunities:get]', error);
    return NextResponse.json({ error: 'OPPORTUNITIES_REQUEST_FAILED' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    return authError(error);
  }
  const parsed = opportunitySchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_OPPORTUNITY_PAYLOAD' }, { status: 400 });
  try {
    const [created] = await db
      .insert(opportunities)
      .values({
        id: crypto.randomUUID(),
        organizationId: context.organization.id,
        ownerId: context.user.id,
        title: parsed.data.title,
        customer: parsed.data.customer,
        value: parsed.data.value,
        probability: parsed.data.probability ?? 20,
        stage: parsed.data.stage ?? 'Contactado',
        close: parsed.data.close ?? 'Por definir',
        owner: parsed.data.owner ?? context.user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[opportunities:create]', error);
    return NextResponse.json({ error: 'OPPORTUNITY_CREATE_FAILED' }, { status: 500 });
  }
}
