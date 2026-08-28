import PageContainer from '@/components/layout/page-container';
import IntegrationsPage from '@/features/integrations/components/integrations-page';

export const metadata = { title: 'Integrations' };

export default function IntegrationsRoute() {
  return (
    <PageContainer pageTitle='' pageDescription=''>
      <IntegrationsPage />
    </PageContainer>
  );
}
