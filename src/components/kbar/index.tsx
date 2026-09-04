'use client';
import { navGroups } from '@/config/nav-config';
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch, useKBar } from 'kbar';
import { Kbd } from '@/components/ui/kbd';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { useModeStore } from '@/features/modes/store';
import GlobalActions from './global-actions';
import { Icons } from '@/components/icons';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const filteredGroups = useFilteredNavGroups(navGroups);
  const setFocusMode = useModeStore((state) => state.setFocusMode);
  const setPauseMode = useModeStore((state) => state.setPauseMode);
  const setEndOfDayMode = useModeStore((state) => state.setEndOfDayMode);

  // These action are for the navigation
  const actions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const allItems = filteredGroups
      .flatMap((group) => group.items)
      .filter((item) => !item.disabled);

    const createActions = [
      {
        id: 'create-task',
        name: 'Crear tarea',
        keywords: 'crear nueva tarea task',
        section: 'Crear',
        subtitle: 'Abrir una captura de tarea',
        icon: <Icons.check className='size-4' />,
        perform: () => navigateTo('/dashboard/tasks?create=1')
      },
      {
        id: 'create-event',
        name: 'Crear evento',
        keywords: 'crear nuevo evento reunión calendario',
        section: 'Crear',
        subtitle: 'Abrir el formulario rápido de eventos',
        icon: <Icons.calendar className='size-4' />,
        perform: () => navigateTo('/dashboard/calendar?create=1')
      },
      {
        id: 'create-customer',
        name: 'Crear cliente',
        keywords: 'crear nuevo cliente customer',
        section: 'Crear',
        subtitle: 'Añadir contexto al espacio',
        icon: <Icons.user className='size-4' />,
        perform: () => navigateTo('/dashboard/customers?create=1')
      },
      {
        id: 'create-note',
        name: 'Abrir notas',
        keywords: 'crear nota rápida notes',
        section: 'Crear',
        subtitle: 'Capturar una idea en Notas',
        icon: <Icons.post className='size-4' />,
        perform: () => navigateTo('/dashboard/notes')
      }
    ];

    const modeActions = [
      {
        id: 'start-focus',
        name: 'Empezar modo foco',
        keywords: 'foco focus',
        section: 'Modos',
        subtitle: 'Trabajar en una sola prioridad',
        perform: () =>
          setFocusMode(
            'priority',
            'Revisar los seguimientos prioritarios',
            'Centro de mando',
            'Hoy',
            'Alta'
          )
      },
      {
        id: 'pause-work',
        name: 'Poner en pausa',
        keywords: 'pausa descanso',
        section: 'Modos',
        subtitle: 'Tomar una pausa de 5 minutos',
        perform: () => setPauseMode(300)
      },
      {
        id: 'end-day',
        name: 'Cerrar el día',
        keywords: 'cierre día resumen',
        section: 'Modos',
        subtitle: 'Preparar el siguiente día',
        perform: setEndOfDayMode
      }
    ];

    return [
      ...createActions,
      ...modeActions,
      ...allItems.flatMap((navItem) => {
        // Only include base action if the navItem has a real URL and is not just a container
        const baseAction =
          navItem.url !== '#'
            ? {
                id: `${navItem.title.toLowerCase()}Action`,
                name: navItem.title,
                shortcut: navItem.shortcut,
                keywords: navItem.title.toLowerCase(),
                section: 'Navigation',
                subtitle: `Go to ${navItem.title}`,
                perform: () => navigateTo(navItem.url)
              }
            : null;

        // Map child items into actions
        const childActions =
          navItem.items?.map((childItem) => ({
            id: `${childItem.title.toLowerCase()}Action`,
            name: childItem.title,
            shortcut: childItem.shortcut,
            keywords: childItem.title.toLowerCase(),
            section: navItem.title,
            subtitle: `Go to ${childItem.title}`,
            perform: () => navigateTo(childItem.url)
          })) ?? [];

        // Return only valid actions (ignoring null base actions for containers)
        return baseAction ? [baseAction, ...childActions] : childActions;
      })
    ];
  }, [router, filteredGroups, setFocusMode, setPauseMode, setEndOfDayMode]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();
  const { query } = useKBar();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        query.toggle();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [query]);

  return (
    <>
      <GlobalActions />
      <KBarPortal>
        <KBarPositioner className='fixed inset-0 z-50 flex items-start! justify-center bg-foreground/20 p-4! pt-[14vh]!'>
          <KBarAnimator className='relative mx-auto w-full max-w-xl'>
            <div className='overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-popover text-popover-foreground shadow-lg'>
              <div className='sticky top-0 z-10 border-b border-border/70 bg-popover'>
                <KBarSearch className='placeholder:text-muted-foreground w-full border-none bg-transparent px-4 py-3.5 text-sm outline-hidden focus:ring-0 focus:outline-hidden' />
              </div>
              <div className='h-[400px]'>
                <RenderResults />
              </div>
              <div className='text-muted-foreground flex items-center gap-3 border-t border-border/70 px-3 py-2 text-xs'>
                <span className='flex items-center gap-1'>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigate
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>↵</Kbd> open
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>esc</Kbd> close
                </span>
              </div>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
