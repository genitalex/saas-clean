'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';

function useOrganizationContext() {
  return useQuery<{
    organization: {
      id: string;
      name: string;
      plan: 'solo' | 'team';
      seatLimit: number;
      industry: string | null;
      teamSize: number | null;
      mainUseCase: string | null;
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

  if (isPending) return <div className='bg-muted m-4 h-64 animate-pulse rounded-xl' />;
  if (!session) return <p className='text-destructive p-6'>No se pudo cargar tu perfil.</p>;

  async function saveProfile() {
    setSaving(true);
    const result = await authClient.updateUser({ name: name.trim() || session.user.name });
    setSaving(false);

    if (result.error) {
      toast.error(result.error.message || 'No se pudo actualizar el perfil');
      return;
    }

    toast.success('Perfil actualizado');
  }

  const roleLabel = context?.user.role === 'owner' ? 'Propietario' : 'Empleado';
  const planLabel = context?.organization.plan === 'team' ? 'Equipo' : 'Autónomo';
  const isOwner = context?.user.role === 'owner';
  const isTeam = context?.organization.plan === 'team';

  return (
    <main className='flex min-w-0 flex-1 flex-col gap-5 py-2 pb-20 md:pb-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold tracking-tight'>Perfil</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Tu cuenta y tus preferencias personales.
          </p>
        </div>
        <Button
          className='w-full sm:w-auto'
          variant='outline'
          size='sm'
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>

      <div className='grid min-w-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]'>
        <Card className='min-w-0'>
          <CardHeader>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0'>
                <CardDescription>Cuenta</CardDescription>
                <CardTitle>Tu identidad</CardTitle>
              </div>
              <Badge variant='secondary'>Activa</Badge>
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
            <CardTitle className='truncate'>{context?.organization.name ?? 'Mi espacio'}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Rol</span>
              <strong className='text-right text-sm'>{roleLabel}</strong>
            </div>
            <div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Plan</span>
              <strong className='text-right text-sm'>{planLabel}</strong>
            </div>
            <div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-muted-foreground text-sm'>Miembros</span>
              <strong className='text-right text-sm'>
                {context?.organization.memberCount ?? 1}/{context?.organization.seatLimit ?? 1}
              </strong>
            </div>
          </CardContent>
        </Card>

        <Card className='min-w-0 xl:col-span-2'>
          <CardHeader>
            <CardDescription>Preferencias personales</CardDescription>
            <CardTitle>Cómo quieres trabajar</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Notificaciones</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Controla tus avisos y recordatorios.
              </p>
            </div>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Apariencia</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Tema, densidad y preferencias visuales.
              </p>
            </div>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Acceso</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Contraseña y sesiones de tu cuenta.
              </p>
            </div>
          </CardContent>
        </Card>

        {isOwner && isTeam && (
          <Card className='min-w-0 xl:col-span-2'>
            <CardHeader>
              <CardDescription>Organización</CardDescription>
              <CardTitle>Equipo</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-3 md:grid-cols-2'>
              <div className='rounded-2xl border border-border/60 bg-background/60 p-4'>
                <p className='text-sm font-medium'>Equipo y usuarios</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Gestiona quién forma parte del espacio y consulta su trabajo.
                </p>
                <Button asChild className='mt-3 w-full sm:w-auto' variant='outline' size='sm'>
                  <Link href='/dashboard/team'>Gestionar equipo</Link>
                </Button>
              </div>
              <div className='rounded-2xl border border-border/60 bg-background/60 p-4'>
                <p className='text-sm font-medium'>Capacidad</p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  Tienes {context?.organization.memberCount ?? 0} de{' '}
                  {context?.organization.seatLimit ?? 0} plazas ocupadas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && !isTeam && (
          <Card className='min-w-0 xl:col-span-2'>
            <CardHeader>
              <CardDescription>Organización</CardDescription>
              <CardTitle>Plan Autónomo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground text-sm'>
                Este espacio está configurado para una sola persona. Cuando quieras trabajar con
                empleados, podrás pasar a un plan de Equipo sin cambiar tu forma de trabajar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
