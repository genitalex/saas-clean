'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

function getErrorMessage(code: string) {
  if (code === 'INVITATION_EMAIL_MISMATCH')
    return 'Has iniciado sesión con otro email. Usa la cuenta que recibió la invitación.';
  if (code === 'SEAT_LIMIT_REACHED') return 'La organización ya no tiene plazas disponibles.';
  return 'No se ha podido aceptar la invitación.';
}

export default function InviteActions({
  token,
  invitedEmail,
  currentEmail
}: {
  token: string;
  invitedEmail: string;
  currentEmail: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const matches = invitedEmail.toLowerCase() === currentEmail.toLowerCase();

  async function accept() {
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/organization-invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(getErrorMessage(data.error));
        return;
      }
      router.push('/dashboard/today');
      router.refresh();
    } catch {
      setError('No se ha podido aceptar la invitación.');
    } finally {
      setPending(false);
    }
  }

  if (!matches) {
    return (
      <p className='text-destructive mt-8 rounded-xl bg-destructive/8 p-3 text-sm'>
        Esta invitación pertenece a {invitedEmail}. Has iniciado sesión como {currentEmail}.
      </p>
    );
  }

  return (
    <div className='mt-8 space-y-3'>
      <Button className='h-11 w-full rounded-xl' onClick={() => void accept()} disabled={pending}>
        {pending ? 'Uniéndote…' : 'Unirme al equipo'}
      </Button>
      {error && <p className='text-destructive text-sm'>{error}</p>}
    </div>
  );
}
