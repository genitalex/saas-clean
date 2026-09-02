'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Note = {
  id: string;
  title: string;
  content: string;
  tag: string;
  pinned: boolean;
  updatedAt: number;
};

const STORAGE_KEY = 'saas-clean-notes';

export default function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(JSON.parse(saved) as Note[]);
    } catch {
      /* Local notes are best-effort. */
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const createNote = () => {
    if (!title.trim() && !content.trim()) return;
    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        title: title.trim() || 'Sin título',
        content: content.trim(),
        tag: tag.trim(),
        pinned: false,
        updatedAt: Date.now()
      },
      ...current
    ]);
    setTitle('');
    setContent('');
    setTag('');
    setEditorOpen(false);
  };

  const togglePin = (id: string) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned, updatedAt: Date.now() } : note
      )
    );
  };

  const removeNote = (id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  };

  const visible = notes
    .filter((note) =>
      `${note.title} ${note.content} ${note.tag}`.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

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
            onClick={() => setEditorOpen(true)}
            className='flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm'
          >
            <Icons.add className='size-4' /> Nueva nota
          </button>
        </div>
      </header>

      {editorOpen && (
        <section className='rounded-[24px] border border-border/55 bg-card/65 p-4 shadow-[0_18px_55px_-38px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-5'>
          <div className='grid gap-3'>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Título'
              className='bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground'
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder='Escribe lo que tengas en la cabeza…'
              rows={6}
              className='resize-none rounded-2xl border border-border/45 bg-background/40 p-3 text-sm outline-none focus:border-primary/35'
            />
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <input
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                placeholder='Etiqueta opcional'
                className='rounded-xl border border-border/45 bg-background/40 px-3 py-2 text-sm outline-none'
              />
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setEditorOpen(false)}
                  className='rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60'
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  onClick={createNote}
                  className='rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground'
                >
                  Guardar nota
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
            {query ? 'No hay notas que coincidan.' : 'Todavía no hay notas.'}
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
                  onClick={() => togglePin(note.id)}
                  aria-label={note.pinned ? 'Desfijar nota' : 'Fijar nota'}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors hover:bg-muted/60',
                    note.pinned ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icons.star className='size-4' />
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
