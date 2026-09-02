import { z } from 'zod';

export const notePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(10000).default(''),
  tag: z.string().trim().max(50).nullable().optional(),
  pinned: z.boolean().optional().default(false)
});

export const noteUpdateSchema = notePayloadSchema.partial();

export type NotePayload = z.input<typeof notePayloadSchema>;
export type NoteUpdatePayload = z.input<typeof noteUpdateSchema>;
