'use client';

import { useKBar } from 'kbar';
import { Icons } from '@/components/icons';
import { Button } from './ui/button';

export default function SearchInput() {
  const { query } = useKBar();
  return (
    <Button
      type='button'
      variant='ghost'
      onClick={query.toggle}
      aria-label='Abrir búsqueda'
      className='group relative h-10 w-[220px] justify-start rounded-2xl border border-border/60 bg-card/75 px-3 shadow-[0_8px_24px_rgba(23,32,25,0.05)] backdrop-blur-md transition-all hover:border-border hover:bg-card md:w-56 lg:w-64'
    >
      <span className='flex min-w-0 items-center gap-2.5'>
        <Icons.search className='size-4 shrink-0 text-muted-foreground' />
        <span className='truncate text-sm font-normal text-muted-foreground'>Buscar...</span>
      </span>
      <kbd className='bg-muted/70 text-muted-foreground absolute right-2 hidden h-6 items-center gap-0.5 rounded-md border border-border/60 px-1.5 font-mono text-[10px] font-medium sm:flex'>
        <span className='text-xs'>⌘</span>K
      </kbd>
    </Button>
  );
}
