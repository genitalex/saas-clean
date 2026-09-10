'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getNotificationsQueryOptions, notificationKeys } from '@/features/automations/api/queries';
import * as client from '@/features/automations/api/client';
import { useSession } from '@/lib/auth-client';

function getNotificationPath(notification: {
  refEntityType?: string | null;
  refEntityId?: string | null;
}) {
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
  return '/dashboard/notifications';
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const organizationId =
    typeof window !== 'undefined' ? localStorage.getItem('activeOrganizationId') || '' : '';

  const { data: notifications = [], isLoading } = useQuery({
    ...getNotificationsQueryOptions(organizationId, session?.user.id ?? ''),
    enabled: Boolean(organizationId && session?.user.id),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => client.markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const markAllMutation = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId, session?.user.id ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  });

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const renderList = (items: typeof notifications) => {
    if (isLoading) {
      return <div className='h-40 animate-pulse rounded-2xl bg-muted/50' />;
    }
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
            onMarkAsRead={(id) => markReadMutation.mutate(id)}
            onDismiss={(id) => deleteMutation.mutate(id)}
            onOpen={(id) => {
              markReadMutation.mutate(id);
              router.push(getNotificationPath(notification));
            }}
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
        unread.length > 0 ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending ? 'Marcando…' : 'Marcar todas como leídas'}
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
