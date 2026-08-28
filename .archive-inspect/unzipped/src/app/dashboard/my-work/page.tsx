import PageContainer from '@/components/layout/page-container';
import { OperatingSystemPage } from '@/features/operating-system/components/operating-system';
export default function Page() {
  return (
    <PageContainer scrollable>
      <OperatingSystemPage kind='my-work' />
    </PageContainer>
  );
}
