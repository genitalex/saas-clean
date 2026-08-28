'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getEvents, eventKeys } from '../queries';
import type { Event } from '../types';
import { EventDialog } from './event-dialog';

type CalendarView = 'month' | 'week' | 'day';
type Category = { id: string; name: string; color: string };
const defaultCategories: Category[] = [
  { id: 'work', name: 'Trabajo', color: '#2563eb' },
  { id: 'important', name: 'Importante', color: '#d97706' },
  { id: 'personal', name: 'Personal', color: '#0284c7' }
];
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function rangeForView(cursor: Date, view: CalendarView) {
  if (view === 'week')
    return {
      start: startOfWeek(cursor, { weekStartsOn: 1 }),
      end: endOfWeek(cursor, { weekStartsOn: 1 })
    };
  if (view === 'day') return { start: startOfDay(cursor), end: addDays(startOfDay(cursor), 1) };
  return {
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
  };
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [initialDate, setInitialDate] = useState<Date>();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [filters, setFilters] = useState<string[]>(
    defaultCategories.map((category) => category.id)
  );
  const range = useMemo(() => rangeForView(cursor, view), [cursor, view]);
  const {
    data: events = [],
    isError,
    isLoading
  } = useQuery({
    queryKey: eventKeys.list({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString()
    }),
    queryFn: () =>
      getEvents({ startDate: range.start.toISOString(), endDate: range.end.toISOString() })
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('calendar-categories');
      if (saved) setCategories(JSON.parse(saved));
    } catch {
      /* preferences are optional */
    }
  }, []);
  useEffect(() => {
    window.localStorage.setItem('calendar-categories', JSON.stringify(categories));
    setFilters((current) =>
      current
        .filter((id) => categories.some((category) => category.id === id))
        .concat(
          categories
            .filter((category) => !current.includes(category.id))
            .map((category) => category.id)
        )
    );
  }, [categories]);

  const title =
    view === 'month'
      ? format(cursor, 'LLLL yyyy', { locale: es })
      : view === 'week'
        ? `${format(range.start, 'd MMM', { locale: es })} – ${format(addDays(range.end, -1), 'd MMM yyyy', { locale: es })}`
        : format(cursor, "EEEE d 'de' MMMM", { locale: es });
  const shift = (direction: 1 | -1) =>
    setCursor((current) =>
      view === 'month'
        ? direction === 1
          ? addMonths(current, 1)
          : subMonths(current, 1)
        : direction === 1
          ? addWeeks(current, 1)
          : subWeeks(current, 1)
    );
  const openCreate = (date = cursor) => {
    setSelectedEvent(null);
    setInitialDate(date);
    setDialogOpen(true);
  };
  const openEvent = (event: Event) => {
    setSelectedEvent(event);
    setInitialDate(undefined);
    setDialogOpen(true);
  };
  const visibleEvents = events.filter((event) =>
    filters.includes(categoryFor(event, categories).id)
  );

  return (
    <main className='flex flex-col gap-5 pb-8'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-sm text-muted-foreground'>Planificación del equipo</p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight capitalize'>{title}</h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center gap-1 rounded-lg border bg-background p-1'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => shift(-1)}
              aria-label='Ir al periodo anterior'
            >
              <Icons.chevronLeft data-icon='inline-start' /> Anterior
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setCursor(new Date())}>
              Hoy
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => shift(1)}
              aria-label='Ir al periodo siguiente'
            >
              Siguiente <Icons.chevronRight data-icon='inline-end' />
            </Button>
          </div>
          <div
            className='flex rounded-lg border bg-muted/30 p-1'
            role='group'
            aria-label='Vista del calendario'
          >
            {(['month', 'week', 'day'] as CalendarView[]).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {option === 'month' ? 'Mes' : option === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <Button variant='outline' onClick={() => setSettingsOpen(true)}>
            Configuración
          </Button>
          <Button onClick={() => openCreate()}>
            <Icons.add data-icon='inline-start' /> Nuevo evento
          </Button>
        </div>
      </header>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3'>
        <div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground'>Categorías</span>
          {categories.map((category) => (
            <label key={category.id} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={filters.includes(category.id)}
                onChange={() =>
                  setFilters((current) =>
                    current.includes(category.id)
                      ? current.filter((id) => id !== category.id)
                      : [...current, category.id]
                  )
                }
              />
              <i className='size-2 rounded-full' style={{ backgroundColor: category.color }} />
              {category.name}
            </label>
          ))}
        </div>
        <span className='text-xs text-muted-foreground'>
          {visibleEvents.length} evento{visibleEvents.length === 1 ? '' : 's'} en este periodo
        </span>
      </div>
      {isError && (
        <div className='rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          No se pudieron cargar los eventos. Intenta actualizar la vista.
        </div>
      )}
      <Card className='min-w-0 overflow-hidden shadow-sm'>
        {isLoading ? (
          <CalendarSkeleton />
        ) : view === 'month' ? (
          <MonthView
            cursor={cursor}
            events={visibleEvents}
            categories={categories}
            onCreate={openCreate}
            onOpenEvent={openEvent}
          />
        ) : (
          <TimelineView
            cursor={cursor}
            view={view}
            events={visibleEvents}
            categories={categories}
            onCreate={openCreate}
            onOpenEvent={openEvent}
          />
        )}
      </Card>
      <EventDialog
        open={dialogOpen}
        event={selectedEvent}
        initialDate={initialDate}
        onOpenChange={setDialogOpen}
        categories={categories}
        onCategoriesChange={setCategories}
      />
      <CategoryDialog
        open={settingsOpen}
        categories={categories}
        onOpenChange={setSettingsOpen}
        onChange={setCategories}
      />
    </main>
  );
}

