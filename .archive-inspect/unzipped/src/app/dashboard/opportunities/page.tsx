import PageContainer from '@/components/layout/page-container';
import { OpportunitiesPage } from '@/features/operating-system/components/operating-system';
export const metadata = { title: 'Dashboard: Opportunities' };
export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='Opportunities'
      pageDescription='Pipeline y próximos pasos.'
    >
      <OpportunitiesPage />
    </PageContainer>
  );
}
