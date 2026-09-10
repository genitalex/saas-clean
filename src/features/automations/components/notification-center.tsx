'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  getNotificationsQueryOptions,
  getUnreadNotificationCountQueryOptions,
  notificationKeys
} from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';

const MAX_VISIBLE = 5;

function formatRelativeTime(date: string | Date) {
  const target = new Date(date).getTime();
  const diff = Date.now() - target;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7) return `Hace ${days} d`;

  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [organizationId, setOrganizationId] = useState('');
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-notification-center]')) setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!session?.user?.id || !organizationId) return null;

  return (
    <AuthenticatedNotificationCenter
      organizationId={organizationId}
      userId={session.user.id}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

function AuthenticatedNotificationCenter({
  organizationId,
  userId,
  open,
  onOpenChange
}: {
  organizationId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useSuspenseQuery(
    getUnreadNotificationCountQueryOptions(organizationId, userId)
  );
  const { data: notifications = [] } = useSuspenseQuery(
    getNotificationsQueryOptions(organizationId, userId)
  );

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => client.markNotificationAsRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: (notificationId: string) => client.deleteNotification(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const getNotificationPath = (notification: (typeof notifications)[number]) => {
    if (notification.refEntityType === 'task' && notification.refEntityId) {
      return `/dashboard/tasks?task=${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'event' && notification.refEntityId) {
      return `/dashboard/calendar?eventId=${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'opportunity' && notification.refEntityId) {
      return `/dashboard/opportunities/${encodeURIComponent(notification.refEntityId)}`;
    }
    if (notification.refEntityType === 'customer' && notification.refEntityId) {
      return `/dashboard/customers/${encodeURIComponent(notification.refEntityId)}`;
    }
    return '/dashboard/notifications';
  };

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  return (
    <div data-notification-center className='relative inline-block shrink-0'>
      <button
        type='button'
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup='menu'
        onClick={() => onOpenChange(!open)}
        className={`relative inline-flex size-9 cursor-pointer items-center justify-center rounded-[10px] border bg-background transition-colors ${
          open
            ? 'border-border bg-muted/40'
            : 'border-border/60 hover:border-border hover:bg-muted/40'
        }`}
      >
        <Icons.notification className='size-[17px] text-muted-foreground' strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className='absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-4 text-primary-foreground shadow-sm'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className='sr-only'>Notificaciones</span>
      </button>

      {open && (
        <div
          role='menu'
          aria-label='Lista de notificaciones'
          className='absolute right-0 top-[calc(100%+8px)] z-[100] w-[min(92vw,360px)] rounded-[14px] border border-border/70 bg-muted/70 p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm'
        >
          <div className='mb-1 flex items-center justify-between gap-3 px-1.5 py-1'>
            <Link
              href='/dashboard/notifications'
              onClick={() => onOpenChange(false)}
              className='text-[12px] font-semibold text-foreground transition-opacity hover:opacity-70'
            >
              Notificaciones
            </Link>
            <div className='flex items-center gap-2'>
              {unreadCount > 0 && (
                <span className='rounded-full bg-background px-2 py-1 text-[9px] font-medium text-muted-foreground'>
                  {unreadCount} sin leer
                </span>
              )}
              {unreadCount > 0 && (
                <button
                  type='button'
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className='text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
                >
                  {markAllAsRead.isPending ? 'Marcando…' : 'Marcar todo'}
                </button>
              )}
            </div>
          </div>

          <div className='flex max-h-[360px] flex-col gap-1 overflow-y-auto'>
            {visibleNotifications.length === 0 ? (
              <div className='rounded-[10px] bg-background/70 px-4 py-8 text-center'>
                <Icons.notification
                  className='mx-auto mb-2 size-7 text-muted-foreground/40'
                  strokeWidth={1.6}
                />
                <p className='text-[11px] font-medium text-foreground'>Todo al día</p>
                <p className='mt-1 text-[10px] text-muted-foreground'>
                  No tienes notificaciones nuevas.
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => {
                const unread = !notification.read;

                return (
                  <div
                    key={notification.id}
                    className={`group relative flex w-full items-start gap-2.5 rounded-[10px] border px-2.5 py-2.5 text-left transition-colors ${
                      unread
                        ? 'border-border/70 bg-background hover:border-border'
                        : 'border-transparent bg-transparent hover:bg-background/70'
                    }`}
                  >
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        unread ? 'bg-primary' : 'bg-muted-foreground/20'
                      }`}
                    />

                    <Link
                      role='menuitem'
                      href={getNotificationPath(notification)}
                      onClick={() => {
                        if (unread) markAsRead.mutate(notification.id);
                        onOpenChange(false);
                      }}
                      className='min-w-0 flex-1 pr-7 outline-none'
                    >
                      <span
                        className={`block truncate text-[11px] leading-4 ${
                          unread
                            ? 'font-medium text-foreground'
                            : 'font-normal text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </span>
                      <span className='mt-0.5 block truncate text-[10px] leading-4 text-muted-foreground'>
                        {notification.message}
                      </span>
                      <span className='mt-1 block text-[9px] text-muted-foreground/60'>
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </Link>

                    <button
                      type='button'
                      aria-label='Eliminar notificación'
                      onClick={() => deleteNotification.mutate(notification.id)}
                      className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-md text-muted-foreground/50 opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100'
                    >
                      <Icons.close className='size-3.5' strokeWidth={2} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className='mt-1 border-t border-border/50 pt-1'>
            <Link
              href='/dashboard/notifications'
              onClick={() => onOpenChange(false)}
              className='flex items-center justify-center rounded-[9px] px-2 py-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground'
            >
              Ver todas las notificaciones
              <Icons.chevronRight className='ml-0.5 size-3.5' />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
