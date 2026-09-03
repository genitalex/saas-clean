import { queryOptions } from '@tanstack/react-query';
import type { Automation, AutomationFilters, Notification, AttentionItem } from '../types';
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
  list: (orgId: string, userId: string, status?: string) =>
    [...attentionKeys.lists(), { orgId, userId, status }] as const,
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
      return res.json() as Promise<Notification[]>;
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
export function getAttentionItemsQueryOptions(
  organizationId: string,
  userId: string,
  status?: string
) {
  return queryOptions({
    queryKey: attentionKeys.list(organizationId, userId, status),
    queryFn: async () => {
      const params = new URLSearchParams({ organizationId, userId });
      const res = await fetch(`/api/automations/attention-list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch attention items');
      return res.json() as Promise<AttentionItem[]>;
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
      const res = await fetch(`/api/automations/attention-list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch attention items for entity');
      return res.json() as Promise<AttentionItem[]>;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5 // 5 minutes
  });
}
