import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationInvitations, organizations } from '@/lib/db/schema';
import InviteActions from './invite-actions';
import { createHash } from 'node:crypto';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation] = await db
    .select({
      email: organizationInvitations.email,
      expiresAt: organizationInvitations.expiresAt,
      acceptedAt: organizationInvitations.acceptedAt,
      organizationName: organizations.name
    })
    .from(organizationInvitations)
    .innerJoin(organizations, eq(organizations.id, organizationInvitations.organizationId))
    .where(eq(organizationInvitations.tokenHash, hashToken(token)))
    .limit(1);

  const valid = Boolean(invitation && !invitation.acceptedAt && invitation.expiresAt > new Date());
  const session = await auth.api.getSession({ headers: await headers() });

  if (!valid || !invitation) {
    return (
      <main className='bg-muted/30 flex min-h-screen items-center justify-center p-6'>
        <div className='bg-background w-full max-w-md rounded-[24px] border p-8 text-center'>
          <p className='text-muted-foreground text-sm'>Esta invitación ya no está disponible.</p>
          <Link href='/auth/sign-in' className='mt-6 inline-flex text-sm text-primary'>
            Volver a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const signInHref = `/auth/sign-in?invite=${encodeURIComponent(token)}`;
  const signUpHref = `/auth/sign-up?invite=${encodeURIComponent(token)}`;

  return (
    <main className='bg-muted/30 flex min-h-screen items-center justify-center p-6'>
      <div className='bg-background w-full max-w-md rounded-[24px] border p-8'>
        <p className='text-primary text-[11px] font-semibold uppercase tracking-[0.16em]'>
          Invitación
        </p>
        <h1 className='mt-2 text-2xl font-semibold'>
          Te han invitado a {invitation.organizationName}
        </h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          La invitación es para {invitation.email}.
        </p>
        {session ? (
          <InviteActions
            token={token}
            invitedEmail={invitation.email}
            currentEmail={session.user.email}
          />
        ) : (
          <div className='mt-8 space-y-3'>
            <Link
              href={signInHref}
              className='bg-primary text-primary-foreground flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium'
            >
              Iniciar sesión para unirme
            </Link>
            <Link
              href={signUpHref}
              className='flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium'
            >
              Crear cuenta
            </Link>
            <p className='text-muted-foreground pt-2 text-center text-xs'>
              Usa el mismo email al que se envió la invitación.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
