import WorkspacePlaceholder from '@/components/layout/workspace-placeholder';
import PageContainer from '@/components/layout/page-container';
import { getAuthContext } from '@/lib/db/organization-context';

export const metadata = { title: 'Dashboard: Equipo' };

export default async function Page() {
  const { membership } = await getAuthContext();
  const canManage = membership.role === 'owner' || membership.role === 'manager';

  if (!canManage) {
    return <PageContainer access={false}> </PageContainer>;
  }

  return <WorkspacePlaceholder section='team' />;
}
