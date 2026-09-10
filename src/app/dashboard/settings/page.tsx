import PageContainer from '@/components/layout/page-container';
import SettingsClient from './settings-client';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

export const metadata = { title: 'Configuración' };

export default async function SettingsPage() {
  const context = await getAuthContext();
  if (!getOrganizationPermissions(context).canManageOrganization) {
    return <PageContainer access={false}> </PageContainer>;
  }

  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, context.organization.id));

  return (
    <SettingsClient
      organizationName={context.organization.name}
      plan={context.organization.plan}
      memberCount={Number(memberCount)}
      seatLimit={context.organization.seatLimit}
    />
  );
}
