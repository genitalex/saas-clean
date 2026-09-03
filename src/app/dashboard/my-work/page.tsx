import PageContainer from '@/components/layout/page-container';
import { OperatingSystemPage } from '@/features/operating-system/components/operating-system';
import { getAuthContext } from '@/lib/db/organization-context';
import { Suspense } from 'react';
export default async function Page() {
  const { organization, user } = await getAuthContext();
  return (
    <PageContainer scrollable>
      <Suspense fallback={null}>
        <OperatingSystemPage kind='my-work' organizationId={organization.id} userId={user.id} />
      </Suspense>
    </PageContainer>
  );
}
