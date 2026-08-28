'use client';

import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Membership = {
  organization: {
    id: string;
    name: string;
  };
  membership: {
    role: string;
  };
};

export function OrgSwitcher() {
  const { state } = useSidebar();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const { data: memberships = [], isPending } = useQuery<Membership[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch('/api/organizations', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Could not load workspaces');
      }

      return response.json();
    },
    enabled: Boolean(session)
  });

  const activeId = session?.session.activeOrganizationId;

  const active = memberships.find((item) => item.organization.id === activeId) ?? memberships[0];

  if (!session || isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            Loading workspace…
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!active) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' onClick={() => router.push('/onboarding')}>
            <Icons.add className='size-4' />

            <span className={state === 'collapsed' ? 'sr-only' : ''}>Create workspace</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  async function switchOrganization(organizationId: string) {
    if (organizationId === active.organization.id) {
      return;
    }

    try {
      const response = await fetch('/api/organizations/active', {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error || 'Could not switch workspace');
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ['organizations']
      });

      await queryClient.invalidateQueries({
        queryKey: ['customers']
      });

      await authClient.getSession();

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not switch workspace');
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size='lg' />}>
            <Icons.galleryVerticalEnd className='size-4' />

            <span className={state === 'collapsed' ? 'sr-only' : 'truncate'}>
              {active.organization.name}
            </span>

            <Icons.chevronsUpDown className='ml-auto size-4' />
          </DropdownMenuTrigger>

          <DropdownMenuContent align='start' className='min-w-56'>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>

              {memberships.map((item) => (
                <DropdownMenuItem
                  key={item.organization.id}
                  onClick={() => void switchOrganization(item.organization.id)}
                >
                  {item.organization.name}

                  {item.organization.id === active.organization.id && (
                    <Icons.check className='ml-auto size-4' />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem onClick={() => router.push('/dashboard/workspaces')}>
                <Icons.settings className='mr-2 size-4' />
                Manage workspaces
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
