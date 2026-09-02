'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Action } from 'kbar';
import { useKBar, useRegisterActions } from 'kbar';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

type SearchResult = {
  id: string;
  name: string;
  subtitle: string;
  section: string;
  url: string;
  icon: React.ReactNode;
};

async function fetchResults(search: string, signal: AbortSignal): Promise<SearchResult[]> {
  const query = encodeURIComponent(search);
  const [customersResponse, eventsResponse, tasksResponse, notesResponse, activityResponse] =
    await Promise.all([
      fetch(`/api/customers?search=${query}`, { signal, cache: 'no-store' }),
      fetch(`/api/events?search=${query}`, { signal, cache: 'no-store' }),
      fetch(`/api/tasks?search=${query}`, { signal, cache: 'no-store' }),
      fetch(`/api/notes?search=${query}`, { signal, cache: 'no-store' }),
      fetch('/api/activities?limit=200', { signal, cache: 'no-store' })
    ]);

  const [customers, events, tasks, notes, activities] = await Promise.all([
    customersResponse.ok ? customersResponse.json() : [],
    eventsResponse.ok ? eventsResponse.json() : [],
    tasksResponse.ok ? tasksResponse.json() : [],
    notesResponse.ok ? notesResponse.json() : [],
    activityResponse.ok ? activityResponse.json() : []
  ]);
  const normalized = search.toLocaleLowerCase();

  return [
    ...customers
      .slice(0, 5)
      .map((customer: { id: string; name: string; email?: string | null }) => ({
        id: `customer-${customer.id}`,
        name: customer.name,
        subtitle: customer.email || 'Cliente',
        section: 'Clientes',
        url: `/dashboard/customers/${customer.id}`,
        icon: <Icons.user className='size-4' />
      })),
    ...events
      .slice(0, 5)
      .map((event: { id: string; title: string; customer?: { name: string } | null }) => ({
        id: `event-${event.id}`,
        name: event.title,
        subtitle: event.customer?.name || 'Evento',
        section: 'Eventos',
        url: `/dashboard/calendar?event=${event.id}`,
        icon: <Icons.calendar className='size-4' />
      })),
    ...tasks
      .slice(0, 5)
      .map((task: { id: string; title: string; customer?: { name: string } | null }) => ({
        id: `task-${task.id}`,
        name: task.title,
        subtitle: task.customer?.name || 'Tarea',
        section: 'Tareas',
        url: `/dashboard/tasks?task=${task.id}`,
        icon: <Icons.check className='size-4' />
      })),
    ...notes.slice(0, 5).map((note: { id: string; title: string }) => ({
      id: `note-${note.id}`,
      name: note.title,
      subtitle: 'Nota',
      section: 'Notas',
      url: `/dashboard/notes?note=${note.id}`,
      icon: <Icons.post className='size-4' />
    })),
    ...activities
      .filter((activity: { title: string; customer: { name: string } }) =>
        `${activity.title} ${activity.customer?.name || ''}`
          .toLocaleLowerCase()
          .includes(normalized)
      )
      .slice(0, 5)
      .map((activity: { id: string; title: string; customer: { id: string; name: string } }) => ({
        id: `activity-${activity.id}`,
        name: activity.title,
        subtitle: activity.customer.name,
        section: 'Actividad',
        url: `/dashboard/customers/${activity.customer.id}`,
        icon: <Icons.pulse className='size-4' />
      }))
  ];
}

export default function GlobalActions() {
  const router = useRouter();
  const { query, searchQuery } = useKBar((state) => ({
    searchQuery: state.searchQuery
  }));
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchResults(searchQuery.trim(), controller.signal)
        .then(setResults)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setResults([]);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const actions = useMemo<Action[]>(
    () =>
      results.map((result) => ({
        id: result.id,
        name: result.name,
        subtitle: result.subtitle,
        section: result.section,
        icon: result.icon,
        perform: () => {
          query.setSearch('');
          query.toggle();
          router.push(result.url);
        }
      })),
    [query, results, router]
  );

  useRegisterActions(actions, [actions]);
  return null;
}
