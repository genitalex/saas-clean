'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PageContainer from '@/components/layout/page-container';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

function useOrganizationContext() {
  return useQuery<{
    organization: {
      id: string;
      name: string;
      plan: 'solo' | 'team';
      seatLimit: number;
      memberCount: number;
    };
    user: { id: string; role: 'owner' | 'member' };
  }>({
    queryKey: ['organization-context', 'profile'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el contexto');
      return response.json();
    },
    staleTime: 30_000
  });
}

export default function ProfileViewPage() {
  const { data: session, isPending } = authClient.useSession();
  const { data: context } = useOrganizationContext();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  if (isPending)
    return (
      <div className='bg-muted mx-auto my-6 h-64 w-full max-w-[var(--page-max-width)] animate-pulse rounded-xl' />
    );
  if (!session) return <p className='text-destructive px-4 py-6'>No se pudo cargar tu perfil.</p>;

  async function saveProfile() {
    setSaving(true);
    try {
      const result = await authClient.updateUser({
        name: name.trim() || session.user.name
      });
      if (result.error) toast.error(result.error.message || 'No se pudo actualizar el perfil');
      else toast.success('Perfil actualizado');
    } finally {
      setSaving(false);
    }
  }

  const roleLabel = context?.user.role === 'owner' ? 'Propietario' : 'Empleado';
  const planLabel = context?.organization.plan === 'team' ? 'Equipo' : 'Autónomo';
  const isOwner = context?.user.role === 'owner';
  const organization = context?.organization;

  return (
    <PageContainer
      pageTitle='Perfil'
      pageDescription='Tu cuenta y tus preferencias personales.'
      pageHeaderAction={
        <Button variant='outline' size='sm' onClick={saveProfile} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      }
    >
      <div className='grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'>
        <Card className='min-w-0'>
          <CardHeader>
            <div className='flex min-w-0 items-start justify-between gap-3'>
              <div className='min-w-0'>
                <CardDescription>Cuenta</CardDescription>
                <CardTitle>Tu identidad</CardTitle>
              </div>
              <Badge variant='secondary' className='shrink-0'>
                Activa
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                {(session.user.name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{session.user.name}</p>
                <p className='text-muted-foreground truncate text-xs'>{session.user.email}</p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='grid min-w-0 gap-2 text-sm'>
                <span className='text-muted-foreground'>Nombre</span>
                <Input
                  aria-label='Nombre'
                  defaultValue={session.user.name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className='grid min-w-0 gap-2 text-sm'>
                <span className='text-muted-foreground'>Correo</span>
                <Input
                  aria-label='Correo'
                  value={session.user.email}
                  readOnly
                  className='bg-muted'
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className='min-w-0'>
          <CardHeader>
            <CardDescription>Espacio de trabajo</CardDescription>
            <CardTitle className='truncate'>{organization?.name ?? 'Mi espacio'}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Rol</span>
              <strong className='shrink-0 text-sm'>{roleLabel}</strong>
            </div>
            <div className='flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Plan</span>
              <strong className='shrink-0 text-sm'>{planLabel}</strong>
            </div>
            <div className='flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Miembros</span>
              <strong className='shrink-0 text-sm'>
                {organization?.memberCount ?? 1}/{organization?.seatLimit ?? 1}
              </strong>
            </div>
          </CardContent>
        </Card>

        <Card className='min-w-0 lg:col-span-2'>
          <CardHeader>
            <CardDescription>Preferencias personales</CardDescription>
            <CardTitle>Cómo quieres trabajar</CardTitle>
          </CardHeader>
          <CardContent className='grid min-w-0 gap-3 md:grid-cols-3'>
            <div className='min-w-0 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Notificaciones</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Controla tus avisos y recordatorios.
              </p>
            </div>
            <div className='min-w-0 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Apariencia</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Tema, densidad y preferencias visuales.
              </p>
            </div>
            <div className='min-w-0 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Acceso</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Contraseña y sesiones de tu cuenta.
              </p>
            </div>
          </CardContent>
        </Card>

        {isOwner && organization?.plan === 'team' && (
          <Card className='min-w-0 lg:col-span-2'>
            <CardHeader>
              <CardDescription>Organización</CardDescription>
              <CardTitle>Equipo</CardTitle>
            </CardHeader>
            <CardContent className='grid min-w-0 gap-3 md:grid-cols-2'>
              <div className='min-w-0 rounded-2xl border border-border/60 bg-background/60 p-4'>
                <p className='text-sm font-medium'>Equipo y usuarios</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Gestiona quién forma parte del espacio y su trabajo.
                </p>
                <Button className='mt-3' variant='outline' size='sm' asChild>
                  <a href='/dashboard/team'>Gestionar equipo</a>
                </Button>
              </div>
              <div className='min-w-0 rounded-2xl border border-border/60 bg-background/60 p-4'>
                <p className='text-sm font-medium'>Capacidad</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Tienes {organization.memberCount} de {organization.seatLimit} plazas ocupadas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && organization?.plan === 'solo' && (
          <Card className='min-w-0 lg:col-span-2'>
            <CardHeader>
              <CardDescription>Organización</CardDescription>
              <CardTitle>Plan Autónomo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-sm'>
                Este espacio está configurado para una sola persona. Cuando quieras trabajar con
                empleados, el espacio podrá pasar a un plan de Equipo sin cambiar tu forma de
                trabajar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
