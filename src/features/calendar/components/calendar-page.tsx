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
  // Mobile gets its own composition: a full month overview you can tap into
  // a day's hourly timeline, rather than the desktop grid shrunk down. It
  // tracks its own month cursor, selected day and year/month/day mode.
  const [mobileCursor, setMobileCursor] = useState(new Date());
  const [mobileMode, setMobileMode] = useState<'year' | 'month' | 'day'>('month');
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

  const mobileRange = useMemo(
    () => ({
      start: startOfWeek(startOfMonth(mobileCursor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(mobileCursor), { weekStartsOn: 1 })
    }),
    [mobileCursor]
  );
  const {
    data: mobileMonthEvents = [],
    isLoading: isMobileLoading,
    isError: isMobileError
  } = useQuery({
    queryKey: eventKeys.list({
      startDate: mobileRange.start.toISOString(),
      endDate: mobileRange.end.toISOString()
    }),
    queryFn: () =>
      getEvents({
        startDate: mobileRange.start.toISOString(),
        endDate: mobileRange.end.toISOString()
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
  const visibleMobileEvents = mobileMonthEvents.filter((event) =>
    filters.includes(categoryFor(event, categories).id)
  );

  return (
    <main className='flex flex-col gap-4 pb-0 md:gap-5 md:pb-8'>
      {/* Desktop-only page header — the mobile experience gets its own
          purpose-built header inside MobileCalendar instead of this one. */}
      <header className='hidden flex-col gap-4 md:flex lg:flex-row lg:items-center lg:justify-between'>
        <div className='hidden md:block'>
          <p className='text-muted-foreground text-sm'>Planificación del equipo</p>
          <h1 className='mt-0.5 text-[1.75rem] leading-tight font-semibold tracking-tight capitalize'>
            {title}
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='bg-surface-subtle/70 border-border/50 hidden items-center gap-0.5 rounded-xl border p-1 backdrop-blur-sm md:flex'>
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
            className='bg-surface-subtle/70 border-border/50 hidden rounded-xl border p-1 backdrop-blur-sm md:flex'
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

      {/* Category filter chips — desktop only. On mobile, filtering lives in
          the calendar's own settings entry point so the full-screen surface
          isn't preceded by a row of dashboard-style controls. */}
      <div className='hidden flex-wrap items-center gap-2 md:flex'>
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
        <div className='border-destructive/25 bg-destructive/5 mx-4 rounded-xl border px-4 py-3 text-sm text-destructive md:mx-0'>
          No se pudieron cargar los eventos. Intenta actualizar la vista.
        </div>
      )}

      {/*
        Mobile: a genuine full-screen calendar surface, not a page inside the
        dashboard. The negative margins cancel PageContainer's mobile padding
        (px-4 pt-3 pb-6) so this owns the full width and bleeds to the very
        bottom, and the explicit height fills exactly what's left of the
        viewport between the sticky app header (h-14 = 3.5rem) and the space
        SidebarInset already reserves for the bottom nav
        (pb-[calc(4rem+env(safe-area-inset-bottom))]) — 3.5rem + 4rem rounds
        the small top padding remainder in, giving 8rem total. No PageContainer
        card, no generic page header: this is its own composition.
      */}
      <div className='-mx-4 -mt-1 -mb-6 flex h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] flex-col md:hidden'>
        <MobileCalendar
          mode={mobileMode}
          onModeChange={setMobileMode}
          cursor={mobileCursor}
          onCursorChange={setMobileCursor}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          events={visibleMobileEvents}
          categories={categories}
          isLoading={isMobileLoading}
          onOpenEvent={openEvent}
          onCreate={openCreate}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {/* Desktop / tablet: month, week and day grid views. */}
      <Card
        className={cn(
          'border-border/60 bg-card/95 hidden min-w-0 overflow-hidden py-0 backdrop-blur-sm md:block',
          'shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_40px_-24px_rgba(0,0,0,0.35)]'
        )}
      >
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

const mobileWeekDaysNarrow = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MOBILE_DAY_START_HOUR = 7;
const MOBILE_DAY_END_HOUR = 21; // exclusive upper bound, last row is 20:00
const MOBILE_HOUR_ROW_PX = 60;

/**
 * Mobile calendar experience: a real month overview you can tap into a
 * day's hourly timeline — see CLAUDE.md Calendar Mobile. The two panels sit
 * side by side and slide via transform so the transition feels like a
 * native navigation push rather than a hard cut.
 */
const mobileModeOrder: Array<'year' | 'month' | 'day'> = ['year', 'month', 'day'];

/**
 * Mobile calendar experience: year → month → day, each one a real, distinct
 * screen the user zooms through — see CLAUDE.md Calendar Mobile. The three
 * panels sit side by side inside a 300%-wide track and slide via transform,
 * so moving between them feels like a connected native push rather than a
 * hard cut.
 */
function MobileCalendar({
  mode,
  onModeChange,
  cursor,
  onCursorChange,
  selectedDate,
  onSelectDate,
  events,
  categories,
  isLoading,
  onOpenEvent,
  onCreate,
  onOpenSettings
}: {
  mode: 'year' | 'month' | 'day';
  onModeChange: (mode: 'year' | 'month' | 'day') => void;
  cursor: Date;
  onCursorChange: (date: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
  categories: Category[];
  isLoading: boolean;
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
  onOpenSettings: () => void;
}) {
  const openDay = (day: Date) => {
    onSelectDate(day);
    if (!isSameMonth(day, cursor)) onCursorChange(day);
    onModeChange('day');
  };
  const openMonthFromYear = (month: Date) => {
    onCursorChange(month);
    onModeChange('month');
  };
  const index = mobileModeOrder.indexOf(mode);

  return (
    <div className='relative h-full overflow-hidden'>
      <div
        className='flex h-full w-[300%] transition-transform duration-300 ease-out motion-reduce:transition-none'
        style={{ transform: `translateX(-${index * (100 / 3)}%)` }}
      >
        <div
          className='h-full w-1/3 shrink-0'
          aria-hidden={mode !== 'year'}
          inert={mode !== 'year'}
        >
          <MobileYearView
            year={cursor.getFullYear()}
            onYearChange={(year) => onCursorChange(new Date(year, cursor.getMonth(), 1))}
            onSelectMonth={openMonthFromYear}
          />
        </div>
        <div
          className='h-full w-1/3 shrink-0'
          aria-hidden={mode !== 'month'}
          inert={mode !== 'month'}
        >
          <MobileMonthView
            cursor={cursor}
            selectedDate={selectedDate}
            events={events}
            categories={categories}
            isLoading={isLoading}
            onCursorChange={onCursorChange}
            onSelectDay={openDay}
            onOpenYear={() => onModeChange('year')}
            onOpenSettings={onOpenSettings}
          />
        </div>
        <div className='h-full w-1/3 shrink-0' aria-hidden={mode !== 'day'} inert={mode !== 'day'}>
          <MobileDayTimeline
            date={selectedDate}
            events={events}
            categories={categories}
            onBack={() => onModeChange('month')}
            onOpenEvent={onOpenEvent}
            onCreate={onCreate}
          />
        </div>
      </div>
    </div>
  );
}

const mobileMonthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

/** Secondary screen: a compact grid of the year's months. Never the default
 * view — reached only by tapping the month/year title. */
function MobileYearView({
  year,
  onYearChange,
  onSelectMonth
}: {
  year: number;
  onYearChange: (year: number) => void;
  onSelectMonth: (month: Date) => void;
}) {
  const today = new Date();
  return (
    <div className='flex h-full flex-col justify-center gap-4 px-4 pt-1 pb-6'>
      <div className='flex items-center justify-center gap-3'>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onYearChange(year - 1)}
          aria-label='Año anterior'
          className='rounded-lg'
        >
          <Icons.chevronLeft className='size-4' />
        </Button>
        <p className='min-w-16 text-center text-2xl font-semibold tracking-tight tabular-nums'>
          {year}
        </p>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onYearChange(year + 1)}
          aria-label='Año siguiente'
          className='rounded-lg'
        >
          <Icons.chevronRight className='size-4' />
        </Button>
      </div>
      <div className='grid grid-cols-3 gap-2.5'>
        {mobileMonthNames.map((name, index) => {
          const isCurrent = today.getFullYear() === year && today.getMonth() === index;
          return (
            <button
              key={name}
              type='button'
              onClick={() => onSelectMonth(new Date(year, index, 1))}
              className={cn(
                'border-border/50 bg-surface-subtle/60 flex flex-col items-center justify-center gap-1 rounded-2xl border py-4 text-sm font-medium backdrop-blur-sm transition-colors',
                'hover:bg-accent/30 active:scale-[0.98]',
                isCurrent && 'border-primary/40 text-primary bg-primary/10 font-semibold'
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileMonthView({
  cursor,
  selectedDate,
  events,
  categories,
  isLoading,
  onCursorChange,
  onSelectDay,
  onOpenYear,
  onOpenSettings
}: {
  cursor: Date;
  selectedDate: Date;
  events: Event[];
  categories: Category[];
  isLoading: boolean;
  onCursorChange: (date: Date) => void;
  onSelectDay: (date: Date) => void;
  onOpenYear: () => void;
  onOpenSettings: () => void;
}) {
  const today = new Date();
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const weekRows = days.length / 7;

  return (
    <div className='flex h-full flex-col gap-3 px-4 pt-1 pb-3'>
      <div className='flex items-center justify-between gap-2'>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onCursorChange(subMonths(cursor, 1))}
          aria-label='Mes anterior'
          className='rounded-lg'
        >
          <Icons.chevronLeft className='size-4' />
        </Button>
        <button
          type='button'
          onClick={onOpenYear}
          aria-label='Elegir otro mes del año'
          className='hover:bg-accent/30 rounded-lg px-2 py-1 text-xl font-semibold tracking-tight capitalize transition-colors active:scale-[0.98]'
        >
          {format(cursor, 'LLLL yyyy', { locale: es })}
        </button>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onCursorChange(addMonths(cursor, 1))}
          aria-label='Mes siguiente'
          className='rounded-lg'
        >
          <Icons.chevronRight className='size-4' />
        </Button>
      </div>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 items-center justify-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onCursorChange(new Date())}
            className='rounded-lg px-3 text-xs font-medium'
          >
            Hoy
          </Button>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => onSelectDay(startOfDay(new Date()))}
            aria-label='Nuevo evento hoy'
            className='rounded-lg'
          >
            <Icons.add className='size-4' />
          </Button>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={onOpenSettings}
          aria-label='Configuración del calendario'
          className='text-muted-foreground shrink-0 rounded-lg'
        >
          <Icons.settings className='size-4' />
        </Button>
      </div>

      <div className='border-border/50 bg-card/70 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-20px_rgba(0,0,0,0.35)] backdrop-blur-sm'>
        <div className='bg-surface-subtle/70 grid shrink-0 grid-cols-7 border-b'>
          {mobileWeekDaysNarrow.map((day, index) => (
            <div
              key={day + index}
              className={cn(
                'text-muted-foreground/80 py-2 text-center text-[11px] font-semibold tracking-wide uppercase',
                (index === 5 || index === 6) && 'text-muted-foreground/55'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        {isLoading ? (
          <div
            className='grid flex-1 grid-cols-7'
            style={{ gridTemplateRows: `repeat(${weekRows}, minmax(0, 1fr))` }}
          >
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className='border-border/60 flex items-center justify-center border-r border-b last:border-r-0'
              >
                <div className='bg-muted/50 size-6 animate-pulse rounded-full' />
              </div>
            ))}
          </div>
        ) : (
          <div
            className='grid flex-1 grid-cols-7'
            style={{ gridTemplateRows: `repeat(${weekRows}, minmax(0, 1fr))` }}
          >
            {days.map((day) => {
              const out = !isSameMonth(day, cursor);
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);
              const dots = eventsForDay(events, day).slice(0, 3);
              return (
                <button
                  key={day.toISOString()}
                  type='button'
                  onClick={() => onSelectDay(day)}
                  aria-label={format(day, 'EEEE d MMMM', { locale: es })}
                  className={cn(
                    'border-border/60 relative flex min-h-11 flex-col items-center justify-center gap-1 border-r border-b transition-colors last:border-r-0',
                    'hover:bg-accent/25 active:scale-[0.97]',
                    weekend && !out && 'bg-surface-subtle/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full text-[13px] font-medium transition-colors',
                      isSelected && isToday
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : isSelected
                          ? 'bg-accent text-foreground font-semibold'
                          : isToday
                            ? 'ring-primary/60 text-primary font-semibold ring-2'
                            : out
                              ? 'text-muted-foreground/35'
                              : 'text-foreground/85'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <span className='flex h-1.5 items-center gap-0.5'>
                    {dots.map((event) => {
                      const category = categoryFor(event, categories);
                      return (
                        <span
                          key={event.id}
                          className='size-1 rounded-full'
                          style={{ backgroundColor: category.color, opacity: out ? 0.4 : 1 }}
                        />
                      );
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileDayTimeline({
  date,
  events,
  categories,
  onBack,
  onOpenEvent,
  onCreate
}: {
  date: Date;
  events: Event[];
  categories: Category[];
  onBack: () => void;
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const hours = Array.from(
    { length: MOBILE_DAY_END_HOUR - MOBILE_DAY_START_HOUR },
    (_, i) => i + MOBILE_DAY_START_HOUR
  );
  const dayEvents = eventsForDay(events, date);
  const rangeStartMinutes = MOBILE_DAY_START_HOUR * 60;
  const rangeEndMinutes = MOBILE_DAY_END_HOUR * 60;
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const showNowLine = isToday && nowMinutes >= rangeStartMinutes && nowMinutes <= rangeEndMinutes;
  const nowOffset = ((nowMinutes - rangeStartMinutes) / 60) * MOBILE_HOUR_ROW_PX;

  return (
    <div className='flex h-full flex-col gap-3 px-4 pt-1 pb-3'>
      <div className='flex shrink-0 items-center gap-2'>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={onBack}
          aria-label='Volver al mes'
          className='shrink-0 rounded-lg'
        >
          <Icons.chevronLeft className='size-4' />
        </Button>
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground truncate text-xs capitalize'>
            {format(date, 'MMMM yyyy', { locale: es })}
          </p>
          <p className='truncate text-lg font-semibold tracking-tight capitalize'>
            {format(date, 'EEEE d', { locale: es })}
          </p>
        </div>
        {dayEvents.length > 0 && (
          <span className='text-muted-foreground shrink-0 text-xs'>
            {dayEvents.length} evento{dayEvents.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className='border-border/50 bg-card/70 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-20px_rgba(0,0,0,0.35)] backdrop-blur-sm'>
        <div className='relative flex-1 overflow-y-auto overscroll-contain'>
          {showNowLine && (
            <div
              className='pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1.5 pl-14'
              style={{ top: nowOffset }}
            >
              <span className='bg-primary size-1.5 shrink-0 rounded-full' />
              <span className='bg-primary h-px flex-1' />
            </div>
          )}
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter(
              (event) => new Date(event.startAt).getHours() === hour
            );
            return (
              <button
                key={hour}
                type='button'
                onClick={() =>
                  onCreate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour))
                }
                style={{ minHeight: MOBILE_HOUR_ROW_PX }}
                className='border-border/60 hover:bg-accent/15 flex w-full items-start gap-3 border-b p-2 text-left transition-colors'
              >
                <span className='text-muted-foreground w-11 shrink-0 pt-0.5 text-[11px] font-medium tabular-nums'>
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  {hourEvents.map((event) => {
                    const category = categoryFor(event, categories);
                    return (
                      <span
                        key={event.id}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onOpenEvent(event);
                        }}
                        className='flex min-w-0 items-center gap-1.5 truncate rounded-md border-l-2 px-2 py-1.5 text-xs font-medium'
                        style={{
                          backgroundColor: `${category.color}14`,
                          borderColor: category.color,
                          color: category.color
                        }}
                      >
                        <span className='truncate'>{event.title}</span>
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        variant='outline'
        size='sm'
        onClick={() => onCreate(date)}
        className='shrink-0 gap-1.5 self-start'
      >
        <Icons.add className='size-4' />
        Añadir evento
      </Button>
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