type ViewProps = {
  cursor: Date;
  events: Event[];
  categories: Category[];
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
};
function categoryFor(event: Event, categories: Category[]) {
  const index = Math.abs(event.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return categories[index % categories.length] ?? defaultCategories[0];
}
function MonthView({ cursor, events, categories, onOpenEvent, onCreate }: ViewProps) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[680px]'>
        <div className='grid grid-cols-7 border-b bg-muted/20'>
          {weekDays.map((day) => (
            <div
              key={day}
              className='px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
            >
              {day}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {days.map((day) => {
            const out = !isSameMonth(day, cursor);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            const today = isSameDay(day, new Date());
            const selected = isSameDay(day, cursor);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-28 border-b border-r p-2.5 transition-colors hover:bg-muted/20 ${weekend ? 'bg-muted/30' : ''} ${out ? 'bg-muted/10 text-muted-foreground/60' : ''} ${selected ? 'ring-1 ring-inset ring-primary/30' : ''}`}
              >
                <button
                  aria-label={`Crear evento el ${format(day, 'EEEE d MMMM yyyy', { locale: es })}`}
                  onClick={() => onCreate(day)}
                  className={`mb-2 flex size-7 items-center justify-center rounded-full text-xs font-medium ${today ? 'bg-primary text-primary-foreground ring-2 ring-primary/20' : selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  {format(day, 'd')}
                </button>
                <div className='flex flex-col gap-1'>
                  {eventsForDay(events, day)
                    .slice(0, 3)
                    .map((event) => {
                      const category = categoryFor(event, categories);
                      return (
                        <button
                          key={event.id}
                          onClick={() => onOpenEvent(event)}
                          className='flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] hover:brightness-95'
                          style={{ backgroundColor: `${category.color}18`, color: category.color }}
                        >
                          <i
                            className='size-1.5 shrink-0 rounded-full'
                            style={{ backgroundColor: category.color }}
                          />
                          <span className='truncate font-medium'>{event.title}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function TimelineView({
  cursor,
  view,
  events,
  categories,
  onOpenEvent,
  onCreate
}: ViewProps & { view: 'week' | 'day' }) {
  const start = view === 'week' ? startOfWeek(cursor, { weekStartsOn: 1 }) : cursor;
  const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(start, i)) : [start];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[720px]'>
        <div
          className='grid'
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          <div className='border-b bg-muted/20 p-3' />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={`border-b border-l bg-muted/20 px-3 py-3 ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/40' : ''} ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}
            >
              <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                {format(day, 'EEE', { locale: es })}
              </p>
              <p className='mt-1 text-lg font-semibold'>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
        <div
          className='grid'
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          {hours.map((hour) => (
            <div key={hour} className='contents'>
              <div className='h-20 border-b px-3 py-2 text-right text-[10px] tabular-nums text-muted-foreground'>
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((day) => (
                <button
                  key={`${day}-${hour}`}
                  onClick={() =>
                    onCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))
                  }
                  className='relative h-20 border-b border-l p-1.5 text-left hover:bg-primary/5'
                >
                  {eventsForDay(events, day)
                    .filter((event) => new Date(event.startAt).getHours() === hour)
                    .map((event) => {
                      const category = categoryFor(event, categories);
                      return (
                        <span
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEvent(event);
                          }}
                          className='block truncate rounded-md px-2 py-1 text-[11px] font-medium'
                          style={{ backgroundColor: `${category.color}18`, color: category.color }}
                        >
                          {event.title}
                        </span>
                      );
                    })}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function CategoryDialog({
  open,
  categories,
  onOpenChange,
  onChange
}: {
  open: boolean;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onChange: (categories: Category[]) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');
  const [editing, setEditing] = useState<string | null>(null);
  const save = () => {
    if (!name.trim()) return;
    onChange(
      editing
        ? categories.map((category) =>
            category.id === editing ? { ...category, name: name.trim(), color } : category
          )
        : [...categories, { id: crypto.randomUUID(), name: name.trim(), color }]
    );
    setName('');
    setColor('#7c3aed');
    setEditing(null);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración del calendario</DialogTitle>
          <DialogDescription>Personaliza tus categorías de eventos sin límites.</DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          <p className='text-sm font-semibold'>Categorías de eventos</p>
          {categories.map((category) => (
            <div key={category.id} className='flex items-center gap-3 rounded-lg border p-3'>
              <i className='size-3 rounded-full' style={{ backgroundColor: category.color }} />
              <span className='flex-1 text-sm'>{category.name}</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setEditing(category.id);
                  setName(category.name);
                  setColor(category.color);
                }}
              >
                Editar
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onChange(categories.filter((item) => item.id !== category.id))}
              >
                Eliminar
              </Button>
            </div>
          ))}
          <div className='grid gap-2 sm:grid-cols-[1fr_auto_auto]'>
            <Input
              placeholder='Nombre de categoría'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label className='flex items-center gap-2 rounded-md border px-2 text-xs'>
              Color{' '}
              <input
                aria-label='Elegir color'
                type='color'
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
            <Button onClick={save}>{editing ? 'Guardar' : 'Añadir'}</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function CalendarSkeleton() {
  return (
    <div className='grid grid-cols-7 gap-px bg-border p-px'>
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className='h-32 animate-pulse bg-card p-3'>
          <div className='h-3 w-5 rounded bg-muted' />
          <div className='mt-8 h-5 rounded bg-muted/60' />
        </div>
      ))}
    </div>
  );
}
function eventsForDay(events: Event[], day: Date) {
  const start = startOfDay(day).getTime();
  const end = addDays(startOfDay(day), 1).getTime();
  return events.filter(
    (event) => new Date(event.startAt).getTime() < end && new Date(event.endAt).getTime() > start
  );
}
