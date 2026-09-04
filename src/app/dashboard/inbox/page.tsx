import { InboxPage } from '@/features/inbox/components/inbox-page';
import { Suspense } from 'react';

export default async function Page() {
  return (
    <Suspense fallback={null}>
      <InboxPage />
    </Suspense>
  );
}
