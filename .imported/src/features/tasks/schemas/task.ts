import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'waiting', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const taskPayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  priority: taskPrioritySchema.optional().default('medium'),
  dueAt: z.string().datetime({ local: true }).nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional()
});

export const taskUpdateSchema = taskPayloadSchema.partial().extend({
  status: taskStatusSchema.optional()
});

export type TaskPayloadInput = z.input<typeof taskPayloadSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;
