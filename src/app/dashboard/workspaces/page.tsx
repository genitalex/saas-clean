import PageContainer from '@/components/layout/page-container';
import WorkspacesClient from './workspaces-client';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';

export const metadata = { title: 'Workspaces' };

export default async function WorkspacesPage() {
  const context = await getAuthContext();
  if (!getOrganizationPermissions(context).canManageOrganization) {
    return <PageContainer access={false}> </PageContainer>;
  }
  return (
    <PageContainer pageTitle='Workspaces' pageDescription='Gestiona tus espacios de trabajo.'>
      <WorkspacesClient />
    </PageContainer>
  );
}
