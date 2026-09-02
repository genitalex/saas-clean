import { z } from 'zod';

export const activityTypeSchema = z.enum(['note', 'call', 'email', 'status_change', 'system']);

export const activityPayloadSchema = z.object({
  type: activityTypeSchema,
  title: z.string().trim().min(1).max(200),
  content: z.string().max(10000).nullable().optional(),
  eventId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional()
});
