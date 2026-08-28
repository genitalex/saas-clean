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
import { Card, CardContent } from '@/components/ui/card';
import { getEvents, eventKeys } from '../queries';
import type { Event } from '../types';
import { EventDialog } from './event-dialog';

type CalendarView = 'month' | 'week' | 'day';

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function rangeForView(cursor: Date, view: CalendarView) {
  if (view === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    return { start, end: endOfWeek(cursor, { weekStartsOn: 1 }) };
  }
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
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const range = useMemo(() => rangeForView(cursor, view), [cursor, view]);
  const {
    data: events = [],
    isPending,
    isError
  } = useQuery({
    queryKey: eventKeys.list({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString()
    }),
    queryFn: () =>
      getEvents({ startDate: range.start.toISOString(), endDate: range.end.toISOString() })
  });

  function moveCursor(direction: 1 | -1) {
    setCursor((current) =>
      view === 'month'
        ? direction === 1
          ? addMonths(current, 1)
          : subMonths(current, 1)
        : direction === 1
          ? addWeeks(current, 1)
          : subWeeks(current, 1)
    );
  }

  function openCreate(date = cursor) {
    setSelectedEvent(null);
    setInitialDate(date);
    setDialogOpen(true);
  }

  function openEvent(event: Event) {
    setSelectedEvent(event);
    setInitialDate(undefined);
    setDialogOpen(true);
  }

  const title =
    view === 'month'
      ? format(cursor, 'LLLL yyyy', { locale: es })
      : view === 'week'
        ? `${format(range.start, 'd MMM', { locale: es })} - ${format(addDays(range.end, -1), 'd MMM yyyy', { locale: es })}`
        : format(cursor, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            type='button'
            onClick={() => moveCursor(-1)}
            aria-label='Periodo anterior'
          >
            <Icons.chevronLeft />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            type='button'
            onClick={() => moveCursor(1)}
            aria-label='Periodo siguiente'
          >
            <Icons.chevronRight />
          </Button>
          <Button variant='ghost' size='sm' type='button' onClick={() => setCursor(new Date())}>
            Hoy
          </Button>
          <h2 className='ml-2 text-base font-semibold capitalize'>{title}</h2>
        </div>
        <div className='flex items-center gap-2'>
          <select
            aria-label='Vista del calendario'
            className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm'
            value={view}
            onChange={(event) => setView(event.target.value as CalendarView)}
          >
            <option value='month'>Mes</option>
            <option value='week'>Semana</option>
            <option value='day'>Día</option>
          </select>
          <Button size='sm' type='button' onClick={() => openCreate()}>
            <Icons.add data-icon='inline-start' /> Nuevo evento
          </Button>
        </div>
      </div>
      {isError ? (
        <p className='text-destructive text-sm'>No se pudieron cargar los eventos.</p>
      ) : isPending ? (
        <div className='bg-muted h-[520px] animate-pulse rounded-xl' />
      ) : (
        <Card className='overflow-hidden'>
          {events.length === 0 && (
            <div className='border-b bg-muted/20 px-5 py-6 text-center'>
              <p className='font-medium'>Tu agenda está despejada</p>
              <p className='text-muted-foreground mt-1 text-sm'>
                Puedes crear tu primer evento desde aquí.
              </p>
              <Button className='mt-4' size='sm' type='button' onClick={() => openCreate()}>
                <Icons.add data-icon='inline-start' /> Crear evento
              </Button>
            </div>
          )}
          {view === 'month' && (
            <MonthView
              cursor={cursor}
              events={events}
              onOpenEvent={openEvent}
              onCreate={openCreate}
            />
          )}
          {view === 'week' && (
            <WeekView
              cursor={cursor}
              events={events}
              onOpenEvent={openEvent}
              onCreate={openCreate}
            />
          )}
          {view === 'day' && (
            <DayView
              cursor={cursor}
              events={events}
              onOpenEvent={openEvent}
              onCreate={openCreate}
            />
          )}
        </Card>
      )}
      <EventDialog
        open={dialogOpen}
        event={selectedEvent}
        initialDate={initialDate}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

type ViewProps = {
  cursor: Date;
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
};

function MonthView({ cursor, events, onOpenEvent, onCreate }: ViewProps) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[620px]'>
        <div className='grid grid-cols-7 border-b'>
          {weekDays.map((day) => (
            <div key={day} className='text-muted-foreground px-2 py-3 text-xs font-medium'>
              {day}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              muted={!isSameMonth(day, cursor)}
              events={eventsForDay(events, day)}
              onOpenEvent={onOpenEvent}
              onCreate={onCreate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeekView({ cursor, events, onOpenEvent, onCreate }: ViewProps) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[620px]'>
        <div className='grid grid-cols-7 border-b'>
          {weekDays.map((day, index) => (
            <div
              key={day}
              className='text-muted-foreground border-r px-2 py-3 text-xs font-medium last:border-r-0'
            >
              {day}
              <span className='text-foreground ml-1'>{format(addDays(start, index), 'd')}</span>
            </div>
          ))}
        </div>
        <div className='grid min-h-[420px] grid-cols-7'>
          {weekDays.map((day, index) => {
            const date = addDays(start, index);
            return (
              <DayCell
                key={day}
                day={date}
                events={eventsForDay(events, date)}
                onOpenEvent={onOpenEvent}
                onCreate={onCreate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayView({ cursor, events, onOpenEvent, onCreate }: ViewProps) {
  const dayEvents = eventsForDay(events, cursor);
  return (
    <CardContent className='p-4'>
      <div className='flex items-center justify-between border-b pb-3'>
        <div>
          <p className='text-sm font-medium capitalize'>
            {format(cursor, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className='text-muted-foreground text-xs'>
            {dayEvents.length} evento{dayEvents.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant='outline' size='sm' type='button' onClick={() => onCreate(cursor)}>
          <Icons.add data-icon='inline-start' /> Añadir
        </Button>
      </div>
      <div className='flex flex-col'>
        {dayEvents.map((event) => (
          <EventRow key={event.id} event={event} onOpen={() => onOpenEvent(event)} />
        ))}
      </div>
    </CardContent>
  );
}

function DayCell({
  day,
  muted,
  events,
  onOpenEvent,
  onCreate
}: {
  day: Date;
  muted?: boolean;
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
}) {
  return (
    <div className={`min-h-28 border-r border-b p-2 last:border-r-0 ${muted ? 'bg-muted/20' : ''}`}>
      <button
        type='button'
        className='text-muted-foreground hover:text-foreground mb-2 block text-xs tabular-nums'
        onClick={() => onCreate(day)}
      >
        {format(day, 'd')}
      </button>
      <div className='flex flex-col gap-1'>
        {events.slice(0, 3).map((event) => (
          <button
            key={event.id}
            type='button'
            onClick={() => onOpenEvent(event)}
            className='bg-primary/10 text-primary hover:bg-primary/20 flex min-w-0 flex-col rounded-md px-1.5 py-1 text-left text-[11px]'
          >
            <span className='truncate font-medium'>
              {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
            </span>
            <span className='truncate'>{event.title}</span>
          </button>
        ))}
        {events.length > 3 && (
          <span className='text-muted-foreground px-1 text-[10px]'>+{events.length - 3} más</span>
        )}
      </div>
    </div>
  );
}

function EventRow({ event, onOpen }: { event: Event; onOpen: () => void }) {
  return (
    <button
      type='button'
      onClick={onOpen}
      className='hover:bg-muted/50 flex items-center gap-4 border-b px-1 py-4 text-left last:border-0'
    >
      <span className='text-muted-foreground w-14 text-xs tabular-nums'>
        {event.allDay ? 'Todo el día' : format(new Date(event.startAt), 'HH:mm')}
      </span>
      <span className='bg-primary size-2 shrink-0 rounded-full' />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-medium'>{event.title}</span>
        <span className='text-muted-foreground block truncate text-xs'>
          {event.customer?.name ?? event.location ?? 'Sin detalles'}
        </span>
      </span>
      <Icons.chevronRight className='text-muted-foreground' />
    </button>
  );
}

function eventsForDay(events: Event[], day: Date) {
  const start = startOfDay(day).getTime();
  const end = addDays(startOfDay(day), 1).getTime();
  return events.filter(
    (event) => new Date(event.startAt).getTime() < end && new Date(event.endAt).getTime() > start
  );
}
