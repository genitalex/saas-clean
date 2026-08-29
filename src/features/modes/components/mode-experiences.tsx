'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useModeStore } from '../store';

export function ModeExperiences() {
  const activeMode = useModeStore((state) => state.activeMode);
  if (!activeMode) return null;
  return (
    <div className='fixed inset-0 z-50 bg-background/95 backdrop-blur-sm'>
      <ModeContent />
    </div>
  );
}

function ModeContent() {
  const mode = useModeStore((state) => state.activeMode);
  if (mode === 'focus') return <FocusMode />;
  if (mode === 'pause') return <PauseMode />;
  return <EndOfDay />;
}

function ModeChrome({
  children,
  eyebrow,
  title,
  description
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const clearMode = useModeStore((state) => state.clearMode);
  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6 sm:px-8 sm:py-10'>
      <header className='flex items-center justify-between'>
        <Link href='/dashboard/overview' className='flex items-center gap-2 text-sm font-semibold'>
          <span className='bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg'>
            <Icons.logo />
          </span>
          comando
        </Link>
        <Button variant='ghost' size='sm' onClick={clearMode}>
          Salir
        </Button>
      </header>
      <div className='flex flex-1 flex-col justify-center gap-8 py-12'>
        <div className='flex flex-col gap-3'>
          <p className='text-primary text-xs font-semibold tracking-[0.18em] uppercase'>
            {eyebrow}
          </p>
          <h1 className='text-balance text-3xl font-semibold tracking-tight sm:text-5xl'>
            {title}
          </h1>
          <p className='text-muted-foreground max-w-xl text-base leading-7'>{description}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

function FocusMode() {
  const {
    focusTaskTitle,
    focusTaskCustomer,
    focusTaskDueTime,
    focusPriority,
    focusTaskId,
    setFocusTaskId,
    clearMode
  } = useModeStore();
  const [done, setDone] = useState(false);
  const title = focusTaskTitle ?? 'Revisar los seguimientos prioritarios';
  return (
    <ModeChrome
      eyebrow='Modo foco'
      title={done ? 'Buen trabajo, ya está.' : title}
      description={
        done
          ? 'El siguiente paso queda listo para tu cierre del día.'
          : 'Una sola tarea. Sin ruido. Avanza con el siguiente movimiento que hace progresar el negocio.'
      }
    >
      <Card className='border-primary/20 shadow-md'>
        <CardHeader>
          <CardDescription>
            {focusTaskCustomer ?? 'Cliente prioritario'}
            {focusTaskDueTime ? ` · ${focusTaskDueTime}` : ''}
          </CardDescription>
          <CardTitle className='flex items-center gap-2'>
            {focusPriority && <Icons.warning className='text-primary' />}{' '}
            {done ? 'Completado' : 'En progreso'}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-5'>
          <Progress value={done ? 100 : 42} />
          <div className='flex flex-col gap-3 sm:flex-row'>
            {!done && (
              <Button onClick={() => setDone(true)}>
                <Icons.check data-icon='inline-start' />
                Marcar como hecho
              </Button>
            )}
            {focusTaskId && !done && (
              <Button variant='outline' onClick={() => setFocusTaskId(null)}>
                Cambiar tarea
              </Button>
            )}
            {done && <Button onClick={clearMode}>Volver al centro</Button>}
          </div>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

function PauseMode() {
  const { pauseTimeRemaining, setPauseTimeRemaining, clearMode } = useModeStore();
  useEffect(() => {
    if (pauseTimeRemaining <= 0) return;
    const timer = window.setInterval(
      () => setPauseTimeRemaining(Math.max(0, pauseTimeRemaining - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [pauseTimeRemaining, setPauseTimeRemaining]);
  const time = useMemo(
    () =>
      `${Math.floor(pauseTimeRemaining / 60)
        .toString()
        .padStart(2, '0')}:${(pauseTimeRemaining % 60).toString().padStart(2, '0')}`,
    [pauseTimeRemaining]
  );
  return (
    <ModeChrome
      eyebrow='Pausa'
      title='Haz espacio para pensar.'
      description='Tu tablero está en pausa. Respira, aléjate un momento y vuelve cuando estés listo.'
    >
      <Card>
        <CardContent className='flex flex-col items-center gap-6 py-10 text-center'>
          <span className='text-6xl font-semibold tabular-nums tracking-tight'>{time}</span>
          <Separator />
          <p className='text-muted-foreground text-sm'>
            {pauseTimeRemaining === 0
              ? 'La pausa terminó.'
              : 'El centro volverá a estar listo cuando termine el temporizador.'}
          </p>
          <Button variant='outline' onClick={clearMode}>
            Volver antes
          </Button>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

function EndOfDay() {
  const clearMode = useModeStore((state) => state.clearMode);
  return (
    <ModeChrome
      eyebrow='Cierre del día'
      title='Deja mañana más claro.'
      description='Un cierre breve para que tu atención descanse y tus próximos pasos queden visibles.'
    >
      <Card>
        <CardHeader>
          <CardTitle>Resumen rápido</CardTitle>
          <CardDescription>Tu operación queda preparada para continuar.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {[
            '3 seguimientos quedan para mañana',
            '2 oportunidades avanzaron hoy',
            '1 cliente necesita atención'
          ].map((item) => (
            <div key={item} className='flex items-center gap-3 rounded-lg border p-3 text-sm'>
              <Icons.check className='text-primary' />
              {item}
            </div>
          ))}
          <Button className='mt-2' onClick={clearMode}>
            Cerrar y volver al centro
          </Button>
        </CardContent>
      </Card>
    </ModeChrome>
  );
}

export function StartFocusButton({
  taskId = 'priority',
  title = 'Revisar los seguimientos prioritarios',
  customer = 'Centro de mando',
  dueTime = 'Hoy',
  priority = 'Alta'
}: {
  taskId?: string;
  title?: string;
  customer?: string;
  dueTime?: string;
  priority?: string;
}) {
  const setFocusMode = useModeStore((state) => state.setFocusMode);
  return (
    <Button size='sm' onClick={() => setFocusMode(taskId, title, customer, dueTime, priority)}>
      <Icons.sparkles data-icon='inline-start' />
      Empezar foco
    </Button>
  );
}

export function PauseButton() {
  const setPauseMode = useModeStore((state) => state.setPauseMode);
  return (
    <Button variant='outline' size='sm' onClick={() => setPauseMode(300)}>
      <Icons.clock data-icon='inline-start' />
      Pausa 5 min
    </Button>
  );
}

export function EndOfDayButton() {
  const setEndOfDayMode = useModeStore((state) => state.setEndOfDayMode);
  return (
    <Button variant='ghost' size='sm' onClick={setEndOfDayMode}>
      Cerrar el día
    </Button>
  );
}
