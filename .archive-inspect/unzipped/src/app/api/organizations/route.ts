import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers, organizations, sessions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ name: z.string().trim().min(1).max(80) });

function errorResponse(message = 'ORGANIZATIONS_REQUEST_FAILED', status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse('AUTHENTICATION_REQUIRED', 401);
  try {
    const memberships = await db
      .select({ organization: organizations, membership: organizationMembers })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, session.user.id));
    return NextResponse.json(memberships);
  } catch (error) {
    console.error('[organizations:list]', error);
    return errorResponse();
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse('AUTHENTICATION_REQUIRED', 401);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('INVALID_ORGANIZATION_NAME', 400);
  try {
    const now = new Date();
    const organization = await db.transaction(async (tx) => {
      const id = crypto.randomUUID();
      const slug = `${
        parsed.data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'workspace'
      }-${crypto.randomUUID().slice(0, 8)}`;
      const [created] = await tx
        .insert(organizations)
        .values({ id, name: parsed.data.name, slug, createdAt: now, updatedAt: now })
        .returning();
      await tx
        .insert(organizationMembers)
        .values({ organizationId: id, userId: session.user.id, role: 'owner', createdAt: now });
      await tx
        .update(sessions)
        .set({ activeOrganizationId: id, updatedAt: now })
        .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));
      return created;
    });
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('[organizations:create]', error);
    return errorResponse();
  }
}
