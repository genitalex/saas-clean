import type { AuthContext } from '@/lib/db/organization-context';

export type OrganizationRole = 'owner' | 'member';
export type OrganizationPlan = 'solo' | 'team';

export type OrganizationPermissions = {
  canManageTeam: boolean;
  canManageUsers: boolean;
  canManageBilling: boolean;
  canManageOrganization: boolean;
  canManageIntegrations: boolean;
  canManageAutomations: boolean;
};

export function normalizeRole(role: string): OrganizationRole {
  return role === 'owner' ? 'owner' : 'member';
}

export function getOrganizationPermissions(
  context: Pick<AuthContext, 'membership' | 'organization'>
): OrganizationPermissions {
  const role = normalizeRole(context.membership.role);
  const plan = context.organization.plan;
  const isOwner = role === 'owner';
  const hasTeamPlan = plan === 'team';

  return {
    canManageTeam: isOwner && hasTeamPlan,
    canManageUsers: isOwner && hasTeamPlan,
    canManageBilling: isOwner,
    canManageOrganization: isOwner,
    canManageIntegrations: isOwner,
    canManageAutomations: isOwner
  };
}
