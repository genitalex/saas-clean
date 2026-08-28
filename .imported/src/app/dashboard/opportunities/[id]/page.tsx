import PageContainer from '@/components/layout/page-container';
import { OpportunitiesPage } from '@/features/operating-system/components/operating-system';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageContainer scrollable>
      <OpportunitiesPage detailId={id} />
    </PageContainer>
  );
}
