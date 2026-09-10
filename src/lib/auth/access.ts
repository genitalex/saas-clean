import { NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions, normalizeRole } from './permissions';

export function requireOwner(context: AuthContext) {
  if (normalizeRole(context.membership.role) !== 'owner') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  return null;
}

export function requireTeamOwner(context: AuthContext) {
  const permissions = getOrganizationPermissions(context);
  if (!permissions.canManageTeam) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  return null;
}
