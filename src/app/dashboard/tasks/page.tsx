import { redirectToWork } from '@/lib/work-redirect';

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  redirectToWork('list', params);
}
