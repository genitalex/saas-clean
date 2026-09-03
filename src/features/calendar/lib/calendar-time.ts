import { format } from 'date-fns';

export const CALENDAR_SNAP_MINUTES = 15;

export function minutesFromDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, 'yyyy-MM-dd');
}

export function localDateAtMinutes(day: Date | string, minutes: number) {
  const date = day instanceof Date ? new Date(day) : new Date(`${day}T00:00:00`);
  date.setHours(0, minutes, 0, 0);
  return date;
}

export function snapMinutes(minutes: number, step = CALENDAR_SNAP_MINUTES) {
  return Math.round(minutes / step) * step;
}
