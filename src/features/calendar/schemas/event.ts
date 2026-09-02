import { z } from 'zod';

const dateTimeSchema = z.coerce.date({ message: 'Fecha y hora no válidas' });

export const eventStatusSchema = z.enum(['planned', 'in_progress', 'done', 'cancelled']);

const eventFieldsSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(200),
  description: z.string().max(5000).nullable().optional(),
  startAt: dateTimeSchema,
  endAt: dateTimeSchema,
  allDay: z.boolean().default(false),
  location: z.string().max(500).nullable().optional(),
  url: z.string().url().or(z.literal('')).nullable().optional(),
  status: eventStatusSchema.optional(),
  color: z.string().max(32).nullable().optional(),
  reminderMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  repeatRule: z.string().max(200).nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional()
});

export const eventPayloadSchema = eventFieldsSchema.refine((value) => value.endAt > value.startAt, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endAt']
});

export const eventUpdateSchema = eventFieldsSchema.partial();
export const eventFiltersSchema = z.object({
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
  customerId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().optional()
});
