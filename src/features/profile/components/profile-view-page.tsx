'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfileViewPage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  if (isPending) return <div className='bg-muted m-4 h-64 animate-pulse rounded-xl' />;
  if (!session) return <p className='text-destructive p-6'>No se pudo cargar tu perfil.</p>;

  async function saveProfile() {
    if (!session) return;
    setSaving(true);
    const result = await authClient.updateUser({ name: name.trim() || session.user.name });
    setSaving(false);
    if (result.error) toast.error(result.error.message || 'No se pudo actualizar el perfil');
    else toast.success('Perfil actualizado');
  }

  return (
    <PageContainer
      pageTitle='Perfil'
      pageDescription='Mantén tu información personal y la forma en que trabajas con el equipo.'
      pageHeaderAction={
        <Button variant='outline' size='sm' onClick={saveProfile} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      }
    >
      <div className='grid gap-4 xl:grid-cols-[1.1fr_0.9fr]'>
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <CardDescription>Cuenta</CardDescription>
                <CardTitle>Tu identidad</CardTitle>
              </div>
              <Badge variant='secondary'>Activa</Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3'>
              <div className='flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                {(session.user.name ?? 'A').charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{session.user.name}</p>
                <p className='text-muted-foreground truncate text-xs'>{session.user.email}</p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='grid gap-2 text-sm'>
                <span className='text-muted-foreground'>Nombre</span>
                <Input
                  aria-label='Nombre'
                  defaultValue={session.user.name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className='grid gap-2 text-sm'>
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

        <Card>
          <CardHeader>
            <CardDescription>Workspace</CardDescription>
            <CardTitle>Mi espacio</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Rol</span>
              <strong className='text-sm'>Administrador</strong>
            </div>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Equipo</span>
              <strong className='text-sm'>My Workspace</strong>
            </div>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Idioma</span>
              <strong className='text-sm'>Español</strong>
            </div>
          </CardContent>
        </Card>

        <Card className='xl:col-span-2'>
          <CardHeader>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardDescription>Seguridad</CardDescription>
                <CardTitle>Acceso y privilegios</CardTitle>
              </div>
              <Icons.lock className='text-muted-foreground size-4' />
            </div>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Contraseña</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Actualiza tus credenciales en cualquier momento.
              </p>
            </div>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Sesiones</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Gestiona dóndehas accedido y qué dispositivos tienen conexión.
              </p>
            </div>
            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <p className='text-sm font-medium'>Autenticación</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Las opciones avanzadas viverán aquí cuando el producto lo requiera.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
