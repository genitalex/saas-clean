import type { InferSelectModel } from 'drizzle-orm';
import type { automations, notifications, attentionItems } from '@/lib/db/schema';

/* Automations */
export type Automation = InferSelectModel<typeof automations>;

export type AutomationTrigger = Automation['trigger'];
export type AutomationAction = Automation['action'];

export type AutomationPayload = {
  trigger: AutomationTrigger;
  action: AutomationAction;
  config?: Record<string, unknown>;
  enabled?: boolean;
};

export type AutomationFilters = {
  enabled?: boolean;
  trigger?: AutomationTrigger;
  action?: AutomationAction;
};

/* Notifications */
export type Notification = InferSelectModel<typeof notifications>;

export type NotificationType = Notification['type'];

export type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  refEntityType?: string | null;
  refEntityId?: string | null;
};

/* Attention Items */
export type AttentionItem = InferSelectModel<typeof attentionItems>;

export type AttentionItemType = AttentionItem['type'];

export type AttentionItemPayload = {
  type: AttentionItemType;
  title: string;
  message: string;
  refEntityType: string;
  refEntityId: string;
  customerId?: string | null;
};

/* Automation Context for Execution */
export type AutomationTriggerContext = {
  trigger: AutomationTrigger;
  organizationId: string;
  userId: string;
  data: Record<string, unknown>;
};

export type AutomationExecutionResult = {
  executed: boolean;
  error?: string;
  notificationId?: string;
  attentionItemId?: string;
};
