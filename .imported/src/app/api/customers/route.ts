import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { customerSchema } from '@/features/customers/schemas/customer';
import { recordSystemActivity } from '@/features/activities/actions/service';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId)
    return NextResponse.json({ error: 'ACTIVE_ORGANIZATION_REQUIRED' }, { status: 403 });
  try {
    const q = request.nextUrl.searchParams.get('search')?.trim() || '';
    const rows = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, organizationId),
          eq(customers.archived, false),
          q
            ? or(
                ilike(customers.name, `%${q}%`),
                ilike(customers.email, `%${q}%`),
                ilike(customers.phone, `%${q}%`)
              )
            : undefined
        )
      )
      .orderBy(desc(customers.updatedAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('[customers:get]', error);
    return NextResponse.json({ error: 'CUSTOMER_REQUEST_FAILED' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId)
    return NextResponse.json({ error: 'ACTIVE_ORGANIZATION_REQUIRED' }, { status: 403 });
  const parsed = customerSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_CUSTOMER_PAYLOAD' }, { status: 400 });
  try {
    const now = new Date();
    const [customer] = await db
      .insert(customers)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ownerId: session.user.id,
        kind: parsed.data.kind,
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        nextAction: parsed.data.nextAction || null,
        nextActionAt: parsed.data.nextActionAt
          ? new Date(`${parsed.data.nextActionAt}T00:00:00.000Z`)
          : null,
        archived: false,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    await recordSystemActivity(customer.id, 'Cliente creado');
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('[customers:create]', error);
    return NextResponse.json({ error: 'CUSTOMER_CREATE_FAILED' }, { status: 500 });
  }
}
