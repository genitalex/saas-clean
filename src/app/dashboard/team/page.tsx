import TeamWorkPage from '@/features/team/components/team-work-page';
import PageContainer from '@/components/layout/page-container';
import { getAuthContext } from '@/lib/db/organization-context';

export const metadata = { title: 'Equipo' };

export default async function Page() {
  const { membership } = await getAuthContext();
  const canManage = membership.role === 'owner' || membership.role === 'manager';

  if (!canManage) {
    return <PageContainer access={false}> </PageContainer>;
  }

  return (
    <PageContainer
      pageTitle='Equipo'
      pageDescription='Qué tiene por delante cada persona y dónde necesita atención.'
    >
      <TeamWorkPage />
    </PageContainer>
  );
}
