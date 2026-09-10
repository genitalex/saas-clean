'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getNotificationsQueryOptions, notificationKeys } from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';

function formatRelativeTime(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days < 7) return `Hace ${days} d`;

  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: context } = useQuery<{ organization?: { id: string }; user?: { id: string } }>({
    queryKey: ['organization-context', 'notifications-page'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el contexto');
      return response.json();
    },
    enabled: Boolean(session?.user?.id),
    staleTime: 30_000
  });

  const organizationId = context?.organization?.id;
  const userId = context?.user?.id ?? session?.user?.id;

  const notificationsQuery = useQuery({
    ...getNotificationsQueryOptions(organizationId ?? '', userId ?? ''),
    enabled: Boolean(organizationId && userId)
  });

  const notifications = notificationsQuery.data ?? [];
  const unread = notifications.filter((notification) => !notification.read);
  const read = notifications.filter((notification) => notification.read);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => client.markNotificationAsRead(id),
    onSuccess: invalidate
  });
  const markAllAsRead = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId!, userId!),
    onSuccess: invalidate
  });
  const deleteNotification = useMutation({
    mutationFn: (id: string) => client.deleteNotification(id),
    onSuccess: invalidate
  });

  const pathFor = (notification: (typeof notifications)[number]) => {
    if (notification.refEntityType === 'task') {
      return notification.refEntityId
        ? `/dashboard/tasks?task=${encodeURIComponent(notification.refEntityId)}`
        : '/dashboard/my-work';
    }
    if (notification.refEntityType === 'event') {
      return notification.refEntityId
        ? `/dashboard/calendar?eventId=${encodeURIComponent(notification.refEntityId)}`
        : '/dashboard/calendar';
    }
    if (notification.refEntityType === 'customer') {
      return notification.refEntityId
        ? `/dashboard/customers/${encodeURIComponent(notification.refEntityId)}`
        : '/dashboard/customers';
    }
    if (notification.refEntityType === 'opportunity') {
      return notification.refEntityId
        ? `/dashboard/opportunities/${encodeURIComponent(notification.refEntityId)}`
        : '/dashboard/opportunities';
    }
    return '/dashboard/notifications';
  };

  const renderList = (items: typeof notifications) => {
    if (notificationsQuery.isLoading) {
      return <div className='py-16 text-center text-sm text-muted-foreground'>Cargando…</div>;
    }

    if (notificationsQuery.isError) {
      return (
        <div className='rounded-xl border border-border/60 bg-muted/20 px-4 py-12 text-center'>
          <p className='text-sm font-medium'>No se pudieron cargar las notificaciones.</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Vuelve a intentarlo en unos segundos.
          </p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <span className='mb-3 flex size-10 items-center justify-center rounded-xl bg-muted'>
            <Icons.notification className='size-5 text-muted-foreground/50' strokeWidth={1.6} />
          </span>
          <p className='text-sm font-medium'>Todo al día</p>
          <p className='mt-1 text-xs text-muted-foreground'>No hay nada nuevo que revisar.</p>
        </div>
      );
    }

    return (
      <div className='mx-auto w-full max-w-4xl overflow-hidden rounded-[14px] border border-border/60 bg-muted/30'>
        {items.map((notification, index) => {
          const isUnread = !notification.read;
          return (
            <article
              key={notification.id}
              className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors ${
                index > 0 ? 'border-t border-border/50' : ''
              } ${isUnread ? 'bg-background' : 'bg-transparent hover:bg-background/60'}`}
            >
              <span
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                  isUnread ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />

              <button
                type='button'
                className='min-w-0 flex-1 text-left outline-none'
                onClick={() => {
                  if (isUnread) markAsRead.mutate(notification.id);
                  router.push(pathFor(notification));
                }}
              >
                <div className='flex items-center gap-2'>
                  <h3
                    className={`truncate text-[14px] leading-5 ${
                      isUnread
                        ? 'font-semibold text-foreground'
                        : 'font-medium text-muted-foreground'
                    }`}
                  >
                    {notification.title}
                  </h3>
                </div>
                <p className='mt-0.5 text-[13px] leading-5 text-muted-foreground'>
                  {notification.message}
                </p>
                <p className='mt-1 text-[11px] text-muted-foreground/60'>
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </button>

              <div className='flex shrink-0 items-center gap-1'>
                {isUnread && (
                  <button
                    type='button'
                    aria-label='Marcar como leída'
                    onClick={() => markAsRead.mutate(notification.id)}
                    className='flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100'
                  >
                    <Icons.check className='size-3.5' />
                  </button>
                )}
                <button
                  type='button'
                  aria-label='Eliminar notificación'
                  onClick={() => deleteNotification.mutate(notification.id)}
                  className='flex size-7 items-center justify-center rounded-lg text-muted-foreground/50 opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100'
                >
                  <Icons.close className='size-3.5' strokeWidth={2} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Notificaciones'
      pageDescription='Todo lo que merece tu atención, sin ruido.'
      pageHeaderAction={
        unread.length > 0 ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? 'Marcando…' : 'Marcar todas como leídas'}
          </Button>
        ) : undefined
      }
    >
      <Tabs defaultValue='all'>
        <TabsList className='w-full max-w-full overflow-x-auto bg-muted/60 sm:w-auto'>
          <TabsTrigger value='all'>Todas ({notifications.length})</TabsTrigger>
          <TabsTrigger value='unread'>Sin leer ({unread.length})</TabsTrigger>
          <TabsTrigger value='read'>Leídas ({read.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {renderList(notifications)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {renderList(unread)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {renderList(read)}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
