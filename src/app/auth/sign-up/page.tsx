'use client';

import Link from 'next/link';

import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    const result = await authClient.signUp.email({ name, email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message || 'Unable to create account');
      return;
    }
    router.push('/onboarding');
    router.refresh();
  }
  return (
    <main className='bg-muted/30 flex min-h-screen items-center justify-center p-6'>
      <div className='bg-background w-full max-w-md rounded-2xl border p-8'>
        <h1 className='text-2xl font-semibold'>Create your account</h1>
        <p className='text-muted-foreground mt-2'>Start with your first workspace.</p>
        <form onSubmit={submit} className='mt-8 space-y-4'>
          <label className='grid gap-2 text-sm'>
            <span>Name</span>
            <input
              aria-label='Name'
              className='border-input bg-background h-10 rounded-md border px-3'
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
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
              minLength={8}
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
            {pending ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className='text-muted-foreground mt-6 text-center text-sm'>
          Already have an account?{' '}
          <Link className='underline' href='/auth/sign-in'>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
