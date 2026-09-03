/**
 * Client-side API wrappers
 * These functions call the API routes to perform mutations
 */

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const response = await fetch('/api/automations/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark-as-read', notificationId })
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

export async function createAutomation(payload: import('../types').AutomationPayload) {
  const response = await fetch('/api/automations/get', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to create automation');
  return response.json();
}

export async function markAllNotificationsAsRead(
  organizationId: string,
  userId: string
): Promise<void> {
  const response = await fetch('/api/automations/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark-all-read', organizationId, userId })
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function toggleAutomation(automationId: string, enabled: boolean): Promise<void> {
  const response = await fetch('/api/automations/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle', automationId, enabled })
  });

  if (!response.ok) {
    throw new Error('Failed to toggle automation');
  }
}

export async function updateAutomation(
  automationId: string,
  payload: Partial<import('../types').AutomationPayload>
) {
  const response = await fetch('/api/automations/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', automationId, payload })
  });
  if (!response.ok) throw new Error('Failed to update automation');
  return response.json();
}

export async function deleteAutomation(automationId: string): Promise<void> {
  const response = await fetch('/api/automations/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', automationId })
  });

  if (!response.ok) {
    throw new Error('Failed to delete automation');
  }
}

export async function acknowledgeAttentionItem(attentionItemId: string): Promise<void> {
  const response = await fetch('/api/automations/attention', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'acknowledge', attentionItemId })
  });

  if (!response.ok) {
    throw new Error('Failed to acknowledge attention item');
  }
}

export async function resolveAttentionItem(attentionItemId: string): Promise<void> {
  const response = await fetch('/api/automations/attention', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resolve', attentionItemId })
  });

  if (!response.ok) {
    throw new Error('Failed to resolve attention item');
  }
}
