import { getAuthContext } from '@/lib/db/organization-context';
import TodayScreen from '@/features/today/components/today-screen';

export const metadata = { title: 'Dashboard: Hoy' };

export default async function Page() {
  const { membership } = await getAuthContext();
  return <TodayScreen role={membership.role as 'owner' | 'manager' | 'member'} />;
}
