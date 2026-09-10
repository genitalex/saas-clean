'use client';

import { useQuery } from '@tanstack/react-query';
import type { NavItem, NavGroup } from '@/types';

type OrganizationRole = 'owner' | 'member';
type OrganizationPlan = 'solo' | 'team';

type AccessContext = {
  role: OrganizationRole;
  plan: OrganizationPlan;
};

function useAccessContext() {
  return useQuery<AccessContext>({
    queryKey: ['organization-context', 'nav'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('Organization context unavailable');
      const data = (await response.json()) as { user: AccessContext };
      return data.user;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false
  });
}

function canAccess(item: NavItem, context?: AccessContext) {
  const access = item.access;
  if (!access) return true;
  if (!context) return false;
  if (access.role && access.role !== context.role) return false;
  if (access.plan && access.plan !== context.plan) return false;
  return true;
}

function filterItems(items: NavItem[], context?: AccessContext): NavItem[] {
  return items
    .filter((item) => canAccess(item, context))
    .map((item) => ({
      ...item,
      items: item.items ? filterItems(item.items, context) : item.items
    }));
}

export function useFilteredNavItems(items: NavItem[]) {
  const { data } = useAccessContext();
  return filterItems(items, data);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const { data } = useAccessContext();
  return groups
    .map((group) => ({ ...group, items: filterItems(group.items, data) }))
    .filter((group) => group.items.length > 0);
}
