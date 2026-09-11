'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const MAX_PROFILE_IMAGE_BYTES = 1_000_000;
const MAX_PROFILE_IMAGE_WIDTH = 512;
const MAX_PROFILE_IMAGE_HEIGHT = 512;

function processProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer la imagen.'));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error('La imagen no es válida.'));
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_PROFILE_IMAGE_WIDTH / image.width,
          MAX_PROFILE_IMAGE_HEIGHT / image.height
        );
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.88);
        const fallback = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl.length <= 1_350_000 ? dataUrl : fallback);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export function UserNav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = React.useState(false);
  const [savingPhoto, setSavingPhoto] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const name = session?.user.name ?? 'Alex Morgan';
  const email = session?.user.email ?? 'alex@workspace.co';
  const { data: organizationContext } = useQuery<{ user: { role: 'owner' | 'member' } }>({
    queryKey: ['organization-context', 'user-nav'],
    queryFn: async () => {
      const response = await fetch('/api/organization-context', { cache: 'no-store' });
      if (!response.ok) throw new Error('Organization context unavailable');
      return response.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: Boolean(session)
  });

  const isOwner = organizationContext?.user.role === 'owner';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      toast.error('La foto debe ser PNG, JPG/JPEG o WEBP.');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      toast.error('La foto de perfil debe pesar menos de 1 MB.');
      return;
    }

    setSavingPhoto(true);

    try {
      const imageData = await processProfileImage(file);
      const result = await authClient.updateUser({ image: imageData });

      if (result.error) {
        toast.error(result.error.message || 'No se pudo guardar la foto');
      } else {
        toast.success('Foto de perfil actualizada');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la foto');
    } finally {
      setSavingPhoto(false);
    }
  }

  async function removePhoto() {
    setSavingPhoto(true);
    const result = await authClient.updateUser({ image: null });
    setSavingPhoto(false);
    if (result.error) {
      toast.error(result.error.message || 'No se pudo quitar la foto');
    } else {
      toast.success('Foto de perfil eliminada');
    }
  }

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.replace('/auth/sign-in') }
    });
  }

  return (
    <div ref={rootRef} className='relative'>
      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        className='sr-only'
        onChange={handlePhotoChange}
      />

      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={open}
        aria-label={`Abrir menú de ${name}`}
        onClick={() => setOpen((value) => !value)}
        className='inline-flex h-10 max-w-full items-center gap-1 rounded-full border-0 bg-transparent p-0 shadow-none transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Avatar className='size-9 shrink-0'>
          <AvatarImage src={session?.user.image ?? undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Icons.chevronDown className='size-3.5 shrink-0' />
      </button>

      {open && (
        <div
          role='menu'
          className='absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border/70 bg-popover p-2 text-popover-foreground shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]'
        >
          <div className='flex items-center gap-3 px-3 py-3'>
            <Avatar className='size-11'>
              <AvatarImage src={session?.user.image ?? undefined} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{name}</p>
              <p className='truncate text-xs text-muted-foreground'>{email}</p>
            </div>
          </div>

          <div className='my-1 h-px bg-border' />

          {[
            [Icons.profile, 'Perfil', () => router.push('/dashboard/profile')],
            ...(isOwner
              ? [[Icons.settings, 'Configuración', () => router.push('/dashboard/settings')]]
              : [])
          ].map(([Icon, label, action]) => (
            <button
              key={label as string}
              type='button'
              role='menuitem'
              onClick={() => {
                setOpen(false);
                (action as () => void)();
              }}
              className='flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted/70'
            >
              {React.createElement(Icon as React.ElementType, { className: 'size-4' })}
              {label as string}
            </button>
          ))}

          <button
            type='button'
            role='menuitem'
            onClick={() => inputRef.current?.click()}
            disabled={savingPhoto}
            className='flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted/70'
          >
            <Icons.upload className='size-4' />
            {savingPhoto
              ? 'Guardando foto...'
              : session?.user.image
                ? 'Cambiar foto'
                : 'Añadir foto'}
          </button>

          {session?.user.image && (
            <button
              type='button'
              role='menuitem'
              onClick={() => void removePhoto()}
              disabled={savingPhoto}
              className='flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground'
            >
              <Icons.trash className='size-4' />
              Quitar foto
            </button>
          )}

          <div className='my-1 h-px bg-border' />

          <button
            type='button'
            role='menuitem'
            onClick={() => void handleSignOut()}
            className='flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10'
          >
            <Icons.logout className='size-4' />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
