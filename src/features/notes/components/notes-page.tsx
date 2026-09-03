'use client';

import * as React from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
};

const NOTES_KEY = 'saas-clean-notes-v1';
const COLORS_KEY = 'saas-clean-note-colors-v1';

const DEFAULT_COLORS = [
  { id: 'yellow', name: 'Amarillo', color: '#fff1a8' },
  { id: 'peach', name: 'Melocotón', color: '#ffd8c2' },
  { id: 'mint', name: 'Menta', color: '#cfefd9' },
  { id: 'blue', name: 'Azul', color: '#d9ebff' },
  { id: 'lilac', name: 'Lila', color: '#e7ddff' }
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function freshNote(color: string): Note {
  return {
    id: crypto.randomUUID(),
    title: 'Nueva nota',
    content: '',
    color,
    updatedAt: new Date().toISOString()
  };
}

export function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [colors, setColors] = React.useState(DEFAULT_COLORS);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  React.useEffect(() => {
    setNotes(read(NOTES_KEY, []));
    setColors(read(COLORS_KEY, DEFAULT_COLORS));
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (ready) localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes, ready]);

  React.useEffect(() => {
    if (ready) localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
  }, [colors, ready]);

  const addNote = () => {
    const note = freshNote(colors[0]?.color ?? DEFAULT_COLORS[0].color);
    setNotes((items) => [note, ...items]);
    setEditingId(note.id);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((items) =>
      items.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note
      )
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setNotes((items) => {
      const from = items.findIndex((item) => item.id === active.id);
      const to = items.findIndex((item) => item.id === over.id);
      return from === -1 || to === -1 ? items : arrayMove(items, from, to);
    });
  };

  return (
    <main className='mx-auto flex w-full max-w-[1100px] min-w-0 flex-1 flex-col gap-6 pb-10'>
      <header className='flex items-end justify-between gap-4'>
        <div>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
            Workspace
          </p>
          <h1 className='mt-1 text-3xl font-semibold tracking-tight'>Notas</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Apuntes rápidos que puedes ordenar, colorear y organizar a tu manera.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setSettingsOpen(true)}
            className='border-border/55 bg-card/60 text-muted-foreground flex size-10 items-center justify-center rounded-2xl border backdrop-blur-xl hover:bg-card hover:text-foreground'
            aria-label='Configurar colores'
          >
            <Icons.palette className='size-4.5' />
          </button>
          <button
            type='button'
            onClick={addNote}
            className='bg-primary text-primary-foreground flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90'
          >
            <Icons.add className='size-4' /> Nueva nota
          </button>
        </div>
      </header>

      {notes.length === 0 ? (
        <button
          type='button'
          onClick={addNote}
          className='border-border/55 bg-card/45 text-muted-foreground min-h-[260px] rounded-[28px] border border-dashed p-8 text-center'
        >
          <span className='mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/70 text-foreground'>
            <Icons.post className='size-5' />
          </span>
          <span className='mt-4 block text-base font-semibold text-foreground'>
            Crea tu primera nota
          </span>
          <span className='mt-1 block text-sm'>
            Ideas, apuntes, recordatorios o cualquier cosa que no quieras perder.
          </span>
        </button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={notes.map((note) => note.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {notes.map((note, index) => (
                <SortableNote
                  key={note.id}
                  note={note}
                  index={index}
                  colors={colors}
                  editing={editingId === note.id}
                  onEdit={() => setEditingId(note.id)}
                  onDone={() => setEditingId(null)}
                  onChange={(patch) => updateNote(note.id, patch)}
                  onDelete={() => {
                    setNotes((items) => items.filter((item) => item.id !== note.id));
                    setEditingId(null);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {settingsOpen && (
        <NoteColorSettings
          colors={colors}
          onChange={setColors}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}

function SortableNote({
  note,
  index,
  colors,
  editing,
  onEdit,
  onDone,
  onChange,
  onDelete
}: {
  note: Note;
  index: number;
  colors: { id: string; name: string; color: string }[];
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id
  });
  const selected = colors.find((item) => item.color === note.color)?.id;

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: note.color
      }}
      className={cn(
        'relative min-h-[220px] overflow-hidden group rounded-[6px] border border-black/8 p-5',
        'before:absolute before:left-1/2 before:top-[-9px] before:size-[18px] before:-translate-x-1/2 before:rotate-45 before:bg-black/8',
        isDragging && 'z-20 scale-[1.02] rotate-1 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.4)]'
      )}
    >
      <div className='flex items-start gap-2'>
        <button
          type='button'
          {...listeners}
          className='text-black/35 mt-0.5 flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg hover:bg-black/5 active:cursor-grabbing'
          aria-label={`Mover nota ${index + 1}`}
        >
          <Icons.gripVertical className='size-4' />
        </button>

        {editing ? (
          <input
            autoFocus
            value={note.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className='min-w-0 flex-1 bg-transparent text-base font-semibold text-black outline-none'
            placeholder='Título'
          />
        ) : (
          <button
            type='button'
            onClick={onEdit}
            className='min-w-0 flex-1 truncate text-left text-base font-semibold text-black'
          >
            {note.title || 'Sin título'}
          </button>
        )}

        <button
          type='button'
          onClick={onDelete}
          className='text-black/35 flex size-7 shrink-0 items-center justify-center rounded-lg opacity-0 hover:bg-black/8 hover:text-red-700 group-hover:opacity-100'
          aria-label='Eliminar nota'
        >
          <Icons.trash className='size-4' />
        </button>
      </div>

      {editing ? (
        <>
          <textarea
            rows={7}
            value={note.content}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder='Escribe aquí…'
            className='mt-4 min-h-[145px] w-full resize-none bg-transparent text-sm leading-6 text-black outline-none placeholder:text-black/45'
          />
          <div className='mt-3 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-1.5'>
              {colors.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => onChange({ color: item.color })}
                  className={cn(
                    'size-6 rounded-full border border-black/10 shadow-sm hover:scale-110',
                    selected === item.id && 'ring-2 ring-black/35 ring-offset-1'
                  )}
                  style={{ backgroundColor: item.color }}
                  aria-label={`Color ${item.name}`}
                />
              ))}
            </div>
            <button
              type='button'
              onClick={onDone}
              className='rounded-xl bg-black/10 px-3 py-1.5 text-xs font-semibold text-black hover:bg-black/15'
            >
              Listo
            </button>
          </div>
        </>
      ) : (
        <button type='button' onClick={onEdit} className='mt-4 min-h-[135px] w-full text-left'>
          <span className='whitespace-pre-wrap text-sm leading-6 text-black/75'>
            {note.content || 'Escribe algo…'}
          </span>
        </button>
      )}
    </article>
  );
}

function NoteColorSettings({
  colors,
  onChange,
  onClose
}: {
  colors: { id: string; name: string; color: string }[];
  onChange: (colors: { id: string; name: string; color: string }[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#fff1a8');

  const add = () => {
    if (!name.trim() || colors.length >= 15) return;
    onChange([...colors, { id: crypto.randomUUID(), name: name.trim(), color }]);
    setName('');
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/12 p-4 supports-backdrop-filter:backdrop-blur-[2px]'
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
    >
      <section className='w-full max-w-lg rounded-2xl border border-border/70 bg-background p-5 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.3)]'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold'>Colores de notas</h2>
            <p className='text-muted-foreground mt-1 text-xs'>Edita la paleta como en Calendar.</p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='bg-muted/70 flex size-9 items-center justify-center rounded-full'
          >
            <Icons.close className='size-4' />
          </button>
        </div>
        <div className='mt-5 space-y-2'>
          {colors.map((item) => (
            <div
              key={item.id}
              className='flex items-center gap-3 rounded-2xl border border-border/50 p-3'
            >
              <span
                className='size-8 rounded-lg border border-black/10'
                style={{ backgroundColor: item.color }}
              />
              <span className='flex-1 text-sm font-medium'>{item.name}</span>
              <input
                aria-label={`Editar ${item.name}`}
                type='color'
                value={item.color}
                onChange={(e) =>
                  onChange(
                    colors.map((c) => (c.id === item.id ? { ...c, color: e.target.value } : c))
                  )
                }
                className='size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0'
              />
            </div>
          ))}
        </div>
        <div className='mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]'>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Nombre del color'
            className='h-10 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none'
          />
          <input
            aria-label='Nuevo color'
            type='color'
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className='h-10 w-14 rounded-xl border border-border/60 bg-background p-1'
          />
          <button
            type='button'
            onClick={add}
            disabled={!name.trim() || colors.length >= 15}
            className='rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-40'
          >
            Añadir
          </button>
        </div>
      </section>
    </div>
  );
}
