import PageContainer from '@/components/layout/page-container';
import { AutomationExperience } from '@/features/operating-system/components/operating-system';
import { getAuthContext } from '@/lib/db/organization-context';
import { Suspense } from 'react';
export default async function Page() {
  const { organization, user } = await getAuthContext();
  return (
    <PageContainer scrollable>
      <Suspense fallback={null}>
        <AutomationExperience organizationId={organization.id} />
      </Suspense>
    </PageContainer>
  );
}
