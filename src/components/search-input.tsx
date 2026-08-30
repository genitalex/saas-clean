'use client';
import { useKBar } from 'kbar';
import { Icons } from '@/components/icons';
import { Button } from './ui/button';

export default function SearchInput() {
  const { query } = useKBar();
  return (
    <div className='w-full space-y-2'>
      <Button
        variant='outline'
        className='bg-surface-subtle text-muted-foreground hover:bg-accent/60 relative h-9 w-full justify-start rounded-lg border-transparent text-sm font-normal shadow-none transition-colors sm:pr-12 md:w-44 lg:w-64'
        onClick={query.toggle}
      >
        <Icons.search className='mr-2 h-4 w-4' />
        Search...
        <kbd className='bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-6 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </Button>
    </div>
  );
}
