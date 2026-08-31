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
import { cn } from '@/lib/utils';
import { getEvents, eventKeys } from '../queries';
import type { Event } from '../types';
import { EventDialog } from './event-dialog';

type CalendarView = 'month' | 'week' | 'day';
type Category = { id: string; name: string; color: string };
const defaultCategories: Category[] = [
  { id: 'work', name: 'Trabajo', color: '#4f39c9' },
  { id: 'important', name: 'Importante', color: '#d97706' },
  { id: 'personal', name: 'Personal', color: '#0d9488' }
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
  // Mobile gets its own day-focused experience rather than a shrunk grid, so
  // it tracks a selected day independently of the desktop cursor/view.
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
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

  const mobileWeekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }),
    [selectedDate]
  );
  const mobileWeekEnd = useMemo(() => endOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const {
    data: mobileWeekEvents = [],
    isLoading: isMobileLoading,
    isError: isMobileError
  } = useQuery({
    queryKey: eventKeys.list({
      startDate: mobileWeekStart.toISOString(),
      endDate: mobileWeekEnd.toISOString()
    }),
    queryFn: () =>
      getEvents({
        startDate: mobileWeekStart.toISOString(),
        endDate: mobileWeekEnd.toISOString()
      })
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
  const visibleMobileEvents = mobileWeekEvents.filter((event) =>
    filters.includes(categoryFor(event, categories).id)
  );

  return (
    <main className='flex flex-col gap-5 pb-8'>
      <header className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='hidden md:block'>
          <p className='text-muted-foreground text-sm'>Planificación del equipo</p>
          <h1 className='mt-0.5 text-[1.75rem] leading-tight font-semibold tracking-tight capitalize'>
            {title}
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='bg-surface-subtle hidden items-center gap-0.5 rounded-xl border p-1 md:flex'>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => shift(-1)}
              aria-label='Ir al periodo anterior'
              className='rounded-lg'
            >
              <Icons.chevronLeft className='size-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setCursor(new Date())}
              className='rounded-lg px-3 text-sm font-medium'
            >
              Hoy
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => shift(1)}
              aria-label='Ir al periodo siguiente'
              className='rounded-lg'
            >
              <Icons.chevronRight className='size-4' />
            </Button>
          </div>
          <div
            className='bg-surface-subtle hidden rounded-xl border p-1 md:flex'
            role='group'
            aria-label='Vista del calendario'
          >
            {(['month', 'week', 'day'] as CalendarView[]).map((option) => (
              <button
                key={option}
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
                  view === option
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option === 'month' ? 'Mes' : option === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSettingsOpen(true)}
            aria-label='Configuración del calendario'
            className='text-muted-foreground'
          >
            <Icons.settings className='size-[18px]' />
          </Button>
          <Button onClick={() => openCreate(selectedDate)} className='gap-1.5'>
            <Icons.add className='size-4' />
            <span className='hidden sm:inline'>Nuevo evento</span>
          </Button>
        </div>
      </header>

      <div className='flex flex-wrap items-center gap-2'>
        {categories.map((category) => {
          const active = filters.includes(category.id);
          return (
            <button
              key={category.id}
              type='button'
              aria-pressed={active}
              onClick={() =>
                setFilters((current) =>
                  current.includes(category.id)
                    ? current.filter((id) => id !== category.id)
                    : [...current, category.id]
                )
              }
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'border-transparent text-foreground'
                  : 'text-muted-foreground/70 border-border/70 bg-transparent'
              )}
              style={active ? { backgroundColor: `${category.color}1c` } : undefined}
            >
              <i
                className='size-2 shrink-0 rounded-full transition-opacity'
                style={{ backgroundColor: category.color, opacity: active ? 1 : 0.45 }}
              />
              {category.name}
            </button>
          );
        })}
        <span className='text-muted-foreground ml-auto text-xs'>
          {visibleEvents.length} evento{visibleEvents.length === 1 ? '' : 's'} en este periodo
        </span>
      </div>

      {(isError || isMobileError) && (
        <div className='border-destructive/25 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm'>
          No se pudieron cargar los eventos. Intenta actualizar la vista.
        </div>
      )}

      {/* Mobile: a day-focused agenda, not the desktop grid squeezed down. */}
      <div className='md:hidden'>
        <MobileAgenda
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekStart={mobileWeekStart}
          events={visibleMobileEvents}
          categories={categories}
          isLoading={isMobileLoading}
          onOpenEvent={openEvent}
          onCreate={openCreate}
        />
      </div>

      {/* Desktop / tablet: month, week and day grid views. */}
      <Card className='hidden min-w-0 overflow-hidden py-0 shadow-sm md:block'>
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

/**
 * Mobile calendar experience: a large day header, a compact week strip for
 * quick navigation, and an agenda list for the selected day. Deliberately
 * not the desktop grid at a smaller size — see CLAUDE.md Calendar Mobile.
 */
function MobileAgenda({
  selectedDate,
  onSelectDate,
  weekStart,
  events,
  categories,
  isLoading,
  onOpenEvent,
  onCreate
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekStart: Date;
  events: Event[];
  categories: Category[];
  isLoading: boolean;
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayEvents = eventsForDay(events, selectedDate).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-2'>
        <div>
          <p className='text-muted-foreground text-sm capitalize'>
            {format(selectedDate, 'EEEE', { locale: es })}
          </p>
          <p className='flex items-baseline gap-2'>
            <span className='text-[2rem] leading-none font-semibold tracking-tight'>
              {format(selectedDate, 'd')}
            </span>
            <span className='text-muted-foreground text-base font-medium capitalize'>
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </span>
          </p>
        </div>
        <div className='bg-surface-subtle flex shrink-0 items-center gap-0.5 rounded-xl border p-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => onSelectDate(addDays(selectedDate, -1))}
            aria-label='Día anterior'
            className='rounded-lg'
          >
            <Icons.chevronLeft className='size-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onSelectDate(startOfDay(new Date()))}
            className='rounded-lg px-2.5 text-xs font-medium'
          >
            Hoy
          </Button>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => onSelectDate(addDays(selectedDate, 1))}
            aria-label='Día siguiente'
            className='rounded-lg'
          >
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
      </div>

      <div className='flex items-stretch justify-between gap-1'>
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const hasEvents = eventsForDay(events, day).length > 0;
          return (
            <button
              key={day.toISOString()}
              type='button'
              onClick={() => onSelectDate(day)}
              aria-pressed={isSelected}
              aria-label={format(day, 'EEEE d MMMM', { locale: es })}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2 transition-colors',
                isSelected ? 'bg-primary' : 'hover:bg-accent/40'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide uppercase',
                  isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground/70'
                )}
              >
                {format(day, 'EEEEE', { locale: es })}
              </span>
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                  isSelected
                    ? 'text-primary-foreground'
                    : isToday
                      ? 'bg-accent text-foreground'
                      : 'text-foreground/85'
                )}
              >
                {format(day, 'd')}
              </span>
              <span
                className={cn(
                  'size-1 rounded-full',
                  hasEvents
                    ? isSelected
                      ? 'bg-primary-foreground'
                      : 'bg-primary'
                    : 'bg-transparent'
                )}
              />
            </button>
          );
        })}
      </div>

      <Card className='min-w-0 overflow-hidden py-0 shadow-sm'>
        {isLoading ? (
          <div className='flex flex-col gap-2 p-4'>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className='bg-muted h-14 animate-pulse rounded-lg' />
            ))}
          </div>
        ) : dayEvents.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-10 text-center'>
            <p className='text-muted-foreground text-sm'>Nada por aquí. Un día tranquilo.</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onCreate(selectedDate)}
              className='gap-1.5'
            >
              <Icons.add className='size-4' />
              Añadir evento
            </Button>
          </div>
        ) : (
          <div className='divide-border/70 divide-y'>
            {dayEvents.map((event) => {
              const category = categoryFor(event, categories);
              return (
                <button
                  key={event.id}
                  type='button'
                  onClick={() => onOpenEvent(event)}
                  className='hover:bg-accent/20 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:not-aria-[haspopup]:translate-y-px'
                >
                  <span className='text-muted-foreground w-12 shrink-0 text-xs font-medium tabular-nums'>
                    {format(new Date(event.startAt), 'HH:mm')}
                  </span>
                  <span
                    className='h-8 w-[3px] shrink-0 rounded-full'
                    style={{ backgroundColor: category.color }}
                  />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-medium'>{event.title}</span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      {category.name}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
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

const MONTH_CELL_EVENT_LIMIT = 3;

function MonthView({ cursor, events, categories, onOpenEvent, onCreate }: ViewProps) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const today = new Date();
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[760px]'>
        <div className='bg-surface-subtle grid grid-cols-7 border-b'>
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-muted-foreground/80 px-3 py-2.5 text-[11px] font-semibold tracking-wider uppercase',
                (index === 5 || index === 6) && 'text-muted-foreground/60'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {days.map((day) => {
            const out = !isSameMonth(day, cursor);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            const isToday = isSameDay(day, today);
            const dayEvents = eventsForDay(events, day);
            const overflow = dayEvents.length - MONTH_CELL_EVENT_LIMIT;
            return (
              <div
                key={day.toISOString()}
                onClick={() => onCreate(day)}
                className={cn(
                  'group border-border/70 relative min-h-32 cursor-pointer border-r border-b p-2.5 transition-colors last:border-r-0',
                  'hover:bg-accent/25',
                  weekend && !out && 'bg-surface-subtle/70',
                  out && 'bg-surface-subtle/40'
                )}
              >
                <button
                  type='button'
                  aria-label={`Crear evento el ${format(day, 'EEEE d MMMM yyyy', { locale: es })}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onCreate(day);
                  }}
                  className={cn(
                    'mb-2 flex size-7 items-center justify-center rounded-full text-[13px] font-medium transition-colors',
                    isToday
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : out
                        ? 'text-muted-foreground/45'
                        : 'text-foreground/85 group-hover:bg-accent/60'
                  )}
                >
                  {format(day, 'd')}
                </button>
                <div className='flex flex-col gap-1'>
                  {dayEvents.slice(0, MONTH_CELL_EVENT_LIMIT).map((event) => {
                    const category = categoryFor(event, categories);
                    return (
                      <button
                        key={event.id}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onOpenEvent(event);
                        }}
                        className='flex min-w-0 items-center gap-1.5 rounded-md border-l-2 py-1 pr-2 pl-2 text-left text-xs font-medium transition-colors hover:brightness-95'
                        style={{
                          backgroundColor: `${category.color}14`,
                          borderColor: category.color,
                          color: category.color
                        }}
                      >
                        <span className='truncate'>{event.title}</span>
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <button
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onCreate(day);
                      }}
                      className='text-muted-foreground hover:text-foreground px-2 text-left text-[11px] font-medium'
                    >
                      +{overflow} más
                    </button>
                  )}
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
  const today = new Date();
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[720px]'>
        <div
          className='bg-surface-subtle grid border-b'
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          <div />
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'border-border/70 border-l px-3 py-2.5',
                  (day.getDay() === 0 || day.getDay() === 6) && 'bg-surface-subtle/70'
                )}
              >
                <p className='text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase'>
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p
                  className={cn(
                    'mt-0.5 flex size-7 items-center justify-center rounded-full text-lg font-semibold',
                    isToday && 'bg-primary text-primary-foreground text-base'
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>
            );
          })}
        </div>
        <div
          className='grid'
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
        >
          {hours.map((hour) => (
            <div key={hour} className='contents'>
              <div className='border-border/70 text-muted-foreground/80 h-20 border-b px-3 py-2 text-right text-[11px] tabular-nums'>
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map((day) => (
                <button
                  key={`${day}-${hour}`}
                  onClick={() =>
                    onCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))
                  }
                  className='border-border/70 hover:bg-accent/20 relative h-20 border-b border-l p-1.5 text-left transition-colors'
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
                          className='block truncate rounded-md border-l-2 py-1 pr-2 pl-2 text-xs font-medium'
                          style={{
                            backgroundColor: `${category.color}14`,
                            borderColor: category.color,
                            color: category.color
                          }}
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
  const [color, setColor] = useState('#4f39c9');
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
    setColor('#4f39c9');
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
    <div className='bg-border grid grid-cols-7 gap-px p-px'>
      {Array.from({ length: 35 }, (_, i) => (
        <div key={i} className='bg-card h-32 animate-pulse p-3'>
          <div className='bg-muted h-3 w-5 rounded' />
          <div className='bg-muted/60 mt-8 h-5 rounded' />
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
