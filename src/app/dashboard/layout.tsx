import KBar from '@/components/kbar';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { LayoutContent } from '@/components/layout/layout-content';
import { AuthContextError, getAuthContext } from '@/lib/db/organization-context';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'SaaS Dashboard',
  robots: { index: false, follow: false }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side protection is the source of truth for dashboard access.
  try {
    await getAuthContext();
  } catch (error) {
    if (error instanceof AuthContextError) {
      if (error.code === 'UNAUTHENTICATED') redirect('/auth/sign-in');
      if (error.code === 'NO_ACTIVE_ORGANIZATION') redirect('/onboarding');
    }
    throw error;
  }

  return (
    <KBar>
      <div className='flex flex-col min-h-screen bg-background'>
        <a
          href='#main-content'
          className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
        >
          Skip to content
        </a>
        <LayoutContent>{children}</LayoutContent>
        <BottomNavigation />
      </div>
    </KBar>
  );
}
