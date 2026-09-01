import { getAuthContext } from '@/lib/db/organization-context';
import { TodayPage } from '@/features/today/components/today-page';

export const metadata = { title: 'Dashboard: Hoy' };

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { membership, user } = await getAuthContext();
  const role =
    membership.role === 'owner' || membership.role === 'manager' ? membership.role : 'member';
  return <TodayPage role={role} userName={user.name.split(' ')[0] || user.name} />;
}
