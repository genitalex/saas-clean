import PageContainer from '@/components/layout/page-container';
import CustomerListing from '@/features/customers/components/customer-listing';
import CustomerFormSheet from '@/features/customers/components/customer-form-sheet';

export const metadata = { title: 'Customers' };

export default function CustomersPage() {
  return (
    <PageContainer
      pageTitle='Customers'
      pageDescription='Manage customers in the active workspace.'
      pageHeaderAction={<CustomerFormSheet />}
    >
      <CustomerListing />
    </PageContainer>
  );
}
