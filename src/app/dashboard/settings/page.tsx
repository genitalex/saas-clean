import PageContainer from '@/components/layout/page-container';
import SettingsClient from './settings-client';
import { getAuthContext } from '@/lib/db/organization-context';
import { getOrganizationPermissions } from '@/lib/auth/permissions';
import { db } from '@/lib/db';
import { events, organizationMembers, tasks } from '@/lib/db/schema';
import { and, count, eq, gte, ne } from 'drizzle-orm';

export const metadata = { title: 'Configuración' };

export default async function SettingsPage() {
  const context = await getAuthContext();
  if (!getOrganizationPermissions(context).canManageOrganization) {
    return <PageContainer access={false}> </PageContainer>;
  }

  const now = new Date();
  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, context.organization.id));
  const [{ openTaskCount }] = await db
    .select({ openTaskCount: count() })
    .from(tasks)
    .where(and(eq(tasks.organizationId, context.organization.id), ne(tasks.status, 'done')));
  const [{ upcomingEventCount }] = await db
    .select({ upcomingEventCount: count() })
    .from(events)
    .where(
      and(
        eq(events.organizationId, context.organization.id),
        gte(events.startAt, now),
        ne(events.status, 'cancelled')
      )
    );

  return (
    <SettingsClient
      organizationName={context.organization.name}
      plan={context.organization.plan}
      memberCount={Number(memberCount)}
      seatLimit={context.organization.seatLimit}
      openTaskCount={Number(openTaskCount)}
      upcomingEventCount={Number(upcomingEventCount)}
    />
  );
}
