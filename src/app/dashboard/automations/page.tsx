import PageContainer from '@/components/layout/page-container';
import { AutomationExperience } from '@/features/operating-system/components/operating-system';
import { getAuthContext } from '@/lib/db/organization-context';
import { Suspense } from 'react';
import { getOrganizationPermissions } from '@/lib/auth/permissions';
export default async function Page() {
  const context = await getAuthContext();
  if (!getOrganizationPermissions(context).canManageAutomations) {
    return <PageContainer access={false}> </PageContainer>;
  }
  const { organization } = context;
  return (
    <PageContainer scrollable>
      <Suspense fallback={null}>
        <AutomationExperience organizationId={organization.id} />
      </Suspense>
    </PageContainer>
  );
}
