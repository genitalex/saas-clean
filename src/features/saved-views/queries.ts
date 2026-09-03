import type { CreateSavedViewInput, SavedView, UpdateSavedViewInput } from './types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Saved view request failed');
  return body as T;
}

export async function getSavedViews(entity: 'tasks' = 'tasks') {
  return request<SavedView[]>(`/api/saved-views?entity=${entity}`);
}

export async function createSavedView(input: CreateSavedViewInput) {
  return request<SavedView>('/api/saved-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function updateSavedView(id: string, input: UpdateSavedViewInput) {
  return request<SavedView>(`/api/saved-views/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
}

export async function deleteSavedView(id: string) {
  return request<{ id: string }>(`/api/saved-views/${id}`, { method: 'DELETE' });
}
