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
  organization?: { id: string };
  user?: { id: string };
};

export function NotificationCenter() {
  const { data: session } = useSession();
  const { data: context, isPending } = useQuery<OrganizationContext>({
    queryKey: ['organization-context', 'notification-center'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el contexto');
      return response.json();
    },
    enabled: Boolean(session?.user?.id),
    staleTime: 30_000,
    retry: 1
  });

  const organizationId = context?.organization?.id;
  const userId = context?.user?.id ?? session?.user?.id;

  if (isPending || !userId || !organizationId) return null;

  return <AuthenticatedNotificationCenter organizationId={organizationId} userId={userId} />;
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

  const notificationsQuery = useQuery({
    ...getNotificationsQueryOptions(organizationId, userId),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true
  });
  const unreadQuery = useQuery({
    ...getUnreadNotificationCountQueryOptions(organizationId, userId),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = unreadQuery.data ?? 0;
  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => client.markNotificationAsRead(notificationId),
    onSuccess: invalidateNotifications
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId, userId),
    onSuccess: invalidateNotifications
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => client.deleteNotification(notificationId),
    onSuccess: invalidateNotifications
  });

  const getNotificationPath = (notification: (typeof notifications)[number]) => {
    if (notification.refEntityType === 'task') {
      return notification.refEntityId
        ? `/dashboard/tasks/${notification.refEntityId}`
        : '/dashboard/my-work';
    }
    if (notification.refEntityType === 'event') {
      return notification.refEntityId
        ? `/dashboard/calendar?eventId=${notification.refEntityId}`
        : '/dashboard/calendar';
    }
    if (notification.refEntityType === 'customer') {
      return notification.refEntityId
        ? `/dashboard/customers/${notification.refEntityId}`
        : '/dashboard/customers';
    }
    if (notification.refEntityType === 'opportunity') {
      return notification.refEntityId
        ? `/dashboard/opportunities/${notification.refEntityId}`
        : '/dashboard/opportunities';
    }
    return '/dashboard/notifications';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative h-9 w-9 shrink-0 rounded-[11px]'
          aria-label={
            unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : 'Notificaciones'
          }
        >
          <Icons.notification className='h-4 w-4' />
          {unreadCount > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className='sr-only'>Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        sideOffset={8}
        className='w-[min(380px,calc(100vw-1.5rem))] overflow-hidden p-0'
      >
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <Link href='/dashboard/notifications' className='group flex min-w-0 items-center gap-1'>
            <h4 className='truncate text-sm font-semibold'>Notificaciones</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5' />
          </Link>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-auto shrink-0 px-2 py-1 text-xs'
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Marcar leídas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className='h-[min(400px,60vh)]'>
          {notificationsQuery.isError ? (
            <div className='px-4 py-10 text-center'>
              <p className='text-sm font-medium'>No se pudieron cargar las notificaciones.</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Inténtalo de nuevo en unos segundos.
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-sm font-medium'>Todo al día</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Aquí aparecerán las cosas que merecen tu atención.
              </p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {visibleNotifications.map((notification) => {
                const isUnread = !notification.read;
                return (
                  <div
                    key={notification.id}
                    className={`relative rounded-2xl p-3.5 pr-11 transition-colors ${
                      isUnread ? 'bg-muted' : 'bg-muted/40'
                    }`}
                  >
                    <Link
                      href={getNotificationPath(notification)}
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      className='block outline-none'
                    >
                      <div className='flex items-center gap-2'>
                        <div className='min-w-0 font-medium leading-tight text-foreground'>
                          {notification.title}
                        </div>
                        {isUnread && <span className='bg-primary size-1.5 shrink-0 rounded-full' />}
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
                      aria-label='Eliminar notificación'
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
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
