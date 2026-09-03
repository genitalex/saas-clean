import { z } from 'zod';

export const automationSchema = z.object({
  trigger: z.enum([
    'task_completed',
    'event_completed',
    'waiting_due',
    'task_overdue',
    'customer_inactive'
  ] as const),
  action: z.enum([
    'create_follow_up',
    'create_task',
    'create_attention',
    'mark_attention'
  ] as const),
  config: z.record(z.string(), z.any()).optional(),
  enabled: z.boolean().optional()
});

export type AutomationFormData = z.infer<typeof automationSchema>;
