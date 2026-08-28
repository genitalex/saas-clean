import PageContainer from '@/components/layout/page-container';
import WorkspacesClient from './workspaces-client';

export const metadata = { title: 'Workspaces' };

export default function WorkspacesPage() {
  return (
    <PageContainer pageTitle='Workspaces' pageDescription='Manage your workspaces.'>
      <WorkspacesClient />
    </PageContainer>
  );
}
