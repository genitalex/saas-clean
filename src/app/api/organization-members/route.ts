import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { organizationMembers, users } from '@/lib/db/schema';

export async function GET(_request: NextRequest) {
  try {
    const { organization } = await getAuthContext();
    const members = await db
      .select({ id: users.id, name: users.name })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, organization.id));
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
