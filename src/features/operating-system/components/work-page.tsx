'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/features/kanban/components/kanban-board';
import { InboxPage } from '@/features/inbox/components/inbox-page';
import { TaskListPage } from '@/features/tasks/components/task-list-page';
import NewTaskDialog from '@/features/kanban/components/new-task-dialog';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { OperatingSystemPage } from './operating-system';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';

const views = ['all', 'inbox', 'waiting', 'follow-ups', 'completed'] as const;
type WorkView = (typeof views)[number];

const legacyViewMap: Record<string, WorkView> = {
  inbox: 'inbox',
  waiting: 'waiting',
  'follow-ups': 'follow-ups',
  completed: 'completed'
};

const viewLabels: Record<WorkView, string> = {
  all: 'Todo el trabajo',
  inbox: 'Sin organizar',
  waiting: 'Waiting',
  'follow-ups': 'Follow-ups',
  completed: 'Completadas'
};

export function WorkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedMode = searchParams.get('mode') ?? 'board';
  const activeMode = requestedMode === 'board' ? 'board' : 'list';
  const requestedView = searchParams.get('view');
  const activeView = views.includes(requestedView as WorkView)
    ? (requestedView as WorkView)
    : (legacyViewMap[requestedMode] ?? 'all');
  const showBoard = activeMode === 'board' && activeView === 'all';

  const changeView = (view: WorkView) => {
    router.push(`/dashboard/my-work?mode=list${view === 'all' ? '' : `&view=${view}`}`);
  };

  return (
    <main className='mx-auto flex min-w-0 w-full max-w-[var(--page-max-width)] flex-1 flex-col gap-[var(--section-gap)] px-[var(--page-padding)] pt-5 pb-10 md:pt-7'>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Trabajo</h1>
        </div>
        <NewTaskDialog initialOpen={searchParams.get('create') === '1'} />
      </header>

      <div className='flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between'>
        <SegmentedToggle
          options={['Kanban', 'Lista']}
          value={showBoard ? 'Kanban' : 'Lista'}
          onValueChange={(next) => {
            if (next === 'Kanban') router.push('/dashboard/my-work?mode=board');
            else
              router.push(
                `/dashboard/my-work?mode=list${activeView === 'all' ? '' : `&view=${activeView}`}`
              );
          }}
          aria-label='Modo de trabajo'
        />
        <NativeSelect
          aria-label='Vista de trabajo'
          value={activeView}
          onChange={(event) => changeView(event.target.value as WorkView)}
          className='sm:w-52'
        >
          {views.map((view) => (
            <NativeSelectOption key={view} value={view}>
              {viewLabels[view]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {showBoard && <KanbanBoard />}
      {!showBoard && activeView === 'all' && (
        <TaskListPage basePath='/dashboard/my-work' mode='list' view='all' />
      )}
      {!showBoard && activeView === 'inbox' && <InboxPage />}
      {!showBoard && activeView === 'waiting' && (
        <TaskListPage basePath='/dashboard/my-work' mode='list' view='waiting' />
      )}
      {!showBoard && activeView === 'completed' && (
        <TaskListPage basePath='/dashboard/my-work' mode='list' view='completed' />
      )}
      {!showBoard && activeView === 'follow-ups' && <OperatingSystemPage kind='follow-ups' />}
    </main>
  );
}
