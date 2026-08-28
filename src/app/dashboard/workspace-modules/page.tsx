import PageContainer from '@/components/layout/page-container';
import { WorkspaceConfigurator } from '@/features/operating-system/components/operating-system';
export default function Page() {
  return (
    <PageContainer scrollable>
      <WorkspaceConfigurator />
    </PageContainer>
  );
}
