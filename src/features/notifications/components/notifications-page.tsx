'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsQueryOptions,
  getUnreadNotificationCountQueryOptions,
  notificationKeys
} from '@/features/automations/api/queries';
import * as notificationClient from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: context } = useQuery<{ organization: { id: string }; user: { id: string } }>({
    queryKey: ['organization-context', 'notifications-page'],
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

  const notificationsQuery = useQuery({
    ...getNotificationsQueryOptions(organizationId ?? '', userId ?? ''),
    enabled: Boolean(organizationId && userId),
    refetchInterval: 10_000,
    staleTime: 0
  });
  const unreadQuery = useQuery({
    ...getUnreadNotificationCountQueryOptions(organizationId ?? '', userId ?? ''),
    enabled: Boolean(organizationId && userId),
    refetchInterval: 10_000,
    staleTime: 0
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      notificationClient.markNotificationAsRead(id, organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });
  const markAll = useMutation({
    mutationFn: () => notificationClient.markAllNotificationsAsRead(organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });
  const remove = useMutation({
    mutationFn: (id: string) => notificationClient.deleteNotification(id, organizationId!, userId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const notifications = notificationsQuery.data ?? [];
  const unread = notifications.filter((item) => !item.read);
  const read = notifications.filter((item) => item.read);

  const routeFor = (notification: (typeof notifications)[number]) => {
    if (notification.refEntityType === 'task' && notification.refEntityId)
      return `/dashboard/tasks/${notification.refEntityId}`;
    if (notification.refEntityType === 'event' && notification.refEntityId)
      return `/dashboard/calendar?eventId=${notification.refEntityId}`;
    if (notification.refEntityType === 'customer' && notification.refEntityId)
      return `/dashboard/customers/${notification.refEntityId}`;
    if (notification.refEntityType === 'opportunity' && notification.refEntityId)
      return `/dashboard/opportunities/${notification.refEntityId}`;
    if (notification.refEntityType === 'team') return '/dashboard/team';
    return null;
  };

  const renderList = (items: typeof notifications) => {
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>No tienes notificaciones.</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-2'>
        {items.map((notification) => (
          <NotificationCard
            key={notification.id}
            id={notification.id}
            title={notification.title}
            body={notification.message}
            status={notification.read ? 'read' : 'unread'}
            createdAt={notification.createdAt}
            onMarkAsRead={(id) => markRead.mutate(id)}
            onDismiss={(id) => remove.mutate(id)}
            actions={
              routeFor(notification) ? [{ id: 'open', label: 'Abrir', type: 'redirect' }] : []
            }
            onAction={(id) => {
              const route = routeFor(notification);
              if (route) {
                markRead.mutate(id);
                router.push(route);
              }
            }}
            dismissOnClick={false}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Notificaciones'
      pageDescription='Todo lo que merece tu atención, sin ruido.'
      pageHeaderAction={
        (unreadQuery.data ?? unread.length) > 0 ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Marcar como leídas
          </Button>
        ) : undefined
      }
    >
      {notificationsQuery.isLoading ? (
        <div className='space-y-2'>
          {[1, 2, 3].map((item) => (
            <div key={item} className='h-24 animate-pulse rounded-2xl bg-muted/60' />
          ))}
        </div>
      ) : (
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
      )}
    </PageContainer>
  );
}
