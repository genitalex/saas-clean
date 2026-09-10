import TeamWorkPage from '@/features/team/components/team-work-page';
import PageContainer from '@/components/layout/page-container';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';

export const metadata = { title: 'Equipo' };

export default async function Page() {
  const context = await getAuthContext();
  const permissions = getOrganizationPermissions(context);

  if (!permissions.canManageTeam) {
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
