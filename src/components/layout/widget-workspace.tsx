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
export type WidgetHeight = 1 | 2 | 3 | 4;

export interface WidgetDefinition {
  id: string;
  title: string;
  icon: typeof Icons.check;
  content: React.ReactNode;
  kind?: 'widget' | 'view';
  source?: string;
  defaultSize?: WidgetSize;
  mobileSize?: 1 | 2;
  allowedSizes?: WidgetSize[];
  mobileAllowedSizes?: (1 | 2)[];
  defaultHeight?: WidgetHeight;
  minHeight?: WidgetHeight;
  maxHeight?: WidgetHeight;
}

interface WidgetPosition {
  id: string;
  size: WidgetSize;
  height: WidgetHeight;
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
const DESKTOP_SIZES: WidgetSize[] = [1, 2, 3, 4, 6, 8, 12];
const MOBILE_SIZES: (1 | 2)[] = [1, 2];
const HEIGHT_UNIT_PX = 96;
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
    desktop: orderedWidgets.map((widget) => ({
      id: widget.id,
      size: widget.defaultSize ?? 6,
      height: widget.defaultHeight ?? 2
    })),
    mobile: orderedWidgets.map((widget) => ({
      id: widget.id,
      size: widget.mobileSize ?? 2,
      height: widget.defaultHeight ?? 2
    })),
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

function mergeLayout(
  widgets: WidgetDefinition[],
  saved: StoredLayout | null,
  desktop: boolean
): StoredLayout {
  const defaults = makeDefaultLayout(widgets);
  if (!saved) return defaults;
  const validIds = new Set(widgets.map((widget) => widget.id));
  const mergePositions = (positions: WidgetPosition[], fallback: WidgetPosition[]) =>
    positions
      .filter((position) => validIds.has(position.id))
      .map((position) => {
        const widget = widgets.find((item) => item.id === position.id)!;
        const allowed = desktop
          ? (widget.allowedSizes ?? DESKTOP_SIZES)
          : ((widget.mobileAllowedSizes ?? MOBILE_SIZES) as WidgetSize[]);
        const size = allowed.includes(position.size)
          ? position.size
          : (widget.defaultSize ?? allowed[0]);
        return {
          ...position,
          size,
          height: Math.max(
            widget.minHeight ?? 1,
            Math.min(widget.maxHeight ?? 4, position.height ?? widget.defaultHeight ?? 2)
          ) as WidgetHeight
        };
      })
      .concat(fallback.filter((position) => !positions.some((item) => item.id === position.id)));
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
      return mergeLayout(
        widgets,
        JSON.parse(raw) as StoredLayout,
        window.matchMedia('(min-width: 768px)').matches
      );
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

  function getAllowedSizes(widget: WidgetDefinition): WidgetSize[] {
    return (
      ((isDesktop ? widget.allowedSizes : widget.mobileAllowedSizes)?.map(
        Number
      ) as WidgetSize[]) ?? (isDesktop ? DESKTOP_SIZES : MOBILE_SIZES)
    );
  }

  function resizeWidget(id: string, size: WidgetSize) {
    const widget = widgets.find((item) => item.id === id);
    if (!widget) return;
    const allowed = getAllowedSizes(widget);
    const nextSize = allowed.includes(size) ? size : allowed[allowed.length - 1];
    updatePositions(positions.map((item) => (item.id === id ? { ...item, size: nextSize } : item)));
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
          <div className='grid grid-flow-row-dense grid-cols-2 items-start gap-3 md:grid-cols-12 md:gap-4'>
            {visibleWidgets.map((widget) => {
              const position = positions.find((item) => item.id === widget.id)!;
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  size={position.size}
                  height={position.height}
                  isDesktop={isDesktop}
                  editing={editing}
                  allowedSizes={getAllowedSizes(widget)}
                  minHeight={widget.minHeight ?? 1}
                  maxHeight={widget.maxHeight ?? 4}
                  onHide={() => hideWidget(widget.id)}
                  onResize={(size) => resizeWidget(widget.id, size)}
                  onHeightChange={(height) =>
                    updatePositions(
                      positions.map((item) => (item.id === widget.id ? { ...item, height } : item))
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
  height,
  isDesktop,
  editing,
  allowedSizes,
  minHeight,
  maxHeight,
  onHide,
  onResize,
  onHeightChange
}: {
  widget: WidgetDefinition;
  size: WidgetSize;
  height: WidgetHeight;
  isDesktop: boolean;
  editing: boolean;
  allowedSizes: WidgetSize[];
  minHeight: WidgetHeight;
  maxHeight: WidgetHeight;
  onHide: () => void;
  onResize: (size: WidgetSize) => void;
  onHeightChange: (height: WidgetHeight) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: widget.id
    });
  const Icon = widget.icon;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${isDesktop ? Math.min(size, DESKTOP_COLUMNS) : Math.min(size, 2)} / span ${isDesktop ? Math.min(size, DESKTOP_COLUMNS) : Math.min(size, 2)}`,
    height: `${height * HEIGHT_UNIT_PX}px`
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border/65 transition-[box-shadow,ring-color,background-color,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        isDragging && 'z-10 scale-[1.01] opacity-95 shadow-[0_10px_28px_rgba(31,57,45,0.10)]',
        isOver && !isDragging && 'bg-primary/5 ring-2 ring-primary/25',
        editing && 'ring-primary/25'
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
      <div className='min-h-0 min-w-0 flex-1 overflow-auto p-4'>{widget.content}</div>
      {editing && (
        <ResizeHandle
          size={size}
          allowedSizes={allowedSizes}
          onResize={onResize}
          height={height}
          minHeight={minHeight}
          maxHeight={maxHeight}
          onHeightChange={onHeightChange}
        />
      )}
    </section>
  );
}

function ResizeHandle({
  size,
  allowedSizes,
  onResize,
  height,
  minHeight,
  maxHeight,
  onHeightChange
}: {
  size: WidgetSize;
  allowedSizes: WidgetSize[];
  onResize: (size: WidgetSize) => void;
  height: WidgetHeight;
  minHeight: WidgetHeight;
  maxHeight: WidgetHeight;
  onHeightChange: (height: WidgetHeight) => void;
}) {
  const index = allowedSizes.indexOf(size);
  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startIndex = index;
    const handleMove = (moveEvent: PointerEvent) => {
      const delta = Math.round((moveEvent.clientX - startX) / 120);
      const nextIndex = Math.max(0, Math.min(allowedSizes.length - 1, startIndex + delta));
      onResize(allowedSizes[nextIndex]);
    };
    const stopResize = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopResize);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopResize);
  }

  function cycleHeight() {
    const nextHeight = height >= maxHeight ? minHeight : ((height + 1) as WidgetHeight);
    onHeightChange(nextHeight);
  }

  return (
    <>
      <button
        type='button'
        className='absolute bottom-1 right-1 cursor-ew-resize rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
        aria-label='Cambiar ancho del widget'
        onPointerDown={startResize}
      >
        <Icons.chevronsRight className='size-4' />
      </button>
      <button
        type='button'
        className='absolute bottom-1 left-1 cursor-ns-resize rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
        aria-label='Cambiar altura del widget'
        onClick={cycleHeight}
      >
        <Icons.chevronDown className='size-4' />
      </button>
    </>
  );
}
