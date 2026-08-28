'use client';

import Link from 'next/link';

import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    const result = await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message || 'Unable to sign in');
      return;
    }
    router.push('/dashboard/overview');
    router.refresh();
  }

  return (
    <AuthShell
      title='Welcome back'
      subtitle='Sign in to your workspace.'
      footer={
        <>
          New here?{' '}
          <Link className='underline' href='/auth/sign-up'>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className='space-y-4'>
        <label className='grid gap-2 text-sm'>
          <span>Email</span>
          <input
            aria-label='Email'
            className='border-input bg-background h-10 rounded-md border px-3'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className='grid gap-2 text-sm'>
          <span>Password</span>
          <input
            aria-label='Password'
            className='border-input bg-background h-10 rounded-md border px-3'
            type='password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className='text-destructive text-sm'>{error}</p>}
        <button
          disabled={pending}
          className='bg-primary text-primary-foreground h-10 w-full rounded-md font-medium disabled:opacity-60'
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  footer,
  children
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className='bg-muted/30 flex min-h-screen items-center justify-center p-6'>
      <div className='bg-background w-full max-w-md rounded-2xl border p-8 shadow-sm'>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold'>{title}</h1>
          <p className='text-muted-foreground mt-2'>{subtitle}</p>
        </div>
        {children}
        <p className='text-muted-foreground mt-6 text-center text-sm'>{footer}</p>
      </div>
    </main>
  );
}
