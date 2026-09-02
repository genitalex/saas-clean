'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Note = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  content: string;
  tag: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No se pudo guardar la nota');
  return data as T;
}

export default function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    request<Note[]>('/api/notes')
      .then(setNotes)
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const resetEditor = () => {
    setTitle('');
    setContent('');
    setTag('');
    setEditingId(null);
    setEditorOpen(false);
  };

  const saveNote = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const note = await request<Note>(editingId ? `/api/notes/${editingId}` : '/api/notes', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tag: tag || null })
      });
      setNotes((current) =>
        editingId ? current.map((item) => (item.id === note.id ? note : item)) : [note, ...current]
      );
      resetEditor();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  const editNote = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTag(note.tag || '');
    setEditorOpen(true);
  };

  const togglePin = async (note: Note) => {
    try {
      const updated = await request<Note>(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned })
      });
      setNotes((current) => current.map((item) => (item.id === note.id ? updated : item)));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'No se pudo actualizar la nota'
      );
    }
  };

  const removeNote = async (id: string) => {
    try {
      await request(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'No se pudo eliminar la nota'
      );
    }
  };

  const visible = notes
    .filter((note) =>
      `${note.title} ${note.content} ${note.tag}`.toLowerCase().includes(query.toLowerCase())
    )
    .toSorted(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  return (
    <main className='mx-auto flex w-full max-w-[1080px] min-w-0 flex-1 flex-col gap-5 pb-10'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.22em]'>
            Workspace
          </p>
          <h1 className='mt-1 text-3xl font-semibold tracking-tight'>Notas</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Ideas, apuntes y cosas que no quieres perder.
          </p>
        </div>
        <div className='flex gap-2'>
          <div className='flex items-center gap-2 rounded-xl border border-border/55 bg-background/60 px-3 py-2'>
            <Icons.search className='text-muted-foreground size-4' />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Buscar notas'
              className='w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground'
              aria-label='Buscar notas'
            />
          </div>
          <button
            type='button'
            onClick={() => {
              resetEditor();
              setEditorOpen(true);
            }}
            className='flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm'
          >
            <Icons.add className='size-4' /> Nueva nota
          </button>
        </div>
      </header>

      {error && (
        <p className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      )}

      {editorOpen && (
        <section className='rounded-[24px] border border-border/55 bg-card/65 p-4 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5'>
          <div className='grid gap-3'>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Título'
              aria-label='Título de la nota'
              className='bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground'
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder='Escribe lo que tengas en la cabeza…'
              aria-label='Contenido de la nota'
              rows={6}
              className='resize-none rounded-2xl border border-border/45 bg-background/40 p-3 text-sm outline-none focus:border-primary/35'
            />
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <input
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                placeholder='Etiqueta opcional'
                aria-label='Etiqueta opcional'
                className='rounded-xl border border-border/45 bg-background/40 px-3 py-2 text-sm outline-none'
              />
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={resetEditor}
                  className='rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60'
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  onClick={saveNote}
                  disabled={saving || !title.trim()}
                  aria-busy={saving}
                  className='rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground'
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar nota'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {visible.length === 0 ? (
        <section className='rounded-[26px] border border-dashed border-border/60 bg-background/35 px-6 py-14 text-center'>
          <span className='bg-primary/[0.08] text-primary mx-auto flex size-11 items-center justify-center rounded-2xl'>
            <Icons.post className='size-5' />
          </span>
          <p className='mt-3 text-sm font-semibold'>
            {loading
              ? 'Cargando notas...'
              : query
                ? 'No hay notas que coincidan.'
                : 'Todavía no hay notas.'}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Deja aquí ideas, apuntes o contexto para retomarlo después.
          </p>
        </section>
      ) : (
        <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {visible.map((note) => (
            <article
              key={note.id}
              className='group rounded-[24px] border border-border/55 bg-card/60 p-4 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.42)] backdrop-blur-xl'
            >
              <div className='flex items-start gap-2'>
                <div className='min-w-0 flex-1'>
                  <h2 className='truncate text-sm font-semibold'>{note.title}</h2>
                  <p className='text-muted-foreground mt-2 whitespace-pre-wrap text-sm'>
                    {note.content}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => togglePin(note)}
                  aria-label={note.pinned ? 'Desfijar nota' : 'Fijar nota'}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors hover:bg-muted/60',
                    note.pinned ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icons.pin className='size-4' />
                </button>
              </div>
              <div className='mt-4 flex items-center justify-between gap-2'>
                {note.tag ? (
                  <span className='rounded-full border border-border/50 bg-background/45 px-2 py-1 text-[10px] font-semibold'>
                    {note.tag}
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type='button'
                  onClick={() => editNote(note)}
                  className='rounded-lg p-1.5 text-muted-foreground opacity-70 transition hover:bg-muted/60 hover:text-foreground'
                  aria-label='Editar nota'
                >
                  <Icons.edit className='size-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => removeNote(note.id)}
                  className='rounded-lg p-1.5 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive'
                  aria-label='Eliminar nota'
                >
                  <Icons.trash className='size-3.5' />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
