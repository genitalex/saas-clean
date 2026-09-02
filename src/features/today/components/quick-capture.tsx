'use client';

import { useState } from 'react';
import {
  addDays,
  nextFriday,
  nextMonday,
  nextThursday,
  nextTuesday,
  nextWednesday
} from 'date-fns';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createEvent } from '@/features/calendar/queries';
import { createTask, taskKeys } from '@/features/tasks/queries';
import { useQueryClient } from '@tanstack/react-query';

type CaptureType = 'task' | 'event';

function findDate(text: string, now: Date) {
  const normalized = text.toLocaleLowerCase();
  if (normalized.includes('mañana')) return addDays(now, 1);
  if (normalized.includes('lunes')) return nextMonday(now);
  if (normalized.includes('martes')) return nextTuesday(now);
  if (normalized.includes('miércoles') || normalized.includes('miercoles'))
    return nextWednesday(now);
  if (normalized.includes('jueves')) return nextThursday(now);
  if (normalized.includes('viernes')) return nextFriday(now);
  return now;
}

function parseCapture(text: string): {
  type: CaptureType;
  title: string;
  date: Date;
  hour: number;
} {
  const type = /reunión|reunion|evento|cita/i.test(text) ? 'event' : 'task';
  const date = findDate(text, new Date());
  const timeMatch = text.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\b/);
  const hour = timeMatch ? Number(timeMatch[1]) : 9;
  const title = text
    .replace(/reunión|reunion|evento|cita/gi, '')
    .replace(/mañana|lunes|martes|miércoles|miercoles|jueves|viernes/gi, '')
    .replace(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { type, title: title || 'Nueva captura', date, hour };
}

export function QuickCapture() {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);

  async function matchCustomerId(text: string) {
    const filteredWords = text
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ\s]/g, ''))
      .filter(Boolean)
      .slice(0, 3)
      .join(' ');

    if (!filteredWords) return null;

    const response = await fetch(`/api/customers?search=${encodeURIComponent(filteredWords)}`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;

    const customers = (await response.json()) as Array<{ id: string; name: string }>;
    const normalizedText = text.toLowerCase();
    const match = customers.find((customer) =>
      normalizedText.includes(customer.name.toLowerCase())
    );
    return match?.id ?? null;
  }

  async function submit() {
    if (!value.trim()) return;
    const capture = parseCapture(value.trim());
    const start = new Date(capture.date);
    start.setHours(capture.hour, 0, 0, 0);
    const customerId = await matchCustomerId(value.trim());

    try {
      setPending(true);
      if (capture.type === 'event') {
        await createEvent({
          title: capture.title,
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
          customerId
        });
        toast.success('Evento creado');
      } else {
        await createTask({ title: capture.title, dueAt: start.toISOString(), customerId });
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.success('Tarea creada');
      }
      setValue('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la captura.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className='border-primary/15 bg-primary/[0.035] rounded-[26px] border p-4 sm:p-5'
      aria-label='Captura rápida'
    >
      <div className='flex items-center gap-2'>
        <span className='bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl'>
          <Icons.add className='size-4' />
        </span>
        <div>
          <p className='text-sm font-semibold'>Captura rápida</p>
          <p className='text-muted-foreground text-xs'>
            Escribe una tarea o reunión y sigue trabajando.
          </p>
        </div>
      </div>
      <div className='mt-3 flex gap-2'>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && void submit()}
          placeholder='llamar a Ana mañana · reunión con Acme jueves 10'
          aria-label='Nueva captura de trabajo'
          className='h-11 rounded-2xl bg-background/70'
        />
        <Button
          type='button'
          size='icon'
          onClick={() => void submit()}
          disabled={pending || !value.trim()}
          aria-label='Guardar captura'
        >
          <Icons.arrowRight className='size-4' />
        </Button>
      </div>
    </section>
  );
}
