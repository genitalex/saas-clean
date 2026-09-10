'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsQueryOptions,
  getUnreadNotificationCountQueryOptions,
  notificationKeys
} from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';
import { useState } from 'react';

const MAX_VISIBLE = 5;

type OrganizationContext = {
  organization: { id: string };
  user: { id: string };
};

export function NotificationCenter() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const { data: context } = useQuery<OrganizationContext>({
    queryKey: ['organization-context', 'notification-center'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el contexto');
      return response.json();
    },
    enabled: Boolean(session?.user?.id),
    staleTime: 30_000
  });

  const organizationId = context?.organization.id;
  const userId = context?.user.id ?? session?.user?.id;

  const unreadQuery = useQuery({
    ...getUnreadNotificationCountQueryOptions(organizationId ?? '', userId ?? ''),
    enabled: Boolean(organizationId && userId),
    refetchInterval: 10_000,
    staleTime: 0
  });

  const notificationsQuery = useQuery({
    ...getNotificationsQueryOptions(organizationId ?? '', userId ?? ''),
    enabled: Boolean(organizationId && userId),
    refetchInterval: 10_000,
    staleTime: 0
  });

  const queryClient = useQueryClient();
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      client.markNotificationAsRead(notificationId, organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      client.deleteNotification(notificationId, organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  if (!session?.user?.id || !organizationId || !userId) {
    return null;
  }

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadQuery.data ?? 0;
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  const getNotificationPath = (notification: (typeof notifications)[number]) => {
    if (notification.refEntityType === 'task' && notification.refEntityId) {
      return `/dashboard/tasks/${notification.refEntityId}`;
    }
    if (notification.refEntityType === 'event' && notification.refEntityId) {
      return `/dashboard/calendar?eventId=${notification.refEntityId}`;
    }
    if (notification.refEntityType === 'customer' && notification.refEntityId) {
      return `/dashboard/customers/${notification.refEntityId}`;
    }
    if (notification.refEntityType === 'opportunity' && notification.refEntityId) {
      return `/dashboard/opportunities/${notification.refEntityId}`;
    }
    if (notification.refEntityType === 'team') return '/dashboard/team';
    return '/dashboard/notifications';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={<Button variant='ghost' size='icon' className='relative h-8 w-8 shrink-0' />}
      >
        <Icons.notification className='h-4 w-4' />
        {unreadCount > 0 && (
          <span className='bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className='sr-only'>Notificaciones</span>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[calc(100vw-1.5rem)] p-0 sm:w-[380px]'
        sideOffset={8}
      >
        <div className='flex items-center justify-between gap-3 px-4 pt-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1'>
            <h4 className='text-sm font-semibold'>Notificaciones</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5' />
          </Link>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground h-auto px-2 py-1 text-xs'
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Marcar como leídas
            </Button>
          )}
        </div>
        <Separator className='mt-3' />
        <ScrollArea className='h-[400px]'>
          {notificationsQuery.isLoading ? (
            <div className='flex flex-col gap-2 p-3'>
              {[1, 2, 3].map((item) => (
                <div key={item} className='h-20 animate-pulse rounded-2xl bg-muted/60' />
              ))}
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>No tienes notificaciones.</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative rounded-2xl p-3.5 pr-12 text-sm transition-all hover:ring-1 hover:ring-border ${
                    notification.read ? 'bg-muted/40' : 'bg-muted'
                  }`}
                >
                  <Link
                    href={getNotificationPath(notification)}
                    onClick={() => {
                      if (!notification.read) markAsReadMutation.mutate(notification.id);
                      setIsOpen(false);
                    }}
                    className='block outline-none'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='font-medium leading-tight'>{notification.title}</div>
                      {!notification.read && <span className='size-1.5 rounded-full bg-primary' />}
                    </div>
                    <div className='text-muted-foreground mt-1 text-xs leading-relaxed'>
                      {notification.message}
                    </div>
                    <div className='text-muted-foreground/60 mt-1.5 text-[11px]'>
                      {new Date(notification.createdAt).toLocaleString('es-ES')}
                    </div>
                  </Link>
                  <button
                    type='button'
                    aria-label='Cerrar notificación'
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteNotificationMutation.mutate(notification.id);
                    }}
                    className='absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-[10px] border border-border/70 bg-background text-foreground shadow-sm transition hover:bg-accent'
                  >
                    <Icons.close size={15} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
