import PageContainer from '@/components/layout/page-container';
import { OpportunitiesPage } from '@/features/operating-system/components/operating-system';
export const metadata = { title: 'Dashboard: Opportunities' };
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Opportunities'
      pageDescription='Pipeline y próximos pasos.'
    >
      <OpportunitiesPage initialCreate={params.create === '1'} />
    </PageContainer>
  );
}
