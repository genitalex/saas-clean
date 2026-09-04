import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage({ embedded = false }: { embedded?: boolean }) {
  if (embedded) return <KanbanBoard />;

  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks with drag and drop'
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard />
    </PageContainer>
  );
}
