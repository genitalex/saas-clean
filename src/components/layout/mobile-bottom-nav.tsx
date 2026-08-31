'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { navGroups, mobileNavItems } from '@/config/nav-config';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { authClient } from '@/lib/auth-client';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useShellMetric } from '@/hooks/use-shell-metric';

/**
 * A real mobile app-style bottom tab bar, not a shrunk-down desktop sidebar.
 * Four primary destinations plus a "More" sheet for everything else.
 *
 * Hides on scroll-down and reappears on scroll-up (always visible near the
 * top), the way native mobile app chrome behaves. Purely transform-based so
 * it never triggers layout/reflow, and disabled entirely when the user
 * prefers reduced motion.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const visible = useScrollDirection();
  const navRef = React.useRef<HTMLElement>(null);
  useShellMetric(navRef, '--mobile-nav-height');

  const moreIsActive =
    !mobileNavItems.some((item) => item.url === pathname) && pathname !== '/dashboard';

  return (
    <>
      <nav
        ref={navRef}
        aria-label='Primary'
        className={cn(
          'bg-background/85 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md',
          'transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none',
          'md:hidden',
          visible || moreOpen
            ? 'translate-y-0'
            : 'translate-y-[calc(100%+env(safe-area-inset-bottom))]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className='mx-auto flex max-w-md items-stretch justify-between px-1'>
          {mobileNavItems.map((item) => {
            const Icon = item.icon ? Icons[item.icon] : Icons.logo;
            const isActive = pathname === item.url;
            return (
              <li key={item.url} className='flex-1'>
                <Link
                  href={item.url}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-colors',
                      isActive && 'bg-primary/10'
                    )}
                  >
                    <Icon className='size-[22px]' />
                  </span>
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
          <li className='flex-1'>
            <button
              type='button'
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                moreIsActive ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'
              )}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl transition-colors',
                  moreIsActive && 'bg-primary/10'
                )}
              >
                <Icons.moreHorizontal className='size-[22px]' />
              </span>
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} pathname={pathname} />
    </>
  );
}

function MoreSheet({
  open,
  onOpenChange,
  pathname
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
}) {
  const { data: session } = authClient.useSession();
  const primaryUrls = new Set(mobileNavItems.map((item) => item.url));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='bottom'
        className='max-h-[85dvh] overflow-y-auto rounded-t-2xl p-0 md:hidden'
      >
        <SheetHeader className='sr-only'>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>Browse everything else in the workspace.</SheetDescription>
        </SheetHeader>

        <div className='flex items-center gap-3 border-b p-4'>
          <span className='bg-accent flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
            {(session?.user.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <div className='min-w-0'>
            <div className='truncate text-[0.95rem] font-semibold'>
              {session?.user.name ?? 'Account'}
            </div>
            <div className='text-muted-foreground truncate text-sm'>
              {session?.user.email ?? ''}
            </div>
          </div>
        </div>

        <div className='p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]'>
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !primaryUrls.has(item.url));
            if (items.length === 0) return null;
            return (
              <div key={group.label} className='mb-2'>
                <div className='text-muted-foreground px-3 py-2 text-[11px] font-semibold tracking-wide uppercase'>
                  {group.label}
                </div>
                {items.map((item) => {
                  const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                  const isActive = pathname === item.url;
                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'flex items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-medium transition-colors',
                        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                      )}
                    >
                      <Icon className='text-muted-foreground size-5 shrink-0' />
                      <span className='truncate'>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          <div className='mb-1'>
            <div className='text-muted-foreground px-3 py-2 text-[11px] font-semibold tracking-wide uppercase'>
              Account
            </div>
            <Link
              href='/dashboard/profile'
              onClick={() => onOpenChange(false)}
              className='hover:bg-accent/60 flex items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-medium transition-colors'
            >
              <Icons.account className='text-muted-foreground size-5 shrink-0' />
              Profile
            </Link>
            <Link
              href='/dashboard/notifications'
              onClick={() => onOpenChange(false)}
              className='hover:bg-accent/60 flex items-center gap-3.5 rounded-xl px-3 py-3 text-[0.95rem] font-medium transition-colors'
            >
              <Icons.notification className='text-muted-foreground size-5 shrink-0' />
              Notifications
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
