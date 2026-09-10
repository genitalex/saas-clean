'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { notificationKeys, getNotificationsQueryOptions } from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useRouter } from 'next/navigation';

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

  const renderList = (items: typeof notifications) => {
    if (notificationsQuery.isLoading) {
      return (
        <div className='text-muted-foreground py-16 text-center text-sm'>
          Cargando notificaciones…
        </div>
      );
    }
    if (notificationsQuery.isError) {
      return (
        <div className='text-destructive py-16 text-center text-sm'>
          No se pudieron cargar las notificaciones.
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16 text-center'>
          <Icons.notification className='text-muted-foreground/35 mb-3 h-10 w-10' />
          <p className='text-sm font-medium'>No tienes notificaciones.</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Aquí aparecerán las cosas que merecen tu atención.
          </p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => {
          const isUnread = !notification.read;
          return (
            <article
              key={notification.id}
              className={`relative rounded-2xl p-4 pr-24 transition-colors ${
                isUnread ? 'bg-muted' : 'bg-muted/40'
              }`}
            >
              <button
                type='button'
                className='block w-full text-left outline-none'
                onClick={() => {
                  if (isUnread) markAsRead.mutate(notification.id);
                  router.push(pathFor(notification));
                }}
              >
                <div className='flex items-center gap-2'>
                  <h3 className='text-[15px] font-semibold leading-tight'>{notification.title}</h3>
                  {isUnread && <span className='bg-primary size-1.5 shrink-0 rounded-full' />}
                </div>
                <p className='text-muted-foreground mt-1 text-[13px] leading-5'>
                  {notification.message}
                </p>
                <p className='text-muted-foreground/60 mt-2 text-[11px]'>
                  {new Date(notification.createdAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </button>
              <div className='absolute right-2.5 top-2.5 flex items-center gap-1'>
                {isUnread && (
                  <button
                    type='button'
                    aria-label='Marcar como leída'
                    onClick={() => markAsRead.mutate(notification.id)}
                    className='flex size-8 items-center justify-center rounded-[10px] border border-border/70 bg-background shadow-sm transition hover:bg-accent'
                  >
                    <Icons.check size={15} />
                  </button>
                )}
                <button
                  type='button'
                  aria-label='Eliminar notificación'
                  onClick={() => deleteNotification.mutate(notification.id)}
                  className='flex size-8 items-center justify-center rounded-[10px] border border-border/70 bg-background shadow-sm transition hover:bg-accent'
                >
                  <Icons.close size={15} strokeWidth={2.2} />
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
        <TabsList>
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
