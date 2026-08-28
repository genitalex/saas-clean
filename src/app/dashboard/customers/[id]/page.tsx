import CustomerViewPage from '@/features/customers/components/customer-view-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerViewPage customerId={id} />;
}
