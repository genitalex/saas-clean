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
import { useState } from 'react';

const MAX_VISIBLE = 5;

export function NotificationCenter() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  if (!session?.user?.id) return null;

  // Get organization ID from session or use a fallback
  // The organization context should be available from the page-level auth context
  // For now, we'll store a temporary org ID in session storage or use a default
  const organizationId =
    typeof window !== 'undefined' ? localStorage.getItem('activeOrganizationId') || '' : '';

  if (!organizationId) return null;

  const userId = session.user.id;

  // Query for unread count
  const { data: unreadCount = 0 } = useSuspenseQuery(
    getUnreadNotificationCountQueryOptions(organizationId, userId)
  );

  // Query for notifications (only when popover is open for performance)
  const { data: notifications = [] } = useSuspenseQuery(
    getNotificationsQueryOptions(organizationId, userId)
  );

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => client.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => client.markAllNotificationsAsRead(organizationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const handleNotificationClick = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationPath = (notification: (typeof notifications)[0]) => {
    if (notification.refEntityType === 'task') {
      return `/dashboard/tasks/${notification.refEntityId}`;
    }
    if (notification.refEntityType === 'event') {
      return `/dashboard/calendar?eventId=${notification.refEntityId}`;
    }
    return '/dashboard/notifications';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Button variant='ghost' size='icon' className='relative h-8 w-8'>
          <Icons.notification className='h-4 w-4' />
          {unreadCount > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className='sr-only'>Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between px-4 pt-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1'>
            <h4 className='text-sm font-semibold group-hover:underline'>Notifications</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                {unreadCount} new
              </span>
            )}
            {unreadCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs'
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>No notifications yet</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {visibleNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationPath(notification)}
                  className={`rounded-md p-3 text-sm transition-colors hover:bg-muted ${
                    notification.read ? 'text-muted-foreground' : 'bg-muted/50'
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className='font-medium'>{notification.title}</div>
                  <div className='text-xs'>{notification.message}</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
