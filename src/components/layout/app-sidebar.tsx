'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { authClient } from '@/lib/auth-client';
import { OrgSwitcher } from '@/components/local-org-switcher';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '@/components/icons';

function NavItems({
  items,
  pathname
}: {
  items: (typeof navGroups)[number]['items'];
  pathname: string;
}) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon ? Icons[item.icon] : Icons.logo;
        return item?.items && item?.items?.length > 0 ? (
          <Collapsible key={item.title} defaultOpen={item.isActive} render={<SidebarMenuItem />}>
            <CollapsibleTrigger
              render={
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  className='group/collapsible'
                />
              }
            >
              {item.icon && <Icon />}
              <span>{item.title}</span>
              <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90' />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      render={<Link href={subItem.url} aria-label={subItem.title} />}
                      isActive={pathname === subItem.url}
                    >
                      <span>{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              render={item.disabled ? undefined : <Link href={item.url} aria-label={item.title} />}
              tooltip={item.title}
              isActive={pathname === item.url}
              disabled={item.disabled}
            >
              <Icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SecondaryNavGroup({
  label,
  items,
  pathname
}: {
  label: string;
  items: (typeof navGroups)[number]['items'];
  pathname: string;
}) {
  // Keep "More" open automatically if the active page lives inside it, so the
  // user never lands on a page and finds the sidebar hiding where they are.
  const containsActive = items.some((item) => item.url === pathname);
  const [open, setOpen] = React.useState(containsActive);

  React.useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <SidebarGroup className='mt-1'>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          render={
            <button
              type='button'
              className='group/more text-sidebar-foreground/55 hover:text-sidebar-foreground/80 mb-0.5 flex h-7 w-full shrink-0 items-center gap-1 rounded-md px-3 text-[11px] font-semibold tracking-wide uppercase outline-hidden transition-colors group-data-[collapsible=icon]:hidden'
            />
          }
        >
          <span>{label}</span>
          <Icons.chevronRight className='ml-auto size-3.5 transition-transform duration-200 group-data-panel-open/more:rotate-90' />
        </CollapsibleTrigger>
        <CollapsibleContent className='group-data-[collapsible=icon]:hidden'>
          <div className='pt-1'>
            <NavItems items={items} pathname={pathname} />
          </div>
        </CollapsibleContent>
      </Collapsible>
      {/* In icon-collapsed mode, skip the disclosure UI entirely and just show icons. */}
      <div className='hidden group-data-[collapsible=icon]:block'>
        <NavItems items={items} pathname={pathname} />
      </div>
    </SidebarGroup>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const filteredGroups = useFilteredNavGroups(navGroups);

  return (
    <Sidebar collapsible='icon' variant='sidebar' className='glass-sidebar border-r bg-sidebar'>
      <SidebarHeader className='border-b'>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden py-1'>
        {filteredGroups.map((group) =>
          group.variant === 'secondary' ? (
            <SecondaryNavGroup
              key={group.label}
              label={group.label}
              items={group.items}
              pathname={pathname}
            />
          ) : (
            <SidebarGroup key={group.label || 'ungrouped'}>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <NavItems items={group.items} pathname={pathname} />
            </SidebarGroup>
          )
        )}
      </SidebarContent>
      <SidebarFooter className='border-t'>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size='lg'
                    className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
                  />
                }
              >
                <span className='bg-sidebar-accent flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
                  {(session?.user.name ?? 'A').charAt(0).toUpperCase()}
                </span>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate text-[0.925rem] leading-tight font-semibold'>
                    {session?.user.name ?? 'Account'}
                  </span>
                  <span className='text-sidebar-foreground/55 truncate text-xs leading-tight'>
                    {session?.user.email ?? ''}
                  </span>
                </span>
                <Icons.chevronsDown className='ml-auto size-4 shrink-0' />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--anchor-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='text-muted-foreground px-1 py-1.5 text-sm'>
                      {session?.user.email ?? 'Account'}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <Icons.account className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                    <Icons.notification className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      void authClient.signOut({
                        fetchOptions: { onSuccess: () => router.push('/auth/sign-in') }
                      })
                    }
                  >
                    <Icons.logout className='mr-2 h-4 w-4' />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
