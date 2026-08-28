import type { Activity, ActivityPayload } from '../types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Activity request failed');
  return data as T;
}

export const activityKeys = {
  all: ['activities'] as const,
  customer: (customerId: string) => [...activityKeys.all, 'customer', customerId] as const,
  detail: (id: string) => [...activityKeys.all, 'detail', id] as const
};

export async function getCustomerActivities(customerId: string) {
  return request<Activity[]>(`/api/customers/${customerId}/activities`);
}

export async function createActivity(customerId: string, input: ActivityPayload) {
  return request<Activity>(`/api/customers/${customerId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}
