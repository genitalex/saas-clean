import { createHash, randomBytes } from 'node:crypto';
import { and, count, eq, gt, ilike, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getOrganizationPermissions } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { organizationInvitations, organizationMembers, users } from '@/lib/db/schema';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';

const createSchema = z.object({
  email: z.string().trim().email('Introduce un email válido').max(320)
});

const INVITATION_DAYS = 7;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request.headers);
    if (!getOrganizationPermissions(context).canManageUsers) return errorResponse('FORBIDDEN', 403);

    const now = new Date();
    const invitations = await db
      .select({
        id: organizationInvitations.id,
        email: organizationInvitations.email,
        expiresAt: organizationInvitations.expiresAt,
        createdAt: organizationInvitations.createdAt
      })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, context.organization.id),
          isNull(organizationInvitations.acceptedAt),
          gt(organizationInvitations.expiresAt, now)
        )
      )
      .orderBy(organizationInvitations.createdAt);

    return NextResponse.json(invitations);
  } catch (error) {
    if (error instanceof AuthContextError)
      return errorResponse(error.code, error.code === 'UNAUTHENTICATED' ? 401 : 403);
    console.error('[organization-invitations:list]', error);
    return errorResponse('INVITATIONS_REQUEST_FAILED', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getAuthContext(request.headers);
    if (!getOrganizationPermissions(context).canManageUsers) return errorResponse('FORBIDDEN', 403);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse('INVALID_EMAIL', 400);

    const email = parsed.data.email.toLowerCase();
    const now = new Date();

    const [existingMember] = await db
      .select({ id: users.id })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, context.organization.id),
          ilike(users.email, email)
        )
      )
      .limit(1);

    if (existingMember) return errorResponse('ALREADY_A_MEMBER', 409);

    const [{ memberCount }] = await db
      .select({ memberCount: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, context.organization.id));

    const [{ pendingCount }] = await db
      .select({ pendingCount: count() })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, context.organization.id),
          isNull(organizationInvitations.acceptedAt),
          gt(organizationInvitations.expiresAt, now)
        )
      );

    if (Number(memberCount) + Number(pendingCount) >= context.organization.seatLimit) {
      return errorResponse('SEAT_LIMIT_REACHED', 409);
    }

    await db
      .delete(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, context.organization.id),
          ilike(organizationInvitations.email, email),
          isNull(organizationInvitations.acceptedAt)
        )
      );

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + INVITATION_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(organizationInvitations).values({
      organizationId: context.organization.id,
      invitedByUserId: context.user.id,
      email,
      tokenHash: hashToken(token),
      expiresAt,
      createdAt: now
    });

    return NextResponse.json(
      { email, expiresAt, inviteUrl: `${request.nextUrl.origin}/invite/${token}` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthContextError)
      return errorResponse(error.code, error.code === 'UNAUTHENTICATED' ? 401 : 403);
    console.error('[organization-invitations:create]', error);
    return errorResponse('INVITATION_CREATE_FAILED', 500);
  }
}
