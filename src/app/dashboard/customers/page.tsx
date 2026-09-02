import PageContainer from '@/components/layout/page-container';
import CustomerListing from '@/features/customers/components/customer-listing';
import CustomerFormSheet from '@/features/customers/components/customer-form-sheet';

export const metadata = { title: 'Customers' };

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer
      pageTitle='Customers'
      pageDescription='Manage customers in the active workspace.'
      pageHeaderAction={<CustomerFormSheet initialOpen={params.create === '1'} />}
    >
      <CustomerListing />
    </PageContainer>
  );
}
