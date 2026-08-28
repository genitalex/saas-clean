import PageContainer from '@/components/layout/page-container';
import { ProposalPreview } from '@/features/operating-system/components/operating-system';
export default function Page() {
  return (
    <PageContainer scrollable>
      <ProposalPreview />
    </PageContainer>
  );
}
