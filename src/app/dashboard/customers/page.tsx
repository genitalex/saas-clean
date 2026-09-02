import PageContainer from '@/components/layout/page-container';
import CustomerListing from '@/features/customers/components/customer-listing';
import CustomerFormSheet from '@/features/customers/components/customer-form-sheet';

export const metadata = { title: 'Clientes' };

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer
      pageTitle='Clientes'
      pageDescription='Tu lista de trabajo con el contexto de cada cliente.'
      pageHeaderAction={<CustomerFormSheet initialOpen={params.create === '1'} />}
    >
      <CustomerListing />
    </PageContainer>
  );
}
