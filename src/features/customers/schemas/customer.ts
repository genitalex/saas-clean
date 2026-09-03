import { z } from 'zod';

export const customerSchema = z.object({
  kind: z.enum(['person', 'company']),
  name: z.string().trim().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(80).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  nextAction: z.string().max(500).optional(),
  nextActionAt: z.string().date().optional().or(z.literal(''))
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
