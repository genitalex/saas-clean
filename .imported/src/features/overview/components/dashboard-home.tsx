'use client';

import { GreetingHeader } from './greeting-header';
import { TodaySummary } from './today-summary';
import { AttentionPanel } from './attention-panel';
import { UpcomingPanel } from './upcoming-panel';
import { TasksPreview } from './tasks-preview';
import { RecentActivity } from './recent-activity';
import { KanbanPreview } from './kanban-preview';
import { RecentCustomers } from './recent-customers';

export function DashboardHome() {
  return (
    <main className='flex flex-1 flex-col gap-6'>
      <GreetingHeader />
      <TodaySummary />
      <div className='grid gap-4 lg:grid-cols-2'>
        <AttentionPanel />
        <UpcomingPanel />
        <TasksPreview />
        <RecentActivity />
      </div>
      <KanbanPreview />
      <RecentCustomers />
    </main>
  );
}
