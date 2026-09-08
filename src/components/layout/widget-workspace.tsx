'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type WidgetSize = 1 | 2 | 3 | 4 | 6 | 8 | 12;

export interface WidgetDefinition {
  id: string;
  title: string;
  icon: typeof Icons.check;
  content: React.ReactNode;
  kind?: 'widget' | 'view';
  source?: string;
  defaultSize?: WidgetSize;
  mobileSize?: 1 | 2;
}

interface WidgetPosition {
  id: string;
  size: WidgetSize;
}

interface StoredLayout {
  desktop: WidgetPosition[];
  mobile: WidgetPosition[];
  hidden: string[];
}

interface WidgetWorkspaceProps {
  widgets: WidgetDefinition[];
  storageKey: string;
}

const DESKTOP_COLUMNS = 12;
function subscribeToDesktop(callback: () => void) {
  const media = window.matchMedia('(min-width: 768px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 768px)').matches;
}

function getDesktopServerSnapshot() {
  return true;
}

function makeDefaultLayout(widgets: WidgetDefinition[]): StoredLayout {
  const orderedWidgets = widgets.toSorted((left, right) =>
    left.id === 'agenda' ? -1 : right.id === 'agenda' ? 1 : 0
  );
  return {
    desktop: orderedWidgets.map((widget) => ({ id: widget.id, size: widget.defaultSize ?? 6 })),
    mobile: orderedWidgets.map((widget) => ({ id: widget.id, size: widget.mobileSize ?? 2 })),
    hidden: []
  };
}

export function addWidgetToToday(storageKey: string, widgetId: string) {
  if (typeof window === 'undefined') return;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const layout = JSON.parse(raw) as StoredLayout;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ ...layout, hidden: layout.hidden.filter((id) => id !== widgetId) })
    );
  } catch {}
}

function mergeLayout(widgets: WidgetDefinition[], saved: StoredLayout | null): StoredLayout {
  const defaults = makeDefaultLayout(widgets);
  if (!saved) return defaults;
  const validIds = new Set(widgets.map((widget) => widget.id));
  const mergePositions = (positions: WidgetPosition[], fallback: WidgetPosition[]) => [
    ...positions.filter((position) => validIds.has(position.id)),
    ...fallback.filter((position) => !positions.some((item) => item.id === position.id))
  ];
  return {
    desktop: mergePositions(saved.desktop ?? [], defaults.desktop),
    mobile: mergePositions(saved.mobile ?? [], defaults.mobile),
    hidden: (saved.hidden ?? []).filter((id) => validIds.has(id))
  };
}

