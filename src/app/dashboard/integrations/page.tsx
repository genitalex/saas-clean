import PageContainer from '@/components/layout/page-container';
import IntegrationsPage from '@/features/integrations/components/integrations-page';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';

export const metadata = { title: 'Integraciones' };

export default async function IntegrationsRoute() {
  const context = await getAuthContext();
  if (!getOrganizationPermissions(context).canManageIntegrations) {
    return <PageContainer access={false}> </PageContainer>;
  }
  return (
    <PageContainer pageTitle='' pageDescription=''>
      <IntegrationsPage />
    </PageContainer>
  );
}
