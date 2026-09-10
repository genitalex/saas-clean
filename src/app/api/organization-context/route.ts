import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions, normalizeRole } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { organizationInvitations, organizationMembers } from '@/lib/db/schema';
import { and, count, eq, gt, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request.headers);
    const now = new Date();
    const [{ memberCount }] = await db
      .select({ memberCount: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, context.organization.id));
    const [{ pendingInviteCount }] = await db
      .select({ pendingInviteCount: count() })
      .from(organizationInvitations)
      .where(
        and(
          eq(organizationInvitations.organizationId, context.organization.id),
          isNull(organizationInvitations.acceptedAt),
          gt(organizationInvitations.expiresAt, now)
        )
      );
    const role = normalizeRole(context.membership.role);
    const permissions = getOrganizationPermissions(context);

    return NextResponse.json({
      organization: {
        id: context.organization.id,
        name: context.organization.name,
        plan: context.organization.plan,
        seatLimit: context.organization.seatLimit,
        industry: context.organization.industry,
        teamSize: context.organization.teamSize,
        mainUseCase: context.organization.mainUseCase,
        memberCount: Number(memberCount),
        pendingInviteCount: Number(pendingInviteCount)
      },
      user: {
        id: context.user.id,
        role
      },
      permissions
    });
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[organization-context:get]', error);
    return NextResponse.json({ error: 'ORGANIZATION_CONTEXT_FAILED' }, { status: 500 });
  }
}
