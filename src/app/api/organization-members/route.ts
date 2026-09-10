import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { organizationMembers, users } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const context = await getAuthContext(request.headers);
    if (!getOrganizationPermissions(context).canManageUsers) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const members = await db
      .select({ id: users.id, name: users.name, role: organizationMembers.role })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, context.organization.id));
    return NextResponse.json(members);
  } catch (error) {
    if (error instanceof AuthContextError) {
      return NextResponse.json(
        { error: error.code },
        { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 }
      );
    }
    console.error('[organization-members:list]', error);
    return NextResponse.json({ error: 'MEMBERS_REQUEST_FAILED' }, { status: 500 });
  }
}
