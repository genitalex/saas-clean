import { Icons } from '@/components/icons';

export default function CtaGithub() {
  return (
    <a
      href='https://github.com/Kiranism/next-shadcn-dashboard-starter'
      target='_blank'
      rel='noopener noreferrer'
      aria-label='View on GitHub'
      className='group hidden h-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] px-2.5 text-muted-foreground transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex'
    >
      <Icons.github className='size-3.5 transition-transform duration-300 group-hover:animate-bounce' />
    </a>
  );
}