export function WidgetWorkspace({ widgets, storageKey }: WidgetWorkspaceProps) {
  const [layout, setLayout] = useState<StoredLayout>(() => {
    if (typeof window === 'undefined') return makeDefaultLayout(widgets);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return makeDefaultLayout(widgets);
    try {
      return mergeLayout(widgets, JSON.parse(raw) as StoredLayout);
    } catch {
      return makeDefaultLayout(widgets);
    }
  });
  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );
  const [editing, setEditing] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [layout, storageKey]);

  const positions = isDesktop ? layout.desktop : layout.mobile;
  const visibleIds = new Set(layout.hidden);
  const visibleWidgets = positions
    .map((position) => widgets.find((widget) => widget.id === position.id))
    .filter(
      (widget): widget is WidgetDefinition => widget !== undefined && !visibleIds.has(widget.id)
    );
  const hiddenWidgets = widgets.filter((widget) => layout.hidden.includes(widget.id));

  function updatePositions(nextPositions: WidgetPosition[]) {
    setLayout((current) => ({
      ...current,
      [isDesktop ? 'desktop' : 'mobile']: nextPositions
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = positions.findIndex((position) => position.id === active.id);
    const newIndex = positions.findIndex((position) => position.id === over.id);
    if (oldIndex !== newIndex) updatePositions(arrayMove(positions, oldIndex, newIndex));
  }

  function hideWidget(id: string) {
    setLayout((current) => ({ ...current, hidden: [...current.hidden, id] }));
  }

  function showWidget(id: string) {
    setLayout((current) => ({ ...current, hidden: current.hidden.filter((item) => item !== id) }));
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-end gap-2'>
        {editing && hiddenWidgets.length > 0 && (
          <div className='flex flex-wrap justify-end gap-1.5'>
            {hiddenWidgets.map((widget) => (
              <Button
                key={widget.id}
                variant='ghost'
                size='sm'
                onClick={() => showWidget(widget.id)}
              >
                <Icons.add data-icon='inline-start' /> {widget.title}
              </Button>
            ))}
          </div>
        )}
        <Button
          variant={editing ? 'secondary' : 'ghost'}
          size='sm'
          onClick={() => setEditing((value) => !value)}
          aria-pressed={editing}
        >
          <Icons.adjustments data-icon='inline-start' /> {editing ? 'Listo' : 'Personalizar'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={visibleWidgets.map((widget) => widget.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='grid grid-cols-2 items-start gap-3 md:grid-cols-12 md:gap-4'>
            {visibleWidgets.map((widget) => {
              const position = positions.find((item) => item.id === widget.id)!;
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  size={position.size}
                  isDesktop={isDesktop}
                  editing={editing}
                  onHide={() => hideWidget(widget.id)}
                  onResize={(size) =>
                    updatePositions(
                      positions.map((item) => (item.id === widget.id ? { ...item, size } : item))
                    )
                  }
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableWidget({
  widget,
  size,
  isDesktop,
  editing,
  onHide,
  onResize
}: {
  widget: WidgetDefinition;
  size: WidgetSize;
  isDesktop: boolean;
  editing: boolean;
  onHide: () => void;
  onResize: (size: WidgetSize) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id
  });
  const Icon = widget.icon;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${isDesktop ? Math.min(size, DESKTOP_COLUMNS) : Math.min(size, 2)} / span ${isDesktop ? Math.min(size, DESKTOP_COLUMNS) : Math.min(size, 2)}`
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative min-w-0 rounded-xl bg-card ring-1 ring-border/65',
        isDragging && 'z-10 opacity-70 shadow-lg',
        editing && 'ring-primary/30'
      )}
      aria-label={widget.title}
    >
      {editing && (
        <div className='absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-background/90 p-1 shadow-sm ring-1 ring-border/60'>
          <button
            type='button'
            className='cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
            aria-label={`Mover ${widget.title}`}
            {...attributes}
            {...listeners}
          >
            <Icons.gripVertical className='size-4' />
          </button>
          <button
            type='button'
            className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
            onClick={onHide}
            aria-label={`Ocultar ${widget.title}`}
          >
            <Icons.eyeOff className='size-4' />
          </button>
        </div>
      )}
      <div className='flex items-center gap-2 border-b border-border/45 px-4 py-3'>
        <Icon className='size-4 text-primary' />
        <h2 className='text-sm font-semibold'>{widget.title}</h2>
      </div>
      <div className='min-w-0 p-4'>{widget.content}</div>
      {editing && <ResizeHandle size={size} maxSize={isDesktop ? 12 : 2} onResize={onResize} />}
    </section>
  );
}

function ResizeHandle({
  size,
  maxSize,
  onResize
}: {
  size: WidgetSize;
  maxSize: WidgetSize;
  onResize: (size: WidgetSize) => void;
}) {
  const sizes: WidgetSize[] = [1, 2, 3, 4, 6, 8, 12];
  const index = sizes.indexOf(size);
  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startIndex = index;
    const maxIndex = sizes.findIndex((value) => value >= maxSize);
    const handleMove = (moveEvent: PointerEvent) => {
      const delta = Math.round((moveEvent.clientX - startX) / 96);
      const nextIndex = Math.max(0, Math.min(maxIndex, startIndex + delta));
      onResize(sizes[nextIndex]);
    };
    const stopResize = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopResize);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopResize);
  }

  return (
    <button
      type='button'
      className='absolute bottom-1 right-1 cursor-ew-resize rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
      aria-label='Cambiar tamaño del widget'
      onPointerDown={startResize}
    >
      <Icons.chevronsRight className='size-4' />
    </button>
  );
}
