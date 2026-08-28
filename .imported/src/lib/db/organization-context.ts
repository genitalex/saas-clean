import 'server-only';

import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from './index';
import { organizationMembers, organizations, users } from './schema';

export class AuthContextError extends Error {
  constructor(
    message: string,
    readonly code: 'UNAUTHENTICATED' | 'NO_ACTIVE_ORGANIZATION' | 'NOT_A_MEMBER'
  ) {
    super(message);
    this.name = 'AuthContextError';
  }
}

export async function getAuthContext(requestHeaders?: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  if (!session) throw new AuthContextError('Authentication is required', 'UNAUTHENTICATED');
  const activeOrganizationId = session.session.activeOrganizationId;
  if (!activeOrganizationId)
    throw new AuthContextError('An active organization is required', 'NO_ACTIVE_ORGANIZATION');

  const [context] = await db
    .select({ user: users, organization: organizations, membership: organizationMembers })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(
      and(
        eq(organizationMembers.userId, session.user.id),
        eq(organizationMembers.organizationId, activeOrganizationId)
      )
    )
    .limit(1);

  if (!context)
    throw new AuthContextError('Active organization membership was not found', 'NOT_A_MEMBER');
  return {
    user: context.user,
    organization: context.organization,
    membership: context.membership,
    session
  };
}
