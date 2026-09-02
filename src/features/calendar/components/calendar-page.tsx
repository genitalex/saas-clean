'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
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
import { getEvents, eventKeys, updateEvent } from '../queries';
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

export function CalendarPage({
  initialDate: initialDateParam,
  initialView
}: {
  initialDate?: string;
  initialView?: CalendarView;
}) {
  const parseInitialDate = () => {
    if (!initialDateParam) return new Date();
    const parsed = new Date(`${initialDateParam}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  const initialCursor = parseInitialDate();
  const [cursor, setCursor] = useState(initialCursor);
  const [view, setView] = useState<CalendarView>(initialView ?? 'month');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [initialDate, setInitialDate] = useState<Date>();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<string[]>(
    defaultCategories.map((category) => category.id)
  );
  // Mobile gets its own composition: a full month overview you can tap into
  // a day's hourly timeline, rather than the desktop grid shrunk down. It
  // tracks its own month cursor, selected day and year/month/day mode.
  const [mobileCursor, setMobileCursor] = useState(initialCursor);
  const [mobileMode, setMobileMode] = useState<'year' | 'month' | 'day'>(initialView ?? 'month');
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(initialCursor));
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
      getEvents({ startDate: range.start.toISOString(), endDate: range.end.toISOString() }),
    retry: 2,
    retryDelay: (attempt: number) => Math.min(400 * 2 ** attempt, 1600),
    refetchOnWindowFocus: false
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
      }),
    retry: 2,
    retryDelay: (attempt: number) => Math.min(400 * 2 ** attempt, 1600),
    refetchOnWindowFocus: false
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
    setCursor((current) => {
      if (view === 'month') return direction === 1 ? addMonths(current, 1) : subMonths(current, 1);
      if (view === 'week') return direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1);
      return direction === 1 ? addDays(current, 1) : addDays(current, -1);
    });
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
  const moveEvent = useCallback(
    async (event: Event, nextStart: Date) => {
      const duration = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
      const nextEnd = new Date(nextStart.getTime() + duration);
      await updateEvent(event.id, {
        startAt: nextStart.toISOString(),
        endAt: nextEnd.toISOString()
      });
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Evento reprogramado');
    },
    [queryClient]
  );
  const visibleEvents = events.filter((event) =>
    filters.includes(categoryFor(event, categories).id)
  );
  const visibleMobileEvents = mobileMonthEvents.filter((event) =>
    filters.includes(categoryFor(event, categories).id)
  );

  return (
    <main className='flex flex-col gap-4 pb-0 md:gap-5 md:pb-8 min-h-0'>
      {/* Desktop-only page header — the mobile experience gets its own
          purpose-built header inside MobileCalendar instead of this one. */}
      <header className='hidden flex-col gap-4 md:flex lg:flex-row lg:items-center lg:justify-between'>
        <div className='hidden md:block'>
          <p className='text-muted-foreground text-sm'>Planificación del equipo</p>
          {view === 'month' ? (
            <button
              type='button'
              onClick={() => setYearPickerOpen(true)}
              className='group mt-0.5 inline-flex items-center gap-1.5 rounded-xl px-1.5 py-0.5 text-left text-[1.75rem] leading-tight font-semibold tracking-tight capitalize transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              aria-label={`Cambiar mes y año, actualmente ${title}`}
            >
              {title}
              <Icons.chevronDown className='text-muted-foreground/65 size-4.5 opacity-70 transition-transform group-hover:translate-y-0.5' />
            </button>
          ) : (
            <h1 className='mt-0.5 text-[1.75rem] leading-tight font-semibold tracking-tight capitalize'>
              {title}
            </h1>
          )}
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
        <div className='border-destructive/25 bg-destructive/5 hidden rounded-xl border px-4 py-3 text-sm text-destructive md:block'>
          No se pudieron cargar los eventos. Intenta actualizar la vista.
        </div>
      )}

      {/*
        Mobile: a genuine full-screen calendar surface.
        
        The mobile calendar is now handled through two mechanisms:
        1. LayoutContent (dashboard layout level) detects mobile + calendar route
           and strips the generic shell (Header, sidebars, etc.)
        2. CalendarPageWrapper (page level) detects mobile and renders
           CalendarPage without PageContainer padding
        
        Result: Calendar fills the full screen edge-to-edge on mobile, with
        only its own headers and navigation.
        
        Height is derived from the *real*, measured shell geometry:
        Header and MobileBottomNav each publish their actual rendered height
        via useShellMetric as --app-header-height / --mobile-nav-height
        (src/hooks/use-shell-metric.ts). These are the same variables the
        dashboard layout uses to reserve space for the bottom nav.
        
        Desktop: Hidden entirely — uses the grid view below instead.
      */}
      <div className='flex min-h-0 flex-1 flex-col overflow-hidden md:hidden'>
        {(isError || isMobileError) && (
          <div className='border-destructive/25 bg-destructive/5 mx-4 mt-3 shrink-0 rounded-xl border px-4 py-3 text-sm text-destructive'>
            No se pudieron cargar los eventos. Intenta actualizar la vista.
          </div>
        )}
        <div className='min-h-0 flex-1'>
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
            onMoveEvent={moveEvent}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>
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
            onOpenDay={(day) => {
              setCursor(day);
              setView('day');
            }}
          />
        ) : (
          <TimelineView
            cursor={cursor}
            view={view}
            events={visibleEvents}
            categories={categories}
            onCreate={openCreate}
            onOpenEvent={openEvent}
            onMoveEvent={moveEvent}
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
        onOpenCategorySettings={() => setSettingsOpen(true)}
      />
      <CategoryDialog
        open={settingsOpen}
        categories={categories}
        onOpenChange={setSettingsOpen}
        onChange={setCategories}
      />
      <DesktopYearDialog
        open={yearPickerOpen}
        year={cursor.getFullYear()}
        selectedMonth={cursor.getMonth()}
        onOpenChange={setYearPickerOpen}
        onChange={(date) => {
          setCursor(date);
          setYearPickerOpen(false);
        }}
      />
    </main>
  );
}

const mobileWeekDaysNarrow = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MOBILE_DAY_START_HOUR = 0;
const MOBILE_DAY_END_HOUR = 24;
const MOBILE_HOUR_ROW_PX = 60;
const ALL_DAY_ROW_PX = 58;

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
  onMoveEvent,
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
  onMoveEvent: (event: Event, nextStart: Date) => Promise<void>;
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
            onMoveEvent={onMoveEvent}
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
    <div className='flex h-full min-h-0 flex-col px-3 pt-4 pb-3 sm:px-4'>
      <div className='flex shrink-0 items-center justify-between px-1 pb-4'>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onYearChange(year - 1)}
          aria-label='Año anterior'
          className='rounded-xl'
        >
          <Icons.chevronLeft className='size-4' />
        </Button>
        <div className='text-center'>
          <p className='text-2xl font-semibold tracking-tight tabular-nums'>{year}</p>
          <p className='text-muted-foreground text-xs'>12 meses</p>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onYearChange(year + 1)}
          aria-label='Año siguiente'
          className='rounded-xl'
        >
          <Icons.chevronRight className='size-4' />
        </Button>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto pr-0.5'>
        <div className='grid grid-cols-2 gap-3 pb-3'>
          {mobileMonthNames.map((name, index) => {
            const monthDate = new Date(year, index, 1);
            const monthStart = startOfMonth(monthDate);
            const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
            const monthGridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
            const monthDays: Date[] = [];
            for (let day = monthGridStart; day <= monthGridEnd; day = addDays(day, 1)) {
              monthDays.push(day);
            }
            const isCurrent = today.getFullYear() === year && today.getMonth() === index;
            return (
              <button
                key={name}
                type='button'
                onClick={() => onSelectMonth(monthDate)}
                className={cn(
                  'bg-surface-subtle/55 border-border/50 hover:bg-accent/30 flex min-w-0 flex-col rounded-2xl border p-3 text-left transition-all active:scale-[0.985]',
                  isCurrent && 'border-primary/40 bg-primary/8 shadow-sm'
                )}
              >
                <div className='mb-2 flex items-center justify-between'>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {name}
                  </span>
                  {isCurrent && <span className='bg-primary size-1.5 rounded-full' />}
                </div>
                <div className='grid grid-cols-7 gap-x-0.5 text-center'>
                  {mobileWeekDaysNarrow.map((d) => (
                    <span key={d} className='text-[8px] font-medium text-muted-foreground/60'>
                      {d}
                    </span>
                  ))}
                  {monthDays.map((day) => {
                    const out = day.getMonth() !== index;
                    const isToday = isSameDay(day, today);
                    const past = day < startOfDay(today);
                    return (
                      <span
                        key={day.toISOString()}
                        className={cn(
                          'mt-1 flex aspect-square items-center justify-center text-[9px] tabular-nums',
                          out
                            ? 'text-muted-foreground/25'
                            : past
                              ? 'text-muted-foreground/55'
                              : 'text-muted-foreground/80',
                          isToday && 'rounded-full bg-primary text-primary-foreground font-semibold'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
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
    <div className='flex h-full min-h-0 flex-col gap-4 px-3 pt-3 pb-2 sm:px-4'>
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
          className='hover:bg-accent/30 rounded-xl px-3 py-2 text-[1.15rem] font-semibold tracking-tight capitalize transition-colors active:scale-[0.98]'
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
              const past = day < startOfDay(today);
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
                    'border-border/60 relative flex min-h-[58px] flex-col items-center justify-center gap-1.5 border-r border-b bg-background transition-colors last:border-r-0 sm:min-h-[64px]',
                    'hover:bg-accent/25 active:scale-[0.97]',
                    weekend && !out && 'bg-muted/25',
                    out && 'bg-muted/20'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      isSelected && isToday
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : isSelected
                          ? 'bg-accent text-foreground font-semibold'
                          : isToday
                            ? 'ring-primary/60 text-primary font-semibold ring-2'
                            : out
                              ? 'text-transparent'
                              : 'text-foreground/85'
                    )}
                  >
                    {out ? '' : format(day, 'd')}
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

function useEventDrag({
  startHour,
  endHour,
  hourHeight,
  onMove,
  minutesFromPointer
}: {
  startHour: number;
  endHour: number;
  hourHeight: number;
  onMove: (event: Event, nextStart: Date) => Promise<void> | void;
  minutesFromPointer?: (clientY: number, rect: DOMRect) => number;
}) {
  const [dragPreview, setDragPreview] = useState<{
    event: Event;
    dateKey: string;
    minutes: number;
  } | null>(null);
  const previewRef = useRef<{ event: Event; dateKey: string; minutes: number } | null>(null);
  const dragRef = useRef<{
    event: Event;
    startX: number;
    startY: number;
    moved: boolean;
    grabOffsetMinutes: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const frameRef = useRef<number | null>(null);
  const latestPointerRef = useRef<PointerEvent | null>(null);

  useEffect(() => {
    const handleMove = (pointerEvent: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const distance = Math.hypot(
        pointerEvent.clientX - drag.startX,
        pointerEvent.clientY - drag.startY
      );
      if (!drag.moved && distance < 6) return;
      drag.moved = true;
      suppressClickRef.current = true;
      latestPointerRef.current = pointerEvent;
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        const nextPointer = latestPointerRef.current;
        latestPointerRef.current = null;
        if (!nextPointer || !dragRef.current) return;

        const target = document
          .elementsFromPoint(nextPointer.clientX, nextPointer.clientY)
          .map((element) => element.closest<HTMLElement>('[data-calendar-day]'))
          .find(Boolean);
        if (!target) return;

        const dateKey = target.dataset.calendarDay;
        if (!dateKey) return;
        const rect = target.getBoundingClientRect();
        const durationMinutes = Math.max(
          15,
          (new Date(drag.event.endAt).getTime() - new Date(drag.event.startAt).getTime()) / 60000
        );
        const pointerMinutes = minutesFromPointer
          ? minutesFromPointer(nextPointer.clientY, rect)
          : startHour * 60 + ((nextPointer.clientY - rect.top) / hourHeight) * 60;
        const rawMinutes = pointerMinutes - drag.grabOffsetMinutes;
        const maxStart = endHour * 60 - durationMinutes;
        const minutes = Math.max(
          startHour * 60,
          Math.min(maxStart, Math.round(rawMinutes / 15) * 15)
        );
        const nextPreview = { event: drag.event, dateKey, minutes };
        previewRef.current = nextPreview;
        setDragPreview(nextPreview);
      });
    };

    const handleUp = async () => {
      const drag = dragRef.current;
      const preview = previewRef.current;
      dragRef.current = null;
      previewRef.current = null;
      setDragPreview(null);

      if (!drag?.moved || !preview) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        return;
      }

      const date = new Date(`${preview.dateKey}T00:00:00`);
      date.setHours(0, preview.minutes, 0, 0);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      await onMove(drag.event, date);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      latestPointerRef.current = null;
    };
  }, [endHour, hourHeight, minutesFromPointer, onMove, startHour]);

  const startDrag = (event: React.PointerEvent, calendarEvent: Event) => {
    if (event.button !== 0) return;
    const dayElement = event.currentTarget.closest<HTMLElement>('[data-calendar-day]');
    const dayRect = dayElement?.getBoundingClientRect();
    const eventStart = new Date(calendarEvent.startAt);
    const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const pointerMinutes = dayRect
      ? minutesFromPointer
        ? minutesFromPointer(event.clientY, dayRect)
        : startHour * 60 + ((event.clientY - dayRect.top) / hourHeight) * 60
      : eventStartMinutes;
    dragRef.current = {
      event: calendarEvent,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      grabOffsetMinutes: pointerMinutes - eventStartMinutes
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; global listeners still handle the drag.
    }
  };

  return { dragPreview, startDrag, suppressClickRef };
}

function formatHourLabel(hour: number) {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${suffix}`;
}

function MobileDayTimeline({
  date,
  events,
  categories,
  onBack,
  onOpenEvent,
  onCreate,
  onMoveEvent
}: {
  date: Date;
  events: Event[];
  categories: Category[];
  onBack: () => void;
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
  onMoveEvent: (event: Event, nextStart: Date) => Promise<void>;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);
  const HOUR = MOBILE_HOUR_ROW_PX;
  const COMPACT = 22;
  const EARLY = 5 * 60;
  const LATE = 21 * 60;
  const dayEvents = eventsForDay(events, date).filter((event) => !event.allDay);
  const allDayEvents = eventsForDay(events, date).filter((event) => event.allDay);

  const hasEarlyEvents = dayEvents.some((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return (
      start.getHours() * 60 + start.getMinutes() < EARLY &&
      end.getHours() * 60 + end.getMinutes() > 0
    );
  });
  const hasLateEvents = dayEvents.some((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return (
      start.getHours() * 60 + start.getMinutes() < 24 * 60 &&
      end.getHours() * 60 + end.getMinutes() > LATE
    );
  });

  const [earlyExpanded, setEarlyExpanded] = useState(false);
  const [lateExpanded, setLateExpanded] = useState(false);
  const earlyHeight = hasEarlyEvents || earlyExpanded ? 5 * HOUR : COMPACT;
  const lateHeight = hasLateEvents || lateExpanded ? 3 * HOUR : COMPACT;
  const workHeight = 16 * HOUR;
  const totalHeight = earlyHeight + workHeight + lateHeight;

  const offsetFromMinutes = useCallback(
    (minutes: number) => {
      const value = Math.max(0, Math.min(24 * 60, minutes));
      if (value <= EARLY) return (value / EARLY) * earlyHeight;
      if (value <= LATE) return earlyHeight + ((value - EARLY) / 60) * HOUR;
      return earlyHeight + workHeight + ((value - LATE) / 60) * (lateHeight / 3);
    },
    [earlyHeight, lateHeight, workHeight]
  );

  const minutesFromPointer = useCallback(
    (clientY: number, rect: DOMRect) => {
      const y = Math.max(0, Math.min(totalHeight, clientY - rect.top));
      if (y <= earlyHeight) return (y / Math.max(1, earlyHeight)) * EARLY;
      if (y <= earlyHeight + workHeight) return EARLY + ((y - earlyHeight) / HOUR) * 60;
      return LATE + ((y - earlyHeight - workHeight) / Math.max(1, lateHeight / 3)) * 60;
    },
    [earlyHeight, lateHeight, totalHeight, workHeight]
  );

  const todayMinutes = today.getHours() * 60 + today.getMinutes();
  const moveEvent = useCallback(
    async (event: Event, nextStart: Date) => onMoveEvent(event, nextStart),
    [onMoveEvent]
  );
  const { dragPreview, startDrag, suppressClickRef } = useEventDrag({
    startHour: 0,
    endHour: 24,
    hourHeight: HOUR,
    onMove: moveEvent,
    minutesFromPointer
  });

  const toggleEarly = () => {
    if (!hasEarlyEvents) setEarlyExpanded((value) => !value);
  };
  const toggleLate = () => {
    if (!hasLateEvents) setLateExpanded((value) => !value);
  };

  const renderRangeControl = (early: boolean) => {
    const hasEvents = early ? hasEarlyEvents : hasLateEvents;
    const expanded = early ? hasEvents || earlyExpanded : hasEvents || lateExpanded;
    const label = early ? '12 AM – 5 AM' : '9 PM – 12 AM';
    const toggle = early ? toggleEarly : toggleLate;
    const rangeTop = early ? 0 : earlyHeight + workHeight;
    const rangeHeight = early ? earlyHeight : lateHeight;
    const canToggle = !hasEvents;

    return (
      <button
        type='button'
        onClick={toggle}
        disabled={!canToggle}
        aria-label={
          canToggle
            ? `${expanded ? 'Contraer' : 'Expandir'} ${label}`
            : `${label}, contiene eventos`
        }
        className={cn(
          'absolute inset-x-0 z-40 flex items-center justify-center border-b border-border/55 bg-background/72 px-3 text-[10px] font-medium text-muted-foreground backdrop-blur-md transition-colors',
          canToggle && 'hover:bg-primary/[0.045] hover:text-foreground',
          !canToggle && 'cursor-default'
        )}
        style={{
          top: rangeTop,
          height: expanded ? 28 : rangeHeight
        }}
      >
        <span className='inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/65 px-2.5 py-1 shadow-sm'>
          <span>{label}</span>
          {canToggle && (
            <>
              <Icons.chevronDown
                className={cn('size-3 transition-transform', expanded && 'rotate-180')}
              />
              <span>{expanded ? 'Contraer' : 'Expandir'}</span>
            </>
          )}
        </span>
      </button>
    );
  };

  const renderHour = (hour: number) => {
    const top =
      hour < 5
        ? (hour / 5) * earlyHeight
        : hour < 21
          ? earlyHeight + (hour - 5) * HOUR
          : earlyHeight + workHeight + (hour - 21) * (lateHeight / 3);
    const height = hour < 5 ? earlyHeight / 5 : hour >= 21 ? lateHeight / 3 : HOUR;
    return (
      <div
        key={hour}
        className='absolute inset-x-0 border-b border-border/60'
        style={{ top, height }}
      >
        <button
          type='button'
          onClick={() =>
            onCreate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour))
          }
          className='absolute inset-0 text-left transition-colors hover:bg-primary/[0.035]'
          aria-label={`Crear evento a las ${formatHourLabel(hour)}`}
        />
        <span className='text-muted-foreground pointer-events-none absolute left-3 top-2 w-12 text-[11px] font-medium tabular-nums'>
          {formatHourLabel(hour)}
        </span>
      </div>
    );
  };

  return (
    <div className='flex h-full min-h-0 flex-col gap-4 px-3 pt-3 pb-2 sm:px-4'>
      <div className='flex shrink-0 items-center gap-2.5'>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={onBack}
          aria-label='Volver al mes'
          className='shrink-0 rounded-xl'
        >
          <Icons.chevronLeft className='size-4' />
        </Button>
        <div className='min-w-0 flex-1'>
          <p className='text-muted-foreground truncate text-xs capitalize'>
            {format(date, 'MMMM yyyy', { locale: es })}
          </p>
          <p className='truncate text-xl font-semibold tracking-tight capitalize'>
            {format(date, 'EEEE d', { locale: es })}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onCreate(date)}
          aria-label='Añadir evento'
          className='rounded-xl'
        >
          <Icons.add className='size-4' />
        </Button>
      </div>

      <div className='bg-card/75 border-border/50 min-h-0 flex-1 overflow-y-auto rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_40px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm'>
        {allDayEvents.length > 0 && (
          <div className='border-border/60 bg-surface-subtle/45 flex min-h-[58px] flex-wrap items-center gap-2 border-b px-3 py-2'>
            <span className='text-muted-foreground shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em]'>
              Todo el día
            </span>
            {allDayEvents.map((event) => {
              const category = categoryFor(event, categories);
              return (
                <button
                  key={event.id}
                  type='button'
                  onClick={() => onOpenEvent(event)}
                  className='min-w-0 truncate rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm'
                  style={{
                    backgroundColor: `${category.color}14`,
                    borderColor: `${category.color}35`
                  }}
                >
                  {event.title}
                </button>
              );
            })}
          </div>
        )}

        <div
          data-calendar-day={format(date, 'yyyy-MM-dd')}
          className='relative'
          style={{ height: totalHeight }}
        >
          {!hasEarlyEvents && !earlyExpanded
            ? renderRangeControl(true)
            : Array.from({ length: 5 }, (_, i) => renderHour(i))}
          {Array.from({ length: 16 }, (_, i) => renderHour(i + 5))}
          {!hasLateEvents && !lateExpanded
            ? renderRangeControl(false)
            : Array.from({ length: 3 }, (_, i) => renderHour(i + 21))}
          {earlyExpanded && !hasEarlyEvents && renderRangeControl(true)}
          {lateExpanded && !hasLateEvents && renderRangeControl(false)}

          {dayEvents.map((event) => {
            const category = categoryFor(event, categories);
            const startAt = new Date(event.startAt);
            const endAt = new Date(event.endAt);
            const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
            const durationMinutes = Math.max(30, (endAt.getTime() - startAt.getTime()) / 60000);
            const top = Math.max(3, offsetFromMinutes(startMinutes) + 3);
            const bottom = offsetFromMinutes(Math.min(24 * 60, startMinutes + durationMinutes));
            return (
              <button
                key={event.id}
                type='button'
                onPointerDown={(pointerEvent) => startDrag(pointerEvent, event)}
                onClick={() => {
                  if (!suppressClickRef.current) onOpenEvent(event);
                }}
                className={cn(
                  'absolute left-16 right-3 z-30 cursor-grab touch-none overflow-hidden rounded-xl border text-left shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-px active:cursor-grabbing',
                  dragPreview?.event.id === event.id && 'opacity-35'
                )}
                style={{
                  top,
                  height: Math.max(42, bottom - top - 6),
                  backgroundColor: `${category.color}14`,
                  borderColor: `${category.color}35`
                }}
              >
                <span
                  className='absolute inset-y-0 left-0 w-1'
                  style={{ backgroundColor: category.color }}
                />
                <span className='flex h-full min-w-0 flex-col justify-center px-3 pl-4'>
                  <span className='truncate text-sm font-semibold'>{event.title}</span>
                  <span className='mt-0.5 text-[11px] text-muted-foreground'>
                    {format(startAt, 'HH:mm')} – {format(endAt, 'HH:mm')}
                  </span>
                </span>
              </button>
            );
          })}

          {dragPreview?.dateKey === format(date, 'yyyy-MM-dd') &&
            (() => {
              const event = dragPreview.event;
              const category = categoryFor(event, categories);
              const startAt = new Date(event.startAt);
              const endAt = new Date(event.endAt);
              const durationMinutes = Math.max(15, (endAt.getTime() - startAt.getTime()) / 60000);
              const top = offsetFromMinutes(dragPreview.minutes);
              const bottom = offsetFromMinutes(
                Math.min(24 * 60, dragPreview.minutes + durationMinutes)
              );
              return (
                <div
                  className='pointer-events-none absolute left-16 right-3 z-40 rounded-xl border border-dashed'
                  style={{
                    top,
                    height: Math.max(42, bottom - top - 6),
                    backgroundColor: `${category.color}1c`,
                    borderColor: `${category.color}60`
                  }}
                />
              );
            })()}

          {isToday && (
            <div
              className='pointer-events-none absolute left-16 right-3 z-20 flex items-center'
              style={{ top: offsetFromMinutes(todayMinutes) }}
            >
              <span className='bg-primary size-2 rounded-full' />
              <span className='bg-primary h-[2px] flex-1' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopYearDialog({
  open,
  year,
  selectedMonth,
  onOpenChange,
  onChange
}: {
  open: boolean;
  year: number;
  selectedMonth: number;
  onOpenChange: (open: boolean) => void;
  onChange: (date: Date) => void;
}) {
  const [displayYear, setDisplayYear] = useState(year);
  const today = new Date();

  useEffect(() => {
    if (open) setDisplayYear(year);
  }, [open, year]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='!w-[calc(100vw-2rem)] !max-w-[1200px] rounded-[30px] p-5 sm:p-7 lg:p-8'>
        <DialogHeader className='pb-3'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <DialogTitle className='text-3xl tracking-tight'>
                Calendario {displayYear}
              </DialogTitle>
              <DialogDescription className='mt-1 text-sm'>
                Elige un mes para abrirlo. La vista mantiene el mismo calendario completo que en
                móvil.
              </DialogDescription>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={() => setDisplayYear((current) => current - 1)}
                aria-label='Año anterior'
                className='rounded-xl'
              >
                <Icons.chevronLeft className='size-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={() => setDisplayYear((current) => current + 1)}
                aria-label='Año siguiente'
                className='rounded-xl'
              >
                <Icons.chevronRight className='size-4' />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto pr-1'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
            {mobileMonthNames.map((name, index) => {
              const monthDate = new Date(displayYear, index, 1);
              const monthStart = startOfMonth(monthDate);
              const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
              const monthGridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
              const monthDays: Date[] = [];
              for (let day = monthGridStart; day <= monthGridEnd; day = addDays(day, 1))
                monthDays.push(day);
              const active = index === selectedMonth && displayYear === year;
              const isCurrent = today.getFullYear() === displayYear && today.getMonth() === index;
              return (
                <button
                  key={name}
                  type='button'
                  onClick={() => onChange(monthDate)}
                  className={cn(
                    'min-h-[210px] rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-accent/35 hover:shadow-md',
                    active
                      ? 'border-primary/45 bg-primary/[0.06] shadow-sm'
                      : 'border-border/60 bg-surface-subtle/45',
                    isCurrent && 'ring-1 ring-primary/30'
                  )}
                >
                  <div className='mb-3 flex items-center justify-between'>
                    <span
                      className={cn(
                        'text-base font-semibold',
                        (active || isCurrent) && 'text-primary'
                      )}
                    >
                      {name}
                    </span>
                    {isCurrent && <span className='bg-primary size-2 rounded-full' />}
                  </div>
                  <div className='grid grid-cols-7 gap-y-1 text-center'>
                    {mobileWeekDaysNarrow.map((day) => (
                      <span
                        key={day}
                        className='text-[10px] font-semibold text-muted-foreground/55'
                      >
                        {day}
                      </span>
                    ))}
                    {monthDays.map((day) => {
                      const out = day.getMonth() !== index;
                      const past = day < startOfDay(today);
                      const isToday = isSameDay(day, today);
                      return (
                        <span
                          key={day.toISOString()}
                          className={cn(
                            'flex h-6 items-center justify-center text-[11px] tabular-nums',
                            out
                              ? 'text-transparent'
                              : past && !isToday
                                ? 'text-muted-foreground/45'
                                : 'text-foreground/80',
                            isToday &&
                              'mx-auto size-6 rounded-full bg-primary font-semibold text-primary-foreground'
                          )}
                        >
                          {out ? '' : format(day, 'd')}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ViewProps = {
  cursor: Date;
  events: Event[];
  categories: Category[];
  onOpenEvent: (event: Event) => void;
  onCreate: (date: Date) => void;
  onOpenDay?: (date: Date) => void;
};
function getSavedEventCategories(): Record<string, string> {
  try {
    const saved = window.localStorage.getItem('calendar-event-categories');
    return saved ? (JSON.parse(saved) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function categoryFor(event: Event, categories: Category[]) {
  if (!categories.length) return defaultCategories[0];
  const saved = getSavedEventCategories();
  const savedId = saved[event.id];
  const savedCategory = categories.find((category) => category.id === savedId);
  if (savedCategory) return savedCategory;
  const index = Math.abs(event.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return categories[index % categories.length] ?? defaultCategories[0];
}

const MONTH_CELL_EVENT_LIMIT = 3;

function MonthView({ cursor, events, categories, onOpenEvent, onCreate, onOpenDay }: ViewProps) {
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
            const past = day < startOfDay(today);
            const dayEvents = out ? [] : eventsForDay(events, day);
            const overflow = dayEvents.length - MONTH_CELL_EVENT_LIMIT;
            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  if (!out) onOpenDay?.(day);
                }}
                className={cn(
                  'group border-border/70 relative min-h-32 border-r border-b bg-background p-2.5 transition-colors last:border-r-0',
                  !out && 'cursor-pointer',
                  out && 'cursor-default',
                  'hover:bg-accent/25',
                  weekend && !out && 'bg-muted/45',
                  out && 'bg-muted/30'
                )}
              >
                <button
                  type='button'
                  aria-label={`Ver día ${format(day, 'EEEE d MMMM yyyy', { locale: es })}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay?.(day);
                  }}
                  className={cn(
                    'mb-2 flex size-7 items-center justify-center rounded-full text-[13px] font-medium transition-colors',
                    isToday
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : out
                        ? 'text-transparent'
                        : past && weekend
                          ? 'text-muted-foreground/50'
                          : past
                            ? 'text-muted-foreground/65'
                            : weekend
                              ? 'text-muted-foreground/80'
                              : 'text-foreground/90 group-hover:bg-accent/60'
                  )}
                >
                  {out ? '' : format(day, 'd')}
                </button>
                <div className='flex flex-col gap-1'>
                  {dayEvents.slice(0, MONTH_CELL_EVENT_LIMIT).map((event) => {
                    const category = categoryFor(event, categories);
                    return (
                      <button
                        key={event.id}
                        type='button'
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
                        if (!out) onOpenDay?.(day);
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
function TimelineView(
  props: ViewProps & {
    view: 'week' | 'day';
    onMoveEvent: (event: Event, nextStart: Date) => Promise<void>;
  }
) {
  if (props.view === 'day') return <CompressedDayTimeline {...props} />;
  return <WeekTimeline {...props} />;
}

function CompressedDayTimeline({
  cursor,
  events,
  categories,
  onOpenEvent,
  onCreate,
  onMoveEvent
}: ViewProps & { view: 'day'; onMoveEvent: (event: Event, nextStart: Date) => Promise<void> }) {
  const HOUR = 72;
  const COMPACT = 26;
  const earlyMinutes = 5 * 60;
  const lateStartMinutes = 21 * 60;
  const lateMinutes = 3 * 60;
  const dayEvents = eventsForDay(events, cursor).filter((event) => !event.allDay);
  const allDayEvents = eventsForDay(events, cursor).filter((event) => event.allDay);
  const hasEarlyEvents = dayEvents.some((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return (
      start.getHours() * 60 + start.getMinutes() < earlyMinutes &&
      end.getHours() * 60 + end.getMinutes() > 0
    );
  });
  const hasLateEvents = dayEvents.some((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return (
      start.getHours() * 60 + start.getMinutes() < 24 * 60 &&
      end.getHours() * 60 + end.getMinutes() > lateStartMinutes
    );
  });

  const [earlyExpanded, setEarlyExpanded] = useState(false);
  const [lateExpanded, setLateExpanded] = useState(false);
  const earlyHeight = hasEarlyEvents || earlyExpanded ? 5 * HOUR : COMPACT;
  const lateHeight = hasLateEvents || lateExpanded ? 3 * HOUR : COMPACT;
  const workHeight = 16 * HOUR;
  const totalHeight = earlyHeight + workHeight + lateHeight;

  const offsetFromMinutes = useCallback(
    (minutes: number) => {
      const value = Math.max(0, Math.min(24 * 60, minutes));
      if (value <= earlyMinutes) return (value / earlyMinutes) * earlyHeight;
      if (value <= lateStartMinutes) return earlyHeight + ((value - earlyMinutes) / 60) * HOUR;
      return earlyHeight + workHeight + ((value - lateStartMinutes) / 60) * (lateHeight / 3);
    },
    [earlyHeight, lateHeight, workHeight]
  );

  const minutesFromPointer = useCallback(
    (clientY: number, rect: DOMRect) => {
      const y = Math.max(0, Math.min(totalHeight, clientY - rect.top));
      if (y <= earlyHeight) return (y / Math.max(1, earlyHeight)) * earlyMinutes;
      if (y <= earlyHeight + workHeight) return earlyMinutes + ((y - earlyHeight) / HOUR) * 60;
      return lateStartMinutes + ((y - earlyHeight - workHeight) / Math.max(1, lateHeight / 3)) * 60;
    },
    [earlyHeight, lateHeight, totalHeight, workHeight]
  );

  const hourTop = (hour: number) => offsetFromMinutes(hour * 60);
  const hourHeight = (hour: number) =>
    hour < 5 ? earlyHeight / 5 : hour >= 21 ? lateHeight / 3 : HOUR;

  const today = new Date();
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const moveEvent = useCallback(
    async (event: Event, nextStart: Date) => onMoveEvent(event, nextStart),
    [onMoveEvent]
  );
  const { dragPreview, startDrag, suppressClickRef } = useEventDrag({
    startHour: 0,
    endHour: 24,
    hourHeight: HOUR,
    onMove: moveEvent,
    minutesFromPointer
  });

  const toggleEarly = () => {
    if (!hasEarlyEvents) setEarlyExpanded((value) => !value);
  };
  const toggleLate = () => {
    if (!hasLateEvents) setLateExpanded((value) => !value);
  };

  const renderRangeControl = (early: boolean) => {
    const hasEvents = early ? hasEarlyEvents : hasLateEvents;
    const expanded = early ? hasEvents || earlyExpanded : hasEvents || lateExpanded;
    const label = early ? '12 AM – 5 AM' : '9 PM – 12 AM';
    const toggle = early ? toggleEarly : toggleLate;
    const canToggle = !hasEvents;
    return (
      <button
        type='button'
        onClick={toggle}
        disabled={!canToggle}
        aria-label={
          canToggle
            ? `${expanded ? 'Contraer' : 'Expandir'} ${label}`
            : `${label}, contiene eventos`
        }
        className={cn(
          'absolute inset-x-0 z-20 flex items-center justify-center border-b border-border/55 bg-surface-subtle/45 text-[10px] font-medium text-muted-foreground transition-colors',
          canToggle && 'cursor-pointer hover:bg-primary/[0.04] hover:text-foreground',
          !canToggle && 'cursor-default'
        )}
        style={{
          top: early ? 0 : earlyHeight + workHeight,
          height: early ? earlyHeight : lateHeight
        }}
      >
        <span className='inline-flex items-center gap-1.5'>
          <span>{label}</span>
          <Icons.chevronDown
            className={cn('size-3 transition-transform', expanded && 'rotate-180')}
          />
          <span className='sr-only'>{expanded ? 'Contraer' : 'Expandir'}</span>
        </span>
      </button>
    );
  };

  const renderHourRow = (hour: number) => {
    const rowTop = hourTop(hour);
    const rowHeight = hourHeight(hour);
    return (
      <div
        key={hour}
        className='absolute inset-x-0 border-b border-border/60'
        style={{ top: rowTop, height: rowHeight }}
      >
        <button
          type='button'
          onClick={() => {
            const next = new Date(cursor);
            next.setHours(hour, 0, 0, 0);
            onCreate(next);
          }}
          className='absolute inset-0 text-left transition-colors hover:bg-primary/[0.035]'
          aria-label={`Crear evento a las ${formatHourLabel(hour)}`}
        />
        <span className='text-muted-foreground absolute right-3 top-2 text-[11px] font-medium tabular-nums'>
          {formatHourLabel(hour)}
        </span>
      </div>
    );
  };

  const renderEvents = () =>
    dayEvents.map((event) => {
      const category = categoryFor(event, categories);
      const startAt = new Date(event.startAt);
      const endAt = new Date(event.endAt);
      const startMinutes = startAt.getHours() * 60 + startAt.getMinutes();
      const durationMinutes = Math.max(30, (endAt.getTime() - startAt.getTime()) / 60000);
      const top = offsetFromMinutes(startMinutes) + 3;
      const bottom = offsetFromMinutes(Math.min(24 * 60, startMinutes + durationMinutes));
      return (
        <button
          key={event.id}
          type='button'
          onPointerDown={(pointerEvent) => startDrag(pointerEvent, event)}
          onClick={() => {
            if (!suppressClickRef.current) onOpenEvent(event);
          }}
          className={cn(
            'absolute left-1.5 right-1.5 z-30 cursor-grab touch-none overflow-hidden rounded-xl border text-left shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-px hover:shadow-md active:cursor-grabbing',
            dragPreview?.event.id === event.id && 'opacity-35'
          )}
          style={{
            top,
            height: Math.max(34, bottom - top - 6),
            backgroundColor: `${category.color}12`,
            borderColor: `${category.color}35`
          }}
          title='Arrastra para cambiar de hora'
        >
          <span
            className='absolute inset-y-0 left-0 w-1'
            style={{ backgroundColor: category.color }}
          />
          <span className='flex h-full min-w-0 flex-col px-3 py-2 pl-4'>
            <span className='truncate text-sm font-semibold'>{event.title}</span>
            <span className='mt-0.5 truncate text-[11px] text-muted-foreground'>
              {format(startAt, 'HH:mm')} – {format(endAt, 'HH:mm')}
            </span>
            {event.location && (
              <span className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                {event.location}
              </span>
            )}
          </span>
        </button>
      );
    });

  const dragGhost = dragPreview
    ? (() => {
        const event = dragPreview.event;
        const category = categoryFor(event, categories);
        const startAt = new Date(event.startAt);
        const endAt = new Date(event.endAt);
        const durationMinutes = Math.max(15, (endAt.getTime() - startAt.getTime()) / 60000);
        const top = offsetFromMinutes(dragPreview.minutes);
        const bottom = offsetFromMinutes(Math.min(24 * 60, dragPreview.minutes + durationMinutes));
        return (
          <div
            className='pointer-events-none absolute left-1.5 right-1.5 z-40 rounded-xl border border-dashed'
            style={{
              top,
              height: Math.max(34, bottom - top - 6),
              backgroundColor: `${category.color}18`,
              borderColor: `${category.color}65`
            }}
          />
        );
      })()
    : null;

  return (
    <div className='min-w-0 overflow-hidden'>
      <div className='overflow-x-auto'>
        <div className='min-w-[680px]'>
          <div
            className='bg-surface-subtle/70 sticky top-0 z-10 grid border-b backdrop-blur-sm'
            style={{ gridTemplateColumns: '72px minmax(0,1fr)' }}
          >
            <div className='border-border/60 border-r' />
            <div className='border-border/60 border-r px-4 py-3'>
              <p className='text-muted-foreground text-xs font-medium capitalize'>
                {format(cursor, 'EEEE', { locale: es })}
              </p>
              <div className='mt-1 flex items-center gap-2'>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-lg font-semibold tabular-nums',
                    isSameDay(cursor, today)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  )}
                >
                  {format(cursor, 'd')}
                </span>
                <span className='text-muted-foreground text-xs capitalize'>
                  {format(cursor, 'MMM', { locale: es })}
                </span>
              </div>
            </div>
          </div>

          <div className='grid' style={{ gridTemplateColumns: '72px minmax(0,1fr)' }}>
            <div
              className='relative border-r border-border/60'
              style={{ height: totalHeight + ALL_DAY_ROW_PX }}
            >
              <div className='h-[58px] border-b border-border/60 bg-surface-subtle/45' />
              <div className='relative' style={{ height: totalHeight }}>
                {!hasEarlyEvents && !earlyExpanded
                  ? renderRangeControl(true)
                  : hasEarlyEvents
                    ? renderRangeControl(true)
                    : Array.from({ length: 5 }, (_, i) => renderHourRow(i))}
                {Array.from({ length: 16 }, (_, i) => renderHourRow(i + 5))}
                {!hasLateEvents && !lateExpanded
                  ? renderRangeControl(false)
                  : hasLateEvents
                    ? renderRangeControl(false)
                    : Array.from({ length: 3 }, (_, i) => renderHourRow(i + 21))}
              </div>
            </div>

            <div className='relative border-r border-border/60'>
              <div className='border-border/60 bg-surface-subtle/45 flex h-[58px] flex-wrap items-center gap-1.5 overflow-hidden border-b px-2 py-1.5'>
                {allDayEvents.map((event) => {
                  const category = categoryFor(event, categories);
                  return (
                    <button
                      key={event.id}
                      type='button'
                      onClick={() => onOpenEvent(event)}
                      className='min-w-0 max-w-full truncate rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm'
                      style={{
                        backgroundColor: `${category.color}14`,
                        borderColor: `${category.color}35`
                      }}
                    >
                      {event.title}
                    </button>
                  );
                })}
              </div>

              <div
                data-calendar-day={format(cursor, 'yyyy-MM-dd')}
                className='relative'
                style={{ height: totalHeight }}
              >
                {!hasEarlyEvents && !earlyExpanded
                  ? renderRangeControl(true)
                  : Array.from({ length: 5 }, (_, i) => renderHourRow(i))}
                {Array.from({ length: 16 }, (_, i) => renderHourRow(i + 5))}
                {!hasLateEvents && !lateExpanded
                  ? renderRangeControl(false)
                  : Array.from({ length: 3 }, (_, i) => renderHourRow(i + 21))}
                {renderEvents()}
                {dragGhost}
                {isSameDay(cursor, today) && (
                  <div
                    className='pointer-events-none absolute inset-x-0 z-20 flex items-center'
                    style={{
                      top: nowMinutes >= 0 ? nowOffsetSafe(nowMinutes, offsetFromMinutes) : 0
                    }}
                  >
                    <span className='bg-primary size-2 rounded-full' />
                    <span className='bg-primary h-[2px] flex-1' />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function nowOffsetSafe(minutes: number, offset: (m: number) => number) {
  return Math.max(0, Math.min(offset(24 * 60), offset(minutes)));
}

function WeekTimeline({
  cursor,
  view,
  events,
  categories,
  onOpenEvent,
  onCreate,
  onMoveEvent
}: ViewProps & {
  view: 'week' | 'day';
  onMoveEvent: (event: Event, nextStart: Date) => Promise<void>;
}) {
  const start = view === 'week' ? startOfWeek(cursor, { weekStartsOn: 1 }) : cursor;
  const days = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(start, i)) : [start];
  const startHour = 0;
  const endHour = 24;
  const hourHeight = 72;
  const totalHeight = (endHour - startHour) * hourHeight;
  const today = new Date();
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowOffset = ((nowMinutes - startHour * 60) / 60) * hourHeight;
  const showNow = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;
  const moveEvent = useCallback(
    async (event: Event, nextStart: Date) => onMoveEvent(event, nextStart),
    [onMoveEvent]
  );
  const { dragPreview, startDrag, suppressClickRef } = useEventDrag({
    startHour,
    endHour,
    hourHeight,
    onMove: moveEvent
  });

  return (
    <div className='min-w-0 overflow-hidden'>
      <div className='overflow-x-auto'>
        <div className={cn('min-w-0', view === 'week' ? 'min-w-[980px]' : 'min-w-[680px]')}>
          <div
            className='bg-surface-subtle/70 sticky top-0 z-10 grid border-b backdrop-blur-sm'
            style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div className='border-border/60 border-r' />
            {days.map((day) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className='border-border/60 border-r px-4 py-3 last:border-r-0'
                >
                  <p className='text-muted-foreground text-xs font-medium capitalize'>
                    {format(day, 'EEEE', { locale: es })}
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-lg font-semibold tabular-nums',
                        isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <span className='text-muted-foreground text-xs capitalize'>
                      {format(day, 'MMM', { locale: es })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className='grid'
            style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}
          >
            <div className='relative' style={{ height: totalHeight + ALL_DAY_ROW_PX }}>
              <div className='h-[58px] border-b border-border/60 bg-surface-subtle/45' />
              <div className='relative' style={{ height: totalHeight }}>
                {Array.from({ length: endHour - startHour }, (_, i) => {
                  const hour = startHour + i;
                  return (
                    <div
                      key={hour}
                      className='border-border/60 text-muted-foreground absolute inset-x-0 border-b px-3 pt-2 text-right text-[11px] font-medium tabular-nums'
                      style={{ top: i * hourHeight, height: hourHeight }}
                    >
                      {formatHourLabel(hour)}
                      {[1, 2, 3].map((quarter) => (
                        <span
                          key={quarter}
                          className='pointer-events-none absolute left-[72px] right-0 h-px bg-border/20'
                          style={{ top: quarter * (hourHeight / 4) }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {days.map((day) => {
              const dayEvents = eventsForDay(events, day).filter((event) => !event.allDay);
              const allDayEvents = eventsForDay(events, day).filter((event) => event.allDay);
              return (
                <div
                  key={day.toISOString()}
                  className='border-border/60 relative border-r last:border-r-0'
                >
                  <div className='border-border/60 bg-surface-subtle/45 flex h-[58px] flex-wrap items-center gap-1.5 overflow-hidden border-b px-2 py-1.5'>
                    {allDayEvents.map((event) => {
                      const category = categoryFor(event, categories);
                      return (
                        <button
                          key={event.id}
                          type='button'
                          onClick={() => onOpenEvent(event)}
                          className='min-w-0 max-w-full truncate rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm'
                          style={{
                            backgroundColor: `${category.color}14`,
                            borderColor: `${category.color}35`
                          }}
                          title={event.title}
                        >
                          <span
                            className='mr-1 inline-block size-1.5 rounded-full align-middle'
                            style={{ backgroundColor: category.color }}
                          />
                          {event.title}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    data-calendar-day={format(day, 'yyyy-MM-dd')}
                    className='relative'
                    style={{ height: totalHeight }}
                  >
                    {Array.from({ length: endHour - startHour }, (_, i) => (
                      <button
                        key={i}
                        type='button'
                        aria-label={`Crear evento a las ${String(startHour + i).padStart(2, '0')}:00`}
                        onClick={() =>
                          onCreate(
                            new Date(
                              day.getFullYear(),
                              day.getMonth(),
                              day.getDate(),
                              startHour + i
                            )
                          )
                        }
                        className='hover:bg-primary/[0.035] absolute inset-x-0 border-b text-left transition-colors'
                        style={{ top: i * hourHeight, height: hourHeight }}
                      />
                    ))}

                    {dayEvents.map((event) => {
                      const category = categoryFor(event, categories);
                      const startAt = new Date(event.startAt);
                      const endAt = new Date(event.endAt);
                      const minutesFromStart =
                        startAt.getHours() * 60 + startAt.getMinutes() - startHour * 60;
                      const durationMinutes = Math.max(
                        30,
                        (endAt.getTime() - startAt.getTime()) / 60000
                      );
                      const clampedTop = Math.max(0, (minutesFromStart / 60) * hourHeight);
                      const height = Math.max(34, (durationMinutes / 60) * hourHeight - 6);
                      return (
                        <button
                          key={event.id}
                          type='button'
                          onPointerDown={(pointerEvent) => startDrag(pointerEvent, event)}
                          title='Arrastra para cambiar de hora o día'
                          onClick={() => {
                            if (!suppressClickRef.current) onOpenEvent(event);
                          }}
                          className={cn(
                            'absolute left-1.5 right-1.5 z-10 cursor-grab touch-none overflow-hidden rounded-xl border text-left shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-px hover:shadow-md active:cursor-grabbing',
                            dragPreview?.event.id === event.id && 'opacity-35'
                          )}
                          style={{
                            top: clampedTop,
                            height,
                            backgroundColor: `${category.color}12`,
                            borderColor: `${category.color}35`
                          }}
                        >
                          <span
                            className='absolute inset-y-0 left-0 w-1'
                            style={{ backgroundColor: category.color }}
                          />
                          <span className='flex h-full min-w-0 flex-col px-3 py-2 pl-4'>
                            <span className='truncate text-sm font-semibold'>{event.title}</span>
                            <span className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                              {format(startAt, 'HH:mm')} – {format(endAt, 'HH:mm')}
                            </span>
                            {event.location && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target='_blank'
                                rel='noreferrer'
                                onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                                onClick={(clickEvent) => clickEvent.stopPropagation()}
                                className='mt-0.5 flex min-w-0 items-center gap-1 truncate text-[11px] underline-offset-2 hover:underline'
                              >
                                <Icons.externalLink className='size-3 shrink-0' />
                                <span className='truncate'>{event.location}</span>
                              </a>
                            )}
                          </span>
                        </button>
                      );
                    })}

                    {dragPreview?.dateKey === format(day, 'yyyy-MM-dd') &&
                      (() => {
                        const ghostEvent = dragPreview.event;
                        const ghostCategory = categoryFor(ghostEvent, categories);
                        const ghostStart = new Date(ghostEvent.startAt);
                        const ghostEnd = new Date(ghostEvent.endAt);
                        const ghostDuration = Math.max(
                          15,
                          (ghostEnd.getTime() - ghostStart.getTime()) / 60000
                        );
                        const ghostTop = ((dragPreview.minutes - startHour * 60) / 60) * hourHeight;
                        const ghostHeight = Math.max(34, (ghostDuration / 60) * hourHeight - 6);
                        return (
                          <div
                            className='pointer-events-none absolute left-1.5 right-1.5 z-30 overflow-hidden rounded-xl border border-dashed'
                            style={{
                              top: ghostTop,
                              height: ghostHeight,
                              backgroundColor: `${ghostCategory.color}18`,
                              borderColor: `${ghostCategory.color}65`
                            }}
                          />
                        );
                      })()}

                    {showNow && isSameDay(day, today) && (
                      <div
                        className='pointer-events-none absolute inset-x-0 z-20 flex items-center'
                        style={{ top: nowOffset }}
                      >
                        <span className='bg-primary size-2 rounded-full' />
                        <span className='bg-primary h-[2px] flex-1' />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
    if (!editing && categories.length >= 15) return;
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
          <DialogDescription>
            Personaliza tus categorías de eventos. Máximo 15 colores.
          </DialogDescription>
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
            <Button onClick={save} disabled={!editing && categories.length >= 15}>
              {editing ? 'Guardar' : categories.length >= 15 ? 'Límite alcanzado' : 'Añadir'}
            </Button>
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
