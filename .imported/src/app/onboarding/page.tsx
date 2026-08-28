import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import OnboardingForm from './onboarding-form';

export default async function OnboardingPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect('/auth/sign-in');

  const memberships = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id));

  if (memberships.length) {
    if (!session.session.activeOrganizationId) {
      await db
        .update(sessions)
        .set({ activeOrganizationId: memberships[0].organizationId, updatedAt: new Date() })
        .where(eq(sessions.id, session.session.id));
    }
    redirect('/dashboard/overview');
  }

  return <OnboardingForm />;
}
