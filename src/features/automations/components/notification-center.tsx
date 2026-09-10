'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsQueryOptions,
  getUnreadNotificationCountQueryOptions,
  notificationKeys
} from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

const MAX_VISIBLE = 5;

export function NotificationCenter() {
  const { data: session } = useSession();
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/organization-context', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { organization?: { id?: string } };
      })
      .then((data) => {
        if (mounted) setOrganizationId(data?.organization?.id ?? '');
      })
      .catch(() => {
        if (mounted) setOrganizationId('');
      });
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  if (!session?.user?.id || !organizationId) return null;
  return (
    <AuthenticatedNotificationCenter organizationId={organizationId} userId={session.user.id} />
  );
}

function AuthenticatedNotificationCenter({
  organizationId,
  userId
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCount = 0 } = useSuspenseQuery(
    getUnreadNotificationCountQueryOptions(organizationId, userId)
  );

  const { data: notifications = [] } = useSuspenseQuery(
    getNotificationsQueryOptions(organizationId, userId)
  );

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => client.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => client.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const getNotificationPath = (notification: (typeof notifications)[0]) => {
    if (notification.refEntityType === 'task' && notification.refEntityId) {
      return `/dashboard/tasks?task=${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'event' && notification.refEntityId) {
      return `/dashboard/calendar?eventId=${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'opportunity' && notification.refEntityId) {
      return `/dashboard/opportunities?opportunity=${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'customer' && notification.refEntityId) {
      return `/dashboard/customers?customer=${encodeURIComponent(notification.refEntityId)}`;
    }
    return '/dashboard/notifications';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button variant='ghost' size='icon' className='relative size-9 shrink-0 sm:size-8'>
          <Icons.notification className='h-4 w-4' />
          {unreadCount > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className='sr-only'>Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-1rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between gap-3 px-4 pt-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1'>
            <h4 className='text-sm font-semibold group-hover:underline'>Notificaciones</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground h-auto px-2 py-1 text-xs'
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Marcar como leídas
            </Button>
          )}
        </div>
        <Separator className='mt-3' />
        <ScrollArea className='h-[400px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>No tienes notificaciones.</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative rounded-2xl p-3.5 pr-12 text-sm transition-all ${
                    notification.read ? 'bg-muted/40 text-muted-foreground' : 'bg-muted'
                  } hover:ring-1 hover:ring-border`}
                >
                  <Link
                    href={getNotificationPath(notification)}
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    className='block outline-none'
                  >
                    <div className='font-medium leading-tight text-foreground'>
                      {notification.title}
                    </div>
                    <div className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                      {notification.message}
                    </div>
                    <div className='mt-1.5 text-[11px] text-muted-foreground/60'>
                      {new Date(notification.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
                    className='absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-[10px] border border-border/70 bg-background text-foreground opacity-90 shadow-sm transition-all hover:scale-105 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
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
