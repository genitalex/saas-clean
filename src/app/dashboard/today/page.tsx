import { getAuthContext } from '@/lib/db/organization-context';
import { TodayPage } from '@/features/today/components/today-page';

export const metadata = { title: 'Dashboard: Hoy' };

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { user } = await getAuthContext();
  return <TodayPage userId={user.id} userName={user.name.split(' ')[0] || user.name} />;
}
