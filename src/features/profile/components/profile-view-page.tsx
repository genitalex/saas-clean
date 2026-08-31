'use client';

import { useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

const AVATAR_STORAGE_KEY = 'profile-avatar-preview';

export default function ProfileViewPage() {
  const { data: session, isPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) return;
    setName(session.user.name ?? '');
    try {
      const stored = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      if (stored) setPhoto(stored);
    } catch {
      // optional local preference
    }
  }, [session]);

  if (isPending) {
    return <div className='m-4 h-72 animate-pulse rounded-2xl bg-muted md:m-6' />;
  }

  if (!session) {
    return (
      <div className='p-6'>
        <p className='text-destructive'>No se ha podido cargar tu perfil.</p>
      </div>
    );
  }

  const displayName = name.trim() || session.user.name || 'Alex Morgan';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function saveProfile() {
    setSaving(true);
    try {
      const result = await authClient.updateUser({ name: displayName });
      if (result.error) {
        toast.error(result.error.message || 'No se pudo actualizar el perfil.');
        return;
      }
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setPhoto(reader.result);
      try {
        window.localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);
      } catch {
        toast.error('La foto es demasiado grande para guardarla localmente.');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function removePhoto() {
    setPhoto(undefined);
    try {
      window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      // optional local preference
    }
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-8'>
      <div>
        <p className='text-sm font-medium text-primary'>Cuenta</p>
        <h1 className='mt-1 text-3xl font-semibold tracking-tight'>Perfil</h1>
        <p className='mt-2 text-muted-foreground'>
          Gestiona tus datos personales y cómo apareces en el espacio de trabajo.
        </p>
      </div>

      <section className='overflow-hidden rounded-3xl border bg-card'>
        <div className='flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6'>
          <Avatar className='size-20 shrink-0'>
            <AvatarImage src={photo ?? session.user.image ?? undefined} alt={displayName} />
            <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='text-lg font-semibold'>{displayName}</p>
            <p className='mt-1 truncate text-sm text-muted-foreground'>{session.user.email}</p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Button type='button' variant='outline' onClick={() => fileRef.current?.click()}>
                <Icons.upload className='size-4' />
                {photo ? 'Cambiar foto' : 'Añadir foto'}
              </Button>
              {photo && (
                <Button type='button' variant='ghost' onClick={removePhoto}>
                  Quitar
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type='file'
              accept='image/png,image/jpeg,image/webp,image/gif'
              className='sr-only'
              onChange={selectPhoto}
            />
          </div>
        </div>
      </section>

      <section className='rounded-3xl border bg-card p-5 md:p-6'>
        <div>
          <h2 className='font-semibold'>Información personal</h2>
          <p className='mt-1 text-sm text-muted-foreground'>Estos datos se guardan en tu cuenta.</p>
        </div>

        <div className='mt-6 grid gap-5'>
          <label className='grid gap-2 text-sm font-medium'>
            Nombre
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          </label>

          <label className='grid gap-2 text-sm font-medium'>
            Email
            <Input value={session.user.email} readOnly className='bg-muted/50' />
          </label>
        </div>

        <div className='mt-6 flex justify-end'>
          <Button type='button' onClick={() => void saveProfile()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </section>

      <section className='rounded-3xl border bg-card p-5 md:p-6'>
        <h2 className='font-semibold'>Seguridad</h2>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>
          Las opciones avanzadas de seguridad pueden añadirse aquí sin romper el flujo de
          autenticación existente.
        </p>
      </section>
    </div>
  );
}
