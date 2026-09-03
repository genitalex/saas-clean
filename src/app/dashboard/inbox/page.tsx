import { InboxPage } from '@/features/inbox/components/inbox-page';
import { getAuthContext } from '@/lib/db/organization-context';
import { Suspense } from 'react';

export default async function Page() {
  const { organization, user } = await getAuthContext();
  return (
    <Suspense fallback={null}>
      <InboxPage organizationId={organization.id} userId={user.id} />
    </Suspense>
  );
}
