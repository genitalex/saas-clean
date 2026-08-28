import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers, organizations, sessions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  const parsed = z.object({ organizationId: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: 'INVALID_ORGANIZATION_ID' }, { status: 400 });
  try {
    const [membership] = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(
        and(
          eq(organizationMembers.organizationId, parsed.data.organizationId),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);
    if (!membership)
      return NextResponse.json({ error: 'ORGANIZATION_MEMBERSHIP_REQUIRED' }, { status: 403 });
    await db
      .update(sessions)
      .set({ activeOrganizationId: membership.organizationId, updatedAt: new Date() })
      .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));
    const [updated] = await db
      .select({ activeOrganizationId: sessions.activeOrganizationId })
      .from(sessions)
      .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)))
      .limit(1);
    if (!updated || updated.activeOrganizationId !== membership.organizationId)
      return NextResponse.json({ error: 'SESSION_UPDATE_FAILED' }, { status: 500 });
    return NextResponse.json({ organizationId: membership.organizationId });
  } catch (error) {
    console.error('[organizations:switch]', error);
    return NextResponse.json({ error: 'ORGANIZATION_SWITCH_FAILED' }, { status: 500 });
  }
}
