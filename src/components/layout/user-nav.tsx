'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { useRouter } from 'next/navigation';

export function UserNav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [photo, setPhoto] = React.useState<string>();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const name = session?.user.name ?? 'Alex Morgan';
  const email = session?.user.email ?? 'alex@workspace.co';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='sr-only'
        onChange={handlePhotoChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger className='inline-flex items-center gap-2 h-auto px-1.5 py-1.5 text-sm font-medium hover:bg-accent rounded-md transition-colors'>
          <Avatar size='sm'>
            <AvatarImage src={photo} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className='hidden max-w-28 truncate text-left text-xs font-medium sm:block'>
            {name}
          </span>
          <Icons.chevronDown className='hidden size-3.5 sm:block' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-64'>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarImage src={photo} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{name}</p>
                <p className='text-muted-foreground truncate text-xs'>{email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => inputRef.current?.click()}>
              <Icons.upload data-icon='inline-start' /> {photo ? 'Reemplazar foto' : 'Añadir foto'}
            </DropdownMenuItem>
            {photo && (
              <DropdownMenuItem onClick={() => setPhoto(undefined)}>
                <Icons.trash data-icon='inline-start' /> Quitar foto
              </DropdownMenuItem>
            )}
            <DropdownMenuItem render={<Link href='/dashboard/profile' />}>
              <Icons.profile data-icon='inline-start' /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href='/dashboard/settings' />}>
              <Icons.settings data-icon='inline-start' /> Configuración
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              void authClient.signOut({
                fetchOptions: { onSuccess: () => router.push('/auth/sign-in') }
              })
            }
          >
            <Icons.logout data-icon='inline-start' /> Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
