import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  organizationInvitations,
  organizationMembers,
  organizations,
  sessions,
  users
} from '@/lib/db/schema';
import { notifyOrganizationMembers } from '@/features/automations/api/service';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });

  let token = '';
  try {
    const body = await request.json();
    token = typeof body?.token === 'string' ? body.token.trim() : '';
  } catch {
    return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 });
  }
  if (!token) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 });

  const now = new Date();
  const [invitation] = await db
    .select({
      id: organizationInvitations.id,
      organizationId: organizationInvitations.organizationId,
      email: organizationInvitations.email,
      expiresAt: organizationInvitations.expiresAt,
      acceptedAt: organizationInvitations.acceptedAt
    })
    .from(organizationInvitations)
    .where(eq(organizationInvitations.tokenHash, hashToken(token)))
    .limit(1);

  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
    return NextResponse.json({ error: 'INVITATION_EXPIRED_OR_INVALID' }, { status: 404 });
  }

  if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json({ error: 'INVITATION_EMAIL_MISMATCH' }, { status: 403 });
  }

  const [organization] = await db
    .select({ id: organizations.id, plan: organizations.plan, seatLimit: organizations.seatLimit })
    .from(organizations)
    .where(eq(organizations.id, invitation.organizationId))
    .limit(1);

  if (!organization || organization.plan !== 'team') {
    return NextResponse.json({ error: 'TEAM_ORGANIZATION_REQUIRED' }, { status: 409 });
  }

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organization.id),
          eq(organizationMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!existing) {
      const members = await tx
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organization.id));
      if (members.length >= organization.seatLimit) return { error: 'SEAT_LIMIT_REACHED' as const };

      await tx.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: session.user.id,
        role: 'member',
        createdAt: now
      });
    }

    await tx
      .update(organizationInvitations)
      .set({ acceptedAt: now })
      .where(eq(organizationInvitations.id, invitation.id));

    await tx
      .update(sessions)
      .set({ activeOrganizationId: organization.id, updatedAt: now })
      .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));

    return { error: null, organizationId: organization.id };
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: 409 });

  try {
    await notifyOrganizationMembers(result.organizationId, session.user.id, {
      type: 'team_member_joined',
      title: 'Nuevo miembro en el equipo',
      message: `${session.user.name} se ha unido al espacio.`,
      refEntityType: null,
      refEntityId: null
    });
  } catch (error) {
    console.error('[organization-invitations:notify-joined]', error);
  }

  return NextResponse.json({ organizationId: result.organizationId });
}
