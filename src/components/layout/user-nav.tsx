'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { authClient } from '@/lib/auth-client';

const AVATAR_STORAGE_KEY = 'profile-avatar-preview';

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = React.useState(false);
  const [photo, setPhoto] = React.useState<string>();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const name = session?.user.name ?? 'Alex Morgan';
  const email = session?.user.email ?? 'alex@workspace.co';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      if (stored) setPhoto(stored);
    } catch {
      // Optional local avatar preview.
    }
  }, []);

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

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setPhoto(reader.result);
      try {
        window.localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);
      } catch {
        // Optional local preference.
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
      // Optional local preference.
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
        accept='image/png,image/jpeg,image/webp,image/gif'
        className='sr-only'
        onChange={handlePhotoChange}
      />

      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={open}
        aria-label={`Abrir menú de ${name}`}
        onClick={() => setOpen((value) => !value)}
        className='inline-flex h-10 items-center gap-2 rounded-full px-1.5 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <Avatar size='sm'>
          <AvatarImage src={photo ?? session?.user.image ?? undefined} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className='hidden max-w-28 truncate text-left text-xs font-medium sm:block'>
          {name}
        </span>
        <Icons.chevronDown className='hidden size-3.5 sm:block' />
      </button>

      {open && (
        <div
          role='menu'
          className='absolute right-0 top-[calc(100%+8px)] z-50 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border/70 bg-popover p-2 text-popover-foreground shadow-[0_12px_28px_-20px_rgba(15,23,42,0.35)]'
        >
          <div className='flex items-center gap-3 px-3 py-3'>
            <Avatar className='size-11'>
              <AvatarImage src={photo ?? session?.user.image ?? undefined} alt={name} />
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
            [Icons.settings, 'Configuración', () => router.push('/dashboard/settings')]
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
            className='flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors hover:bg-muted/70'
          >
            <Icons.upload className='size-4' />
            {photo ? 'Cambiar foto' : 'Añadir foto'}
          </button>

          {photo && (
            <button
              type='button'
              role='menuitem'
              onClick={removePhoto}
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
