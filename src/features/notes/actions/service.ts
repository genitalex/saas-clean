import 'server-only';

import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { getAuthContext } from '@/lib/db/organization-context';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { notePayloadSchema, noteUpdateSchema } from '../schemas/note';

export class NoteServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID_ID' | 'INVALID_PAYLOAD'
  ) {
    super(message);
    this.name = 'NoteServiceError';
  }
}

const noteSelection = {
  id: notes.id,
  organizationId: notes.organizationId,
  userId: notes.userId,
  title: notes.title,
  content: notes.content,
  tag: notes.tag,
  pinned: notes.pinned,
  createdAt: notes.createdAt,
  updatedAt: notes.updatedAt
} as const;

function assertId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new NoteServiceError('Invalid note id', 'INVALID_ID');
}

export async function getNotes(search?: string) {
  const { organization, user } = await getAuthContext();
  const query = search?.trim();
  return db
    .select(noteSelection)
    .from(notes)
    .where(
      and(
        eq(notes.organizationId, organization.id),
        eq(notes.userId, user.id),
        query ? or(ilike(notes.title, `%${query}%`), ilike(notes.content, `%${query}%`)) : undefined
      )
    )
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
}

export async function getNote(id: string) {
  assertId(id);
  const { organization, user } = await getAuthContext();
  const [note] = await db
    .select(noteSelection)
    .from(notes)
    .where(
      and(eq(notes.id, id), eq(notes.organizationId, organization.id), eq(notes.userId, user.id))
    )
    .limit(1);
  if (!note) throw new NoteServiceError('Note not found', 'NOT_FOUND');
  return note;
}

export async function createNote(input: unknown) {
  const { organization, user } = await getAuthContext();
  const parsed = notePayloadSchema.safeParse(input);
  if (!parsed.success) throw new NoteServiceError('Invalid note payload', 'INVALID_PAYLOAD');
  const now = new Date();
  const [created] = await db
    .insert(notes)
    .values({
      organizationId: organization.id,
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      tag: parsed.data.tag || null,
      pinned: parsed.data.pinned,
      createdAt: now,
      updatedAt: now
    })
    .returning({ id: notes.id });
  return getNote(created.id);
}

export async function updateNote(id: string, input: unknown) {
  assertId(id);
  const { organization, user } = await getAuthContext();
  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) throw new NoteServiceError('Invalid note payload', 'INVALID_PAYLOAD');
  const [updated] = await db
    .update(notes)
    .set({
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.content !== undefined && { content: parsed.data.content }),
      ...(parsed.data.tag !== undefined && { tag: parsed.data.tag || null }),
      ...(parsed.data.pinned !== undefined && { pinned: parsed.data.pinned }),
      updatedAt: new Date()
    })
    .where(
      and(eq(notes.id, id), eq(notes.organizationId, organization.id), eq(notes.userId, user.id))
    )
    .returning({ id: notes.id });
  if (!updated) throw new NoteServiceError('Note not found', 'NOT_FOUND');
  return getNote(updated.id);
}

export async function deleteNote(id: string) {
  assertId(id);
  const { organization, user } = await getAuthContext();
  const [deleted] = await db
    .delete(notes)
    .where(
      and(eq(notes.id, id), eq(notes.organizationId, organization.id), eq(notes.userId, user.id))
    )
    .returning({ id: notes.id });
  if (!deleted) throw new NoteServiceError('Note not found', 'NOT_FOUND');
  return deleted;
}
