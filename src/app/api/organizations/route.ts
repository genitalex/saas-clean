import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers, organizations, sessions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  plan: z.enum(['solo', 'team']).default('solo'),
  seatLimit: z.number().int().min(1).max(500).default(1),
  industry: z.string().trim().max(80).optional().nullable(),
  teamSize: z.number().int().min(1).max(500).optional().nullable(),
  mainUseCase: z.string().trim().max(80).optional().nullable()
});

function errorResponse(message = 'ORGANIZATIONS_REQUEST_FAILED', status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function makeSlug(name: string) {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized || 'workspace'}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse('AUTHENTICATION_REQUIRED', 401);
  try {
    const memberships = await db
      .select({ organization: organizations, membership: organizationMembers })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, session.user.id));
    return NextResponse.json(memberships);
  } catch (error) {
    console.error('[organizations:list]', error);
    return errorResponse();
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse('AUTHENTICATION_REQUIRED', 401);

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('INVALID_ORGANIZATION_DATA', 400);

  const input = parsed.data;
  const plan = input.plan;
  const seatLimit = plan === 'solo' ? 1 : input.seatLimit;
  const teamSize = plan === 'solo' ? 1 : (input.teamSize ?? seatLimit);

  if (plan === 'team' && seatLimit < 2) {
    return errorResponse('TEAM_REQUIRES_AT_LEAST_TWO_SEATS', 400);
  }

  try {
    const now = new Date();
    const organization = await db.transaction(async (tx) => {
      const id = crypto.randomUUID();
      const [created] = await tx
        .insert(organizations)
        .values({
          id,
          name: input.name,
          slug: makeSlug(input.name),
          plan,
          seatLimit,
          industry: input.industry || null,
          teamSize,
          mainUseCase: input.mainUseCase || null,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      await tx.insert(organizationMembers).values({
        organizationId: id,
        userId: session.user.id,
        role: 'owner',
        createdAt: now
      });

      await tx
        .update(sessions)
        .set({ activeOrganizationId: id, updatedAt: now })
        .where(and(eq(sessions.id, session.session.id), eq(sessions.userId, session.user.id)));

      return created;
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('[organizations:create]', error);
    return errorResponse();
  }
}
