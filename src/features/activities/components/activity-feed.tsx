'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getActivities, activityKeys } from '../queries';
import type { GlobalActivity } from '../types';

const activityLabels: Record<GlobalActivity['type'], string> = {
  note: 'Nota',
  call: 'Llamada',
  email: 'Correo',
  status_change: 'Estado',
  system: 'Sistema'
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

function activityIcon(type: GlobalActivity['type']) {
  if (type === 'note') return <Icons.edit className='size-4' />;
  if (type === 'call') return <Icons.phone className='size-4' />;
  if (type === 'email') return <Icons.send className='size-4' />;
  if (type === 'status_change') return <Icons.goals className='size-4' />;
  return <Icons.sparkles className='size-4' />;
}

export default function ActivityFeed() {
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: activityKeys.global(),
    queryFn: getActivities
  });

  if (isLoading) {
    return <ActivityLoading />;
  }

  if (error) {
    return (
      <div className='flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center'>
        <Icons.alertCircle className='text-destructive size-5' />
        <p className='text-sm font-medium'>No se pudo cargar la actividad.</p>
        <Button variant='outline' size='sm' onClick={() => void refetch()} disabled={isFetching}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className='flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 p-8 text-center'>
        <Icons.clock className='text-muted-foreground mb-3 size-6' />
        <p className='font-medium'>Todavía no hay actividad</p>
        <p className='text-muted-foreground mt-1 max-w-sm text-sm'>
          Las acciones importantes de clientes, eventos y tareas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className='overflow-hidden border-y border-border/50'>
      {data.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityRow({ activity }: { activity: GlobalActivity }) {
  return (
    <article className='flex gap-4 border-b border-border/50 px-2 py-4 last:border-0 sm:px-3 sm:py-5'>
      <div className='bg-primary/10 text-primary relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl'>
        {activityIcon(activity.type)}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='font-medium'>{activity.title}</p>
          <Badge variant='secondary'>{activityLabels[activity.type]}</Badge>
        </div>
        <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-2 text-sm'>
          <span>{activity.user?.name || 'Sistema'}</span>
          <span aria-hidden='true'>·</span>
          <time dateTime={new Date(activity.createdAt).toISOString()}>
            {formatDate(new Date(activity.createdAt))}
          </time>
        </div>
        {activity.content && <p className='mt-2 text-sm leading-6'>{activity.content}</p>}
        <div className='mt-3 flex flex-wrap gap-2 text-xs'>
          <Link
            className='text-primary hover:underline'
            href={`/dashboard/customers/${activity.customer.id}`}
          >
            {activity.customer.name}
          </Link>
          {activity.event && (
            <Link
              className='text-muted-foreground hover:text-foreground'
              href={`/dashboard/calendar?event=${activity.event.id}`}
            >
              · {activity.event.title}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function ActivityLoading() {
  return (
    <div className='space-y-px overflow-hidden border-y border-border/50'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className='flex animate-pulse gap-4 border-b border-border/50 px-4 py-5 sm:px-6'
        >
          <div className='bg-muted size-9 shrink-0 rounded-2xl' />
          <div className='flex flex-1 flex-col gap-2'>
            <div className='bg-muted h-4 w-1/2 rounded' />
            <div className='bg-muted h-3 w-1/3 rounded' />
            <div className='bg-muted h-3 w-3/4 rounded' />
          </div>
        </div>
      ))}
    </div>
  );
}
