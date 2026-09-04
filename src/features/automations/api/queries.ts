import { queryOptions } from '@tanstack/react-query';
import type {
  Automation,
  AutomationFilters,
  Notification,
  NotificationApi,
  AttentionItem,
  AttentionItemApi
} from '../types';
import { deserializeDate } from '@/lib/date-utils';
// API routes handle service layer calls, this file is client-only

/* ---------- Automation Query Keys ---------- */
export const automationKeys = {
  all: ['automations'] as const,
  lists: () => [...automationKeys.all, 'list'] as const,
  list: (orgId: string, filters?: AutomationFilters) =>
    [...automationKeys.lists(), { orgId, filters }] as const,
  detail: (id: string) => [...automationKeys.all, 'detail', id] as const
};

/* ---------- Notification Query Keys ---------- */
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (orgId: string, userId: string, unreadOnly?: boolean) =>
    [...notificationKeys.lists(), { orgId, userId, unreadOnly }] as const,
  unreadCount: (orgId: string, userId: string) =>
    [...notificationKeys.all, 'unreadCount', orgId, userId] as const
};

/* ---------- Attention Item Query Keys ---------- */
export const attentionKeys = {
  all: ['attention'] as const,
  lists: () => [...attentionKeys.all, 'list'] as const,
  list: (status?: string) => [...attentionKeys.lists(), { status }] as const,
  detail: (id: string) => [...attentionKeys.all, 'detail', id] as const
};

/* ---------- Automation Query Options ---------- */
export function getAutomationsQueryOptions(organizationId: string, filters?: AutomationFilters) {
  return queryOptions({
    queryKey: automationKeys.list(organizationId, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ organizationId });
      const res = await fetch(`/api/automations/get?${params}`);
      if (!res.ok) throw new Error('Failed to fetch automations');
      return res.json() as Promise<Automation[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes
  });
}

/* ---------- Notification Query Options ---------- */
export function getNotificationsQueryOptions(
  organizationId: string,
  userId: string,
  unreadOnly?: boolean
) {
  return queryOptions({
    queryKey: notificationKeys.list(organizationId, userId, unreadOnly),
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        userId,
        unreadOnly: unreadOnly?.toString() || 'false'
      });
      const res = await fetch(`/api/automations/notifications-list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const notifications = (await res.json()) as NotificationApi[];
      return notifications.map(
        (notification): Notification => ({
          ...notification,
          createdAt: deserializeDate(notification.createdAt, 'notification.createdAt')
        })
      );
    },
    staleTime: 1000 * 30, // 30 seconds - notifications should refresh frequently
    gcTime: 1000 * 60 // 1 minute
  });
}

export function getUnreadNotificationCountQueryOptions(organizationId: string, userId: string) {
  return queryOptions({
    queryKey: notificationKeys.unreadCount(organizationId, userId),
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        userId,
        unreadOnly: 'true'
      });
      const res = await fetch(`/api/automations/notifications-list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch unread count');
      const notifications = (await res.json()) as Notification[];
      return notifications.length;
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 // 1 minute
  });
}

/* ---------- Attention Item Query Options ---------- */
export function getAttentionItemsQueryOptions(status?: string) {
  return queryOptions({
    queryKey: attentionKeys.list(status),
    queryFn: async () => {
      const params = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`/api/automations/attention-list${params}`, {
        credentials: 'same-origin'
      });
      if (!res.ok) throw new Error('Failed to fetch attention items');
      const items = (await res.json()) as AttentionItemApi[];
      return items.map(
        (item): AttentionItem => ({
          ...item,
          createdAt: deserializeDate(item.createdAt, 'attention.createdAt'),
          updatedAt: deserializeDate(item.updatedAt, 'attention.updatedAt')
        })
      );
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function getAttentionItemsForEntityQueryOptions(refEntityType: string, refEntityId: string) {
  return queryOptions({
    queryKey: [...attentionKeys.detail(refEntityId), refEntityType],
    queryFn: async () => {
      const params = new URLSearchParams({ refEntityType, refEntityId });
      const res = await fetch(`/api/automations/attention-list?${params}`, {
        credentials: 'same-origin'
      });
      if (!res.ok) throw new Error('Failed to fetch attention items for entity');
      const items = (await res.json()) as AttentionItemApi[];
      return items.map(
        (item): AttentionItem => ({
          ...item,
          createdAt: deserializeDate(item.createdAt, 'attention.createdAt'),
          updatedAt: deserializeDate(item.updatedAt, 'attention.updatedAt')
        })
      );
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5 // 5 minutes
  });
}
