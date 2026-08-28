'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function GreetingHeader() {
  const { data: session } = authClient.useSession();
  const name = session?.user.name?.split(' ')[0] ?? 'de nuevo';

  return (
    <div className='flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between'>
      <div>
        <p className='text-muted-foreground mb-2 text-sm font-medium'>Command Center</p>
        <h1 className='text-3xl font-semibold tracking-tight'>Buenos días, {name}</h1>
        <p className='text-muted-foreground mt-2'>Todo bajo control.</p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' size='sm' type='button'>
          <Icons.add data-icon='inline-start' /> Nuevo cliente
        </Button>
        <Button variant='outline' size='sm' type='button'>
          <Icons.add data-icon='inline-start' /> Nueva tarea
        </Button>
        <Button size='sm' type='button'>
          <Icons.add data-icon='inline-start' /> Evento
        </Button>
      </div>
    </div>
  );
}
