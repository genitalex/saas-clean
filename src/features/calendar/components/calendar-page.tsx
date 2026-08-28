'use client';

import { useMemo, useState } from 'react';
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
import { getEvents, eventKeys } from '../queries';
import type { Event } from '../types';
import { EventDialog } from './event-dialog';

type CalendarView = 'month' | 'week' | 'day';
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const categoryColors = ['bg-primary', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [initialDate, setInitialDate] = useState<Date>();
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

  return (
    <main className='flex flex-col gap-5 pb-8'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-muted-foreground text-sm'>Planificación del equipo</p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight capitalize'>{title}</h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex items-center rounded-lg border bg-background p-1'>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => shift(-1)}
              aria-label='Periodo anterior'
            >
              <Icons.chevronLeft />
            </Button>
            <Button variant='ghost' size='sm' onClick={() => setCursor(new Date())}>
              Hoy
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => shift(1)}
              aria-label='Periodo siguiente'
            >
              <Icons.chevronRight />
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === option ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {option === 'month' ? 'Mes' : option === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <Button onClick={() => openCreate()}>
            <Icons.add data-icon='inline-start' /> Nuevo evento
          </Button>
        </div>
      </header>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3'>
        <div className='flex items-center gap-5 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground'>Agenda</span>
          <span className='flex items-center gap-2'>
            <i className='size-2 rounded-full bg-primary' /> Trabajo
          </span>
          <span className='flex items-center gap-2'>
            <i className='size-2 rounded-full bg-amber-500' /> Importante
          </span>
          <span className='flex items-center gap-2'>
            <i className='size-2 rounded-full bg-sky-500' /> Personal
          </span>
        </div>
        <span className='text-muted-foreground text-xs'>
          {events.length} evento{events.length === 1 ? '' : 's'} en este periodo
        </span>
      </div>
      {isError && (
        <div className='flex items-center justify-between rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          <span>No se pudieron cargar los eventos.</span>
          <Button variant='outline' size='sm' onClick={() => setCursor(new Date(cursor))}>
            Reintentar
          </Button>
        </div>
      )}
      <div className='grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)]'>
        <CalendarSidebar cursor={cursor} events={events} onSelectDate={setCursor} />
        <Card className='min-w-0 overflow-hidden shadow-sm'>
          {isLoading ? (
            <CalendarSkeleton />
          ) : view === 'month' ? (
            <MonthView
              cursor={cursor}
              events={events}
              onCreate={openCreate}
              onOpenEvent={openEvent}
            />
          ) : (
            <TimelineView
              cursor={cursor}
              view={view}
              events={events}
              onCreate={openCreate}
              onOpenEvent={openEvent}
            />
          )}
        </Card>
      </div>
      <EventDialog
        open={dialogOpen}
        event={selectedEvent}
        initialDate={initialDate}
        onOpenChange={setDialogOpen}
      />
    </main>
  );
}

type ViewProps = {
  cursor: Date;
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
};

function CalendarSidebar({
  cursor,
  events,
  onSelectDate
}: {
  cursor: Date;
  events: Event[];
  onSelectDate: (date: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const days = Array.from({ length: 35 }, (_, index) => addDays(start, index));
  const categories = [
    ['Trabajo', 'bg-primary'],
    ['Importante', 'bg-amber-500'],
    ['Personal', 'bg-sky-500']
  ];

  return (
    <aside className='hidden rounded-xl border bg-card p-4 xl:block'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-semibold capitalize'>
          {format(cursor, 'MMMM yyyy', { locale: es })}
        </p>
        <span className='text-xs text-muted-foreground'>{events.length} eventos</span>
      </div>
      <div className='mt-4 grid grid-cols-7 gap-y-1 text-center'>
        {weekDays.map((day) => (
          <span key={day} className='text-[9px] font-semibold uppercase text-muted-foreground'>
            {day.slice(0, 1)}
          </span>
        ))}
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={`mx-auto flex size-6 items-center justify-center rounded-full text-[11px] transition-colors ${isSameDay(day, cursor) ? 'bg-primary text-primary-foreground' : isSameMonth(day, cursor) ? 'hover:bg-muted' : 'text-muted-foreground/50'}`}
            aria-label={`Seleccionar ${format(day, 'd MMMM', { locale: es })}`}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
      <div className='mt-6 border-t pt-4'>
        <p className='text-xs font-semibold'>Calendarios</p>
        <div className='mt-3 flex flex-col gap-3'>
          {categories.map(([label, color]) => (
            <label key={label} className='flex items-center gap-2 text-xs text-muted-foreground'>
              <input type='checkbox' defaultChecked className='accent-primary' />
              <i className={`size-2 rounded-full ${color}`} />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MonthView({ cursor, events, onOpenEvent, onCreate }: ViewProps) {
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
            const dayEvents = eventsForDay(events, day);
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-b border-r p-2.5 transition-colors hover:bg-muted/20 ${!isSameMonth(day, cursor) ? 'bg-muted/10 text-muted-foreground' : ''}`}
              >
                <button
                  onClick={() => onCreate(day)}
                  className={`mb-2 flex size-7 items-center justify-center rounded-full text-xs font-medium ${today ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {format(day, 'd')}
                </button>
                <div className='flex flex-col gap-1'>
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <button
                      key={event.id}
                      onClick={() => onOpenEvent(event)}
                      className='flex min-w-0 items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-left text-[11px] text-primary hover:bg-primary/20'
                    >
                      <i
                        className={`size-1.5 shrink-0 rounded-full ${categoryColors[index % categoryColors.length]}`}
                      />
                      <span className='truncate font-medium'>{event.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className='px-2 text-[11px] text-muted-foreground'>
                      +{dayEvents.length - 3} más
                    </span>
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
          <div
            className='col-span-full grid'
            style={{
              gridColumn: `2 / span ${days.length}`,
              gridTemplateColumns: `repeat(${days.length}, minmax(120px, 1fr))`
            }}
          >
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`border-b border-l bg-muted/20 px-3 py-3 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}
              >
                <p className='text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className='mt-1 text-lg font-semibold'>{format(day, 'd')}</p>
              </div>
            ))}
          </div>
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
              {days.map((day) => {
                const dayEvents = eventsForDay(events, day).filter(
                  (event) => new Date(event.startAt).getHours() === hour
                );
                return (
                  <button
                    key={`${day}-${hour}`}
                    onClick={() =>
                      onCreate(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))
                    }
                    className='relative h-20 border-b border-l p-1.5 text-left hover:bg-primary/5'
                  >
                    {dayEvents.map((event) => (
                      <span
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEvent(event);
                        }}
                        className='block truncate rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary'
                      >
                        {event.title}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
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
