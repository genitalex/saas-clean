'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GreetingHeader } from './greeting-header';
import { TodaySummary } from './today-summary';
import { AttentionPanel } from './attention-panel';
import { UpcomingPanel } from './upcoming-panel';
import { TasksPreview } from './tasks-preview';
import { RecentActivity } from './recent-activity';
import { KanbanPreview } from './kanban-preview';
import { RecentCustomers } from './recent-customers';
import {
  EndOfDayButton,
  PauseButton,
  StartFocusButton
} from '@/features/modes/components/mode-experiences';

const quickLinks = [
  { label: 'Clientes', href: '/dashboard/customers', icon: Icons.user },
  { label: 'Tareas', href: '/dashboard/tasks', icon: Icons.check },
  { label: 'Agenda', href: '/dashboard/calendar', icon: Icons.calendar },
  { label: 'Actividad', href: '/dashboard/activity', icon: Icons.moreHorizontal }
];

export function DashboardHome() {
  return (
    <main className='flex min-w-0 flex-1 flex-col gap-5 pb-8 sm:gap-6'>
      <GreetingHeader />
      <div className='flex min-w-0 flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-muted-foreground text-xs font-medium uppercase tracking-[0.16em]'>
              Vista general
            </p>
            <h2 className='mt-1 text-lg font-semibold tracking-tight'>
              Tu operación, de un vistazo
            </h2>
          </div>
          <Badge variant='outline' className='hidden gap-1.5 sm:flex'>
            <span className='bg-primary size-1.5 rounded-full' /> En marcha
          </Badge>
        </div>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <StartFocusButton />
          <PauseButton />
          <EndOfDayButton />
        </div>
        <nav aria-label='Accesos rápidos' className='flex min-w-0 gap-2 overflow-x-auto pb-1'>
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              variant='outline'
              size='sm'
              className='shrink-0 gap-2 transition-transform hover:-translate-y-0.5'
              nativeButton={false}
              render={<Link href={href} />}
            >
              <Icon data-icon='inline-start' /> {label}
            </Button>
          ))}
        </nav>
      </div>
      <TodaySummary />
      <div className='grid min-w-0 gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
        <div className='grid min-w-0 gap-4 md:grid-cols-2'>
          <AttentionPanel />
          <UpcomingPanel />
          <TasksPreview />
          <RecentActivity />
        </div>
        <Card className='min-w-0 overflow-hidden border-primary/15 shadow-sm transition-shadow hover:shadow-md'>
          <CardHeader className='flex-row items-center justify-between border-b'>
            <div>
              <CardTitle className='text-base'>Ritmo del equipo</CardTitle>
              <p className='text-muted-foreground mt-1 text-xs'>Prioridades y flujo de trabajo</p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              nativeButton={false}
              render={<Link href='/dashboard/kanban' />}
            >
              Abrir tablero <Icons.chevronRight data-icon='inline-end' />
            </Button>
          </CardHeader>
          <CardContent className='p-0'>
            <KanbanPreview />
          </CardContent>
        </Card>
      </div>
      <RecentCustomers />
    </main>
  );
}

export default DashboardHome;
