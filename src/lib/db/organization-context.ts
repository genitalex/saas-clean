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

const TRANSIENT_DB_ERRORS = [
  'Connection terminated unexpectedly',
  'ECONNRESET',
  'Connection terminated',
  'server closed the connection unexpectedly'
];

function isTransientDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_DB_ERRORS.some((needle) => message.includes(needle));
}

async function withTransientDbRetry<T>(operation: () => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDbError(error) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
  throw new Error('Database request failed');
}

const membershipSelection = {
  organizationId: organizationMembers.organizationId,
  userId: organizationMembers.userId,
  role: organizationMembers.role,
  createdAt: organizationMembers.createdAt
} as const;

async function findMembership(userId: string, organizationId: string) {
  return db
    .select({
      user: users,
      organization: organizations,
      membership: membershipSelection
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);
}

async function findFirstMembership(userId: string) {
  return db
    .select({
      user: users,
      organization: organizations,
      membership: membershipSelection
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId))
    .orderBy(organizationMembers.createdAt)
    .limit(1);
}

export async function getAuthContext(requestHeaders?: Headers) {
  return withTransientDbRetry(async () => {
    const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
    if (!session) throw new AuthContextError('Authentication is required', 'UNAUTHENTICATED');

    let activeOrganizationId = session.session.activeOrganizationId;

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

    let [context] = await findMembership(session.user.id, activeOrganizationId);

    if (!context) {
      const [fallback] = await findFirstMembership(session.user.id);

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
  });
}
