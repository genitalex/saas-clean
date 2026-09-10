import { NextRequest, NextResponse } from 'next/server';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions, normalizeRole } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request.headers);
    const [{ memberCount }] = await db
      .select({ memberCount: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, context.organization.id));
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
        memberCount: Number(memberCount)
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
