import { z } from 'zod';

const dateTimeSchema = z.coerce.date({ message: 'Fecha y hora no válidas' });

export const eventPayloadSchema = z
  .object({
    title: z.string().trim().min(1, 'El título es obligatorio').max(200),
    description: z.string().max(5000).nullable().optional(),
    startAt: dateTimeSchema,
    endAt: dateTimeSchema,
    allDay: z.boolean().default(false),
    location: z.string().max(500).nullable().optional(),
    customerId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional()
  })
  .refine((value) => value.endAt > value.startAt, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['endAt']
  });

export const eventUpdateSchema = eventPayloadSchema.partial();
export const eventFiltersSchema = z.object({
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
  customerId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().optional()
});
