import { auth } from '@/lib/auth';
// ============================================================
// Route Handler — Users (list + create)
// ============================================================
// Used with Pattern 2 (Route Handlers + ORM) or Pattern 3 (BFF).
//
// Fullstack (ORM): Replace fakeUsers calls with your ORM
//   const users = await db.query.users.findMany({ ... })
//
// BFF (proxy): Replace with fetch to your external backend
//   const res = await fetch(`${BACKEND_URL}/users?${searchParams}`, {
//     headers: { Authorization: `Bearer ${token}` }
//   })
//   return NextResponse.json(await res.json())
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import { fakeUsers } from '@/constants/mock-api-users';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  const context = await getAuthContext(request.headers);
  if (!getOrganizationPermissions(context).canManageUsers)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const roles = searchParams.get('roles') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;

  const data = await fakeUsers.getUsers({
    page,
    limit,
    roles,
    search,
    sort
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 });
  const context = await getAuthContext(request.headers);
  if (!getOrganizationPermissions(context).canManageUsers)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  const body = await request.json();
  const data = await fakeUsers.createUser(body);
  return NextResponse.json(data, { status: 201 });
}
