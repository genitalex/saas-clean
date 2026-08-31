import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { customerSchema } from '@/features/customers/schemas/customer';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { recordSystemActivity } from '@/features/activities/actions/service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    }
    throw error;
  }
  const session = context.session;
  const organizationId = context.organization.id;
  const { id } = await params;
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
    .limit(1);
  return row
    ? NextResponse.json(row)
    : NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    }
    throw error;
  }
  const session = context.session;
  const organizationId = context.organization.id;
  const { id } = await params;
  const parsed = customerSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_CUSTOMER_PAYLOAD' }, { status: 400 });
  const [row] = await db
    .update(customers)
    .set({
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      nextAction: parsed.data.nextAction || null,
      nextActionAt: parsed.data.nextActionAt
        ? new Date(`${parsed.data.nextActionAt}T00:00:00.000Z`)
        : null,
      updatedAt: new Date()
    })
    .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
    .returning();
  if (row) await recordSystemActivity(row.id, 'Cliente actualizado');
  return row
    ? NextResponse.json(row)
    : NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    }
    throw error;
  }
  const session = context.session;
  const organizationId = context.organization.id;
  const { id } = await params;
  const [row] = await db
    .update(customers)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
    .returning();
  return row
    ? NextResponse.json(row)
    : NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
}
