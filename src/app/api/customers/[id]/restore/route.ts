import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let context;
  try {
    context = await getAuthContext(request.headers);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    throw error;
  }
  const { id } = await params;
  const [row] = await db
    .update(customers)
    .set({ archived: false, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.organizationId, context.organization.id)))
    .returning();
  return row
    ? NextResponse.json(row)
    : NextResponse.json({ error: 'CUSTOMER_NOT_FOUND' }, { status: 404 });
}
