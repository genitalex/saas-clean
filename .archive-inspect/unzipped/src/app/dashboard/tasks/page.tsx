import PageContainer from '@/components/layout/page-container';
import { TaskListPage, TasksHeaderAction } from '@/features/tasks/components/task-list-page';

export const metadata = { title: 'Tasks' };

export default function TasksPage() {
  return (
    <PageContainer
      pageTitle='Tasks'
      pageDescription='Organiza el trabajo de tu equipo.'
      pageHeaderAction={<TasksHeaderAction />}
    >
      <TaskListPage />
    </PageContainer>
  );
}
