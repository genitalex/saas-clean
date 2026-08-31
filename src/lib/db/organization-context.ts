import 'server-only';

import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { db } from './index';
import { organizationMembers, organizations, sessions, users } from './schema';

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

  let activeOrganizationId = session.session.activeOrganizationId;

  // Self-heal stale sessions: if a valid membership exists but the session
  // has no active organization, select the first organization the user belongs to.
  if (!activeOrganizationId) {
    const [membership] = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, session.user.id))
      .orderBy(organizationMembers.createdAt)
      .limit(1);

    if (membership) {
      activeOrganizationId = membership.organizationId;
      await db
        .update(sessions)
        .set({ activeOrganizationId, updatedAt: new Date() })
        .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));
    }
  }

  if (!activeOrganizationId)
    throw new AuthContextError('An active organization is required', 'NO_ACTIVE_ORGANIZATION');

  let [context] = await db
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

  // Recover from a stale session pointing at an organization the user no longer
  // belongs to. Prefer another real membership instead of failing every query.
  if (!context) {
    const [fallback] = await db
      .select({
        user: users,
        organization: organizations,
        membership: organizationMembers
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, session.user.id))
      .orderBy(organizationMembers.createdAt)
      .limit(1);

    if (fallback) {
      context = fallback;
      activeOrganizationId = fallback.organization.id;
      await db
        .update(sessions)
        .set({ activeOrganizationId, updatedAt: new Date() })
        .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));
    }
  }

  if (!context)
    throw new AuthContextError('Active organization membership was not found', 'NOT_A_MEMBER');

  return {
    user: context.user,
    organization: context.organization,
    membership: context.membership,
    session
  };
}
