import { redirectToWork } from '@/lib/work-redirect';

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirectToWork('inbox', await searchParams);
}
