import PageContainer from '@/components/layout/page-container';
import { TaskListPage, TasksHeaderAction } from '@/features/tasks/components/task-list-page';

export const metadata = { title: 'Tasks' };

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer
      pageTitle='Tasks'
      pageDescription='Organiza el trabajo de tu equipo.'
      pageHeaderAction={<TasksHeaderAction initialOpen={params.create === '1'} />}
    >
      <TaskListPage />
    </PageContainer>
  );
}
