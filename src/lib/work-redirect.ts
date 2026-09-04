import { redirect } from 'next/navigation';

export function redirectToWork(
  mode: string,
  searchParams: Record<string, string | string[] | undefined>
): never {
  const query = new URLSearchParams({ mode });
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === 'mode' || value === undefined) return;
    query.set(key, Array.isArray(value) ? value[0] : value);
  });
  redirect(`/dashboard/my-work?${query.toString()}`);
}
