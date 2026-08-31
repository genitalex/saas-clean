'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { authClient } from '@/lib/auth-client';

const AVATAR_STORAGE_KEY = 'profile-avatar-preview';

export function UserNav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [photo, setPhoto] = React.useState<string>();
  const inputRef = React.useRef<HTMLInputElement>(null);

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
      // local preview is optional
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (photo?.startsWith('blob:')) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPhoto(preview);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          try {
            window.localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);
          } catch {
            // Ignore storage limits; the current preview still works.
          }
        }
      };
      reader.readAsDataURL(file);
    } catch {
      // The local blob preview remains available for this session.
    }

    event.target.value = '';
  }

  function removePhoto() {
    if (photo?.startsWith('blob:')) URL.revokeObjectURL(photo);
    setPhoto(undefined);
    try {
      window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      // optional preference
    }
  }

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.replace('/auth/sign-in')
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp,image/gif'
        className='sr-only'
        onChange={handlePhotoChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          className='inline-flex h-10 items-center gap-2 rounded-full px-1.5 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={`Abrir menú de ${name}`}
        >
          <Avatar size='sm'>
            <AvatarImage src={photo ?? session?.user.image ?? undefined} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='hidden max-w-28 truncate text-left text-xs font-medium sm:block'>
            {name}
          </span>
          <Icons.chevronDown className='hidden size-3.5 sm:block' />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' sideOffset={8} className='w-72 rounded-2xl p-2'>
          <DropdownMenuLabel className='px-2 py-2 font-normal'>
            <div className='flex items-center gap-3'>
              <Avatar className='size-11'>
                <AvatarImage src={photo ?? session?.user.image ?? undefined} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold'>{name}</p>
                <p className='truncate text-xs text-muted-foreground'>{email}</p>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => inputRef.current?.click()}>
              <Icons.upload data-icon='inline-start' />
              {photo ? 'Cambiar foto' : 'Añadir foto'}
            </DropdownMenuItem>
            {photo && (
              <DropdownMenuItem onClick={removePhoto}>
                <Icons.trash data-icon='inline-start' />
                Quitar foto
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <Icons.profile data-icon='inline-start' />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Icons.settings data-icon='inline-start' />
              Configuración
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => void handleSignOut()} variant='destructive'>
            <Icons.logout data-icon='inline-start' />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
