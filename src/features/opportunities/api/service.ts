import type { Opportunity, OpportunityInput } from './types';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  if (!response.ok) throw new Error('Opportunity request failed');
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getOpportunities(): Promise<Opportunity[]> {
  return request<Opportunity[]>('/api/opportunities');
}

export function createOpportunity(input: OpportunityInput): Promise<Opportunity> {
  return request<Opportunity>('/api/opportunities', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updateOpportunity(id: string, stage: string): Promise<Opportunity> {
  return request<Opportunity>(`/api/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage })
  });
}

export function deleteOpportunity(id: string): Promise<void> {
  return request<void>(`/api/opportunities/${id}`, { method: 'DELETE' });
}
