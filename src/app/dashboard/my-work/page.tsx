import { WorkPage } from '@/features/operating-system/components/work-page';
import { Suspense } from 'react';
export default async function Page() {
  return (
    <Suspense fallback={null}>
      <WorkPage />
    </Suspense>
  );
}
