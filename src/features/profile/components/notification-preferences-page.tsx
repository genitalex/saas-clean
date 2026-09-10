'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

const GROUPS = [
  {
    title: 'Tareas',
    items: [
      [
        'taskAssigned',
        'Cuando me asignen una tarea',
        'Recibe un aviso cuando alguien te asigne trabajo.'
      ],
      [
        'taskStatusChanged',
        'Cuando cambie una tarea del equipo',
        'Sabrás cuando alguien mueva o complete una tarea relevante.'
      ],
      ['taskOverdue', 'Tareas vencidas', 'Avisos cuando una tarea pase de su fecha límite.'],
      [
        'taskBlocked',
        'Tareas bloqueadas',
        'Avisos cuando una tarea quede bloqueada o pueda continuar.'
      ],
      [
        'followUpOverdue',
        'Seguimientos vencidos',
        'Avisos cuando un seguimiento pase su fecha límite.'
      ],
      [
        'waitingReady',
        'Esperas que se desbloquean',
        'Avisos cuando una tarea en espera pueda retomarse.'
      ]
    ]
  },
  {
    title: 'Equipo',
    items: [
      [
        'teamMemberJoined',
        'Cuando se una alguien al espacio',
        'Un aviso cuando una invitación se convierta en miembro.'
      ],
      [
        'automationExecuted',
        'Automatizaciones',
        'Resultados importantes de automatizaciones del espacio.'
      ]
    ]
  },
  {
    title: 'Clientes y calendario',
    items: [
      [
        'customerUpdated',
        'Actividad de clientes',
        'Cambios relevantes realizados por otras personas.'
      ],
      ['eventUpdated', 'Cambios de calendario', 'Cuando alguien te asigna o modifica un evento.'],
      [
        'opportunityUpdated',
        'Actividad de oportunidades',
        'Cuando alguien avanza o cierra una oportunidad.'
      ],
      ['eventImportant', 'Eventos importantes', 'Avisos marcados como importantes.']
    ]
  }
] as const;

type PreferenceKey = (typeof GROUPS)[number]['items'][number][0];

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/notification-preferences', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudieron cargar las preferencias');
      return response.json() as Promise<Record<string, boolean>>;
    }
  });

  useEffect(() => {
    if (data) setPreferences(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (next: Record<string, boolean>) => {
      const response = await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      if (!response.ok) throw new Error('No se pudieron guardar las preferencias');
      return response.json();
    },
    onSuccess: (next) => {
      setPreferences(next);
      queryClient.setQueryData(['notification-preferences'], next);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  function toggle(key: PreferenceKey, checked: boolean) {
    const next = { ...preferences, [key]: checked };
    setPreferences(next);
    mutation.mutate(next);
  }

  return (
    <PageContainer
      pageTitle='Notificaciones'
      pageDescription='Elige qué quieres recibir. Sin ruido innecesario.'
    >
      <div className='mb-5'>
        <Link
          href='/dashboard/profile'
          className='text-muted-foreground inline-flex items-center gap-2 text-sm hover:text-foreground'
        >
          <Icons.chevronLeft className='size-4' />
          Volver al perfil
        </Link>
      </div>
      <div className='space-y-4'>
        {GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className='text-base'>{group.title}</CardTitle>
              <CardDescription>Decide qué merece interrumpirte.</CardDescription>
            </CardHeader>
            <CardContent className='divide-y'>
              {group.items.map(([key, title, description]) => (
                <div
                  key={key}
                  className='flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0'
                >
                  <div className='min-w-0'>
                    <p className='text-sm font-medium'>{title}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>{description}</p>
                  </div>
                  <Switch
                    checked={preferences[key] ?? true}
                    onCheckedChange={(checked) => toggle(key, checked)}
                    disabled={isLoading || mutation.isPending}
                    aria-label={title}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
