'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDays, format, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AttentionItems } from '@/features/automations/components/attention-items';
import { AutomationForm } from '@/features/automations/components/automation-form';
import { AutomationsList } from '@/features/automations/components/automations-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { createEvent, eventKeys, getEvents } from '@/features/calendar/queries';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunities,
  updateOpportunity
} from '@/features/opportunities/api/service';
import type { Opportunity } from '@/features/opportunities/api/types';
import type { OpportunityUpdateInput } from '@/features/opportunities/api/service';
import { getTasks, taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';

const stages = ['Contactado', 'Propuesta', 'Negociación', 'Ganado'] as const;
type OpportunityStage = (typeof stages)[number];
type OpportunityColumns = Record<OpportunityStage, Opportunity[]>;
const OPPORTUNITY_TRASH_ID = 'opportunity-trash';
const EMPTY_OPPORTUNITIES: Opportunity[] = [];
type OpportunityCustomer = { id: string; name: string };
const NEW_CUSTOMER_VALUE = '__new_customer__';

const money = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);

function defaultProbabilityForStage(stage: string) {
  if (stage === 'Negociación') return 75;
  if (stage === 'Propuesta') return 50;
  return 20;
}

function toDisplayStage(stage: string): OpportunityStage | null {
  if (stages.includes(stage as OpportunityStage)) return stage as OpportunityStage;
  if (stage === 'Prospecto' || stage === 'prospect') return 'Contactado';
  return null;
}

function toColumns(opportunities: Opportunity[]): OpportunityColumns {
  return stages.reduce((result, stage) => {
    result[stage] = opportunities.filter((item) => toDisplayStage(item.stage) === stage);
    return result;
  }, {} as OpportunityColumns);
}

function findOpportunityColumn(columns: OpportunityColumns, opportunityId: string) {
  return stages.find((stage) => columns[stage].some((item) => item.id === opportunityId)) ?? null;
}

function findOpportunity(columns: OpportunityColumns, opportunityId: string) {
  for (const stage of stages) {
    const opportunity = columns[stage].find((item) => item.id === opportunityId);
    if (opportunity) return opportunity;
  }
  return null;
}

function OpportunityDragPreview({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className='w-[250px] border-border/70 shadow-xl'>
      <CardContent className='flex flex-col gap-3 p-4'>
        <div>
          <p className='font-medium'>{opportunity.title}</p>
          <p className='text-sm text-muted-foreground'>{opportunity.customer}</p>
        </div>
        <div>
          <span className='text-lg font-semibold'>{money(opportunity.value)}</span>
          <div className='mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground'>
            <span>Probabilidad de cierre</span>
            <span className='rounded-full bg-primary/[0.08] px-2 py-0.5 text-[11px] font-semibold text-primary'>
              {opportunity.probability}%
            </span>
          </div>
        </div>
        <div
          className='mt-3 h-2 overflow-hidden rounded-full bg-primary/[0.08] ring-1 ring-inset ring-primary/10'
          role='progressbar'
          aria-label={`Probabilidad de cierre: ${opportunity.probability}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={opportunity.probability}
        >
          <div
            className='h-full rounded-full bg-primary transition-[width] duration-300 ease-out'
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{opportunity.owner}</span>
          <span>Cierra {opportunity.close}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunityCard({
  opportunity,
  onOpen,
  suppressClickRef,
  presentationOnly = false
}: {
  opportunity: Opportunity;
  onOpen?: () => void;
  suppressClickRef?: React.MutableRefObject<boolean>;
  presentationOnly?: boolean;
}) {
  if (presentationOnly) return <OpportunityDragPreview opportunity={opportunity} />;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: { type: 'opportunity', opportunityId: opportunity.id, stage: opportunity.stage }
  });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!suppressClickRef?.current) onOpen?.();
      }}
      className={`w-full cursor-grab touch-none border-border/70 text-left shadow-none transition-colors hover:bg-muted/30 active:cursor-grabbing ${
        isDragging ? 'opacity-0' : ''
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      <CardContent className='flex flex-col gap-3 p-4'>
        <div>
          <p className='font-medium'>{opportunity.title}</p>
          <p className='text-sm text-muted-foreground'>{opportunity.customer}</p>
        </div>
        <div>
          <span className='text-lg font-semibold'>{money(opportunity.value)}</span>
          <div className='mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground'>
            <span>Probabilidad de cierre</span>
            <span className='rounded-full bg-primary/[0.08] px-2 py-0.5 text-[11px] font-semibold text-primary'>
              {opportunity.probability}%
            </span>
          </div>
        </div>
        <div
          className='mt-3 h-2 overflow-hidden rounded-full bg-primary/[0.08] ring-1 ring-inset ring-primary/10'
          role='progressbar'
          aria-label={`Probabilidad de cierre: ${opportunity.probability}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={opportunity.probability}
        >
          <div
            className='h-full rounded-full bg-primary transition-[width] duration-300 ease-out'
            style={{ width: `${opportunity.probability}%` }}
          />
        </div>
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{opportunity.owner}</span>
          <span>Cierra {opportunity.close}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunityColumn({
  stage,
  opportunities,
  onOpen,
  suppressClickRef
}: {
  stage: OpportunityStage;
  opportunities: Opportunity[];
  onOpen: (opportunityId: string) => void;
  suppressClickRef: React.MutableRefObject<boolean>;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
    data: { type: 'column', stage }
  });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-w-[250px] flex-1 flex-col gap-3 rounded-xl p-3 transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/35'
      }`}
    >
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-semibold'>{stage}</h2>
        <Badge variant='secondary'>{opportunities.length}</Badge>
      </div>
      <SortableContext
        items={opportunities.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className='flex min-h-24 flex-col gap-3'>
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onOpen={() => onOpen(opportunity.id)}
              suppressClickRef={suppressClickRef}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

function OpportunityTrashDropZone({ active, over }: { active: boolean; over: boolean }) {
  const { setNodeRef } = useDroppable({
    id: OPPORTUNITY_TRASH_ID,
    data: { type: 'trash' }
  });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-5 left-1/2 z-[120] flex min-h-16 w-[min(92vw,340px)] -translate-x-1/2 items-center gap-3 rounded-[var(--radius-xl)] border px-4 py-3 shadow-lg transition-all duration-150 ${
        active ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      } ${
        over
          ? 'scale-[1.03] border-destructive bg-destructive text-destructive-foreground'
          : 'border-destructive/60 bg-background/95 text-destructive'
      }`}
      aria-label='Papelera: suelta aquí para eliminar'
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${over ? 'bg-muted' : 'bg-destructive/10'}`}
      >
        <Icons.trash className='size-4' />
      </span>
      <div className='min-w-0'>
        <p className='text-sm font-semibold'>{over ? 'Suelta para eliminar' : 'Papelera'}</p>
        <p
          className={`truncate text-xs ${over ? 'text-destructive-foreground/75' : 'text-destructive/70'}`}
        >
          {over ? 'La oportunidad se eliminará' : 'Arrastra una oportunidad aquí'}
        </p>
      </div>
    </div>
  );
}

function Pulse() {
  return (
    <Card className='border-primary/20 bg-primary/[0.04]'>
      <CardHeader className='pb-3'>
        <CardDescription>BUSINESS PULSE</CardDescription>
        <CardTitle className='text-xl'>Lo que más importa</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-3 sm:grid-cols-3'>
        {['3 seguimientos pendientes', '2 oportunidades avanzan', '1 cliente sin actividad'].map(
          (item) => (
            <div key={item} className='rounded-lg border bg-background/70 p-3'>
              <p className='text-sm font-medium'>{item}</p>
              <p className='mt-1 text-xs text-muted-foreground'>Revisar hoy</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

export function OpportunitiesPage({
  detailId,
  initialCreate
}: {
  detailId?: string;
  initialCreate?: boolean;
}) {
  const queryClient = useQueryClient();
  const {
    data: opportunityData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['opportunities'],
    queryFn: getOpportunities,
    staleTime: 0,
    refetchOnWindowFocus: false
  });
  const opportunities = opportunityData ?? EMPTY_OPPORTUNITIES;
  const { data: customerData = [] } = useQuery<OpportunityCustomer[]>({
    queryKey: ['opportunities-customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok) throw new Error('Customers request failed');
      return response.json() as Promise<OpportunityCustomer[]>;
    },
    staleTime: 30_000
  });
  const [columns, setColumns] = React.useState<OpportunityColumns>(() => toColumns(opportunities));
  const [createOpen, setCreateOpen] = useState(Boolean(initialCreate));
  const [newTitle, setNewTitle] = useState('');
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    customerData.length ? 'existing' : 'new'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newProbability, setNewProbability] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeOpportunity, setActiveOpportunity] = React.useState<Opportunity | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const columnsRef = React.useRef(columns);
  const opportunitiesRef = React.useRef(opportunities);
  const suppressClickRef = React.useRef(false);
  const dragStartStageRef = React.useRef<OpportunityStage | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  React.useEffect(() => {
    opportunitiesRef.current = opportunities;
    const next = toColumns(opportunities);
    columnsRef.current = next;
    setColumns(next);
  }, [opportunities]);

  React.useEffect(() => {
    if (customerData.length > 0 && customerMode === 'new' && !newCustomer.trim()) {
      setCustomerMode('existing');
    }
  }, [customerData.length, customerMode, newCustomer]);

  React.useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const selected = opportunities.find((item) => item.id === (detailId ?? selectedId)) ?? null;
  const visibleColumns = useMemo(() => {
    if (!query.trim()) return columns;
    const needle = query.toLowerCase();
    return stages.reduce((result, stage) => {
      result[stage] = columns[stage].filter((item) =>
        `${item.title} ${item.customer}`.toLowerCase().includes(needle)
      );
      return result;
    }, {} as OpportunityColumns);
  }, [columns, query]);

  const update = React.useCallback(
    async (id: string, input: string | OpportunityUpdateInput) => {
      await updateOpportunity(id, input);
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.refetchQueries({ queryKey: ['opportunities'], type: 'active' });
    },
    [queryClient]
  );

  const move = React.useCallback(
    async (id: string, stage: string) => {
      try {
        const current = opportunitiesRef.current.find((item) => item.id === id);
        const wasWon = current?.stage === 'Ganado';
        let input: string | OpportunityUpdateInput = stage;
        if (stage === 'Ganado') {
          input = { stage, probability: 100 };
        } else if (wasWon) {
          const resetProbability = defaultProbabilityForStage(stage);
          input = { stage, probability: resetProbability };
        }
        await update(id, input);
      } catch {
        toast.error('No se pudo mover la oportunidad.');
      }
    },
    [update]
  );

  const handleCreateOpportunity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const customerName =
      customerMode === 'existing'
        ? (customerData.find((customer) => customer.id === selectedCustomerId)?.name ?? '')
        : newCustomer.trim();
    if (!newTitle.trim() || !customerName) return;
    try {
      await createOpportunity({
        title: newTitle.trim(),
        customer: customerName,
        value: Number(newValue) || 0,
        probability: newProbability,
        stage: 'Contactado',
        close: 'Por definir',
        owner: 'Alex'
      });
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.refetchQueries({ queryKey: ['opportunities'], type: 'active' });
      setNewTitle('');
      setCustomerMode(customerData.length ? 'existing' : 'new');
      setSelectedCustomerId('');
      setNewCustomer('');
      setNewValue('');
      setNewProbability(20);
      setCreateOpen(false);
      toast.success('Oportunidad creada');
    } catch {
      toast.error('No se pudo crear la oportunidad.');
    }
  };

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const opportunity = findOpportunity(columnsRef.current, String(event.active.id));
    setActiveOpportunity(opportunity);
    dragStartStageRef.current = opportunity
      ? findOpportunityColumn(columnsRef.current, opportunity.id)
      : null;
    setOverId(String(event.active.id));
    suppressClickRef.current = false;
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const over = event.over;
    setOverId(over ? String(over.id) : null);
    if (!over || String(over.id) === OPPORTUNITY_TRASH_ID) return;

    const current = columnsRef.current;
    const activeColumn = findOpportunityColumn(current, activeId);
    if (!activeColumn) return;

    const overIdValue = String(over.id);
    const overColumn = stages.includes(overIdValue as OpportunityStage)
      ? (overIdValue as OpportunityStage)
      : findOpportunityColumn(current, overIdValue);
    if (!overColumn) return;

    if (activeColumn === overColumn) {
      const activeIndex = current[activeColumn].findIndex((item) => item.id === activeId);
      const overIndex = current[overColumn].findIndex((item) => item.id === overIdValue);
      if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;
      const next = {
        ...current,
        [activeColumn]: arrayMove(current[activeColumn], activeIndex, overIndex)
      };
      columnsRef.current = next;
      setColumns(next);
      suppressClickRef.current = true;
      return;
    }

    const activeIndex = current[activeColumn].findIndex((item) => item.id === activeId);
    if (activeIndex === -1) return;
    const moving = current[activeColumn][activeIndex];
    if (!moving) return;
    const resetProbability = defaultProbabilityForStage(overColumn);
    const movedOpportunity = {
      ...moving,
      stage: overColumn,
      probability:
        overColumn === 'Ganado'
          ? 100
          : moving.stage === 'Ganado'
            ? resetProbability
            : moving.probability
    };
    const next = {
      ...current,
      [activeColumn]: current[activeColumn].filter((item) => item.id !== activeId),
      [overColumn]: [...current[overColumn], movedOpportunity]
    };
    columnsRef.current = next;
    setColumns(next);
    setActiveOpportunity(movedOpportunity);
    suppressClickRef.current = true;
  }, []);

  const handleDragCancel = React.useCallback(() => {
    setActiveOpportunity(null);
    setOverId(null);
    dragStartStageRef.current = null;
    const restored = toColumns(opportunitiesRef.current);
    columnsRef.current = restored;
    setColumns(restored);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const over = event.over;
      const finalColumns = columnsRef.current;
      const dragged = findOpportunity(finalColumns, activeId);
      const targetId = over ? String(over.id) : null;

      setActiveOpportunity(null);
      setOverId(null);
      const initialStage = dragStartStageRef.current;
      dragStartStageRef.current = null;
      window.setTimeout(() => {
        suppressClickRef.current = Boolean(over);
      }, 0);

      if (!dragged || !targetId) {
        const restored = toColumns(opportunitiesRef.current);
        columnsRef.current = restored;
        setColumns(restored);
        return;
      }

      if (targetId === OPPORTUNITY_TRASH_ID) {
        try {
          await deleteOpportunity(activeId);
          const result = await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          void result;
          await queryClient.refetchQueries({ queryKey: ['opportunities'], type: 'active' });
          toast.success('Oportunidad eliminada');
        } catch {
          const restored = toColumns(opportunitiesRef.current);
          columnsRef.current = restored;
          setColumns(restored);
          toast.error('No se pudo eliminar la oportunidad.');
        }
        return;
      }

      let targetColumn: OpportunityStage | null = null;
      if (stages.includes(targetId as OpportunityStage)) {
        targetColumn = targetId as OpportunityStage;
      } else {
        targetColumn = findOpportunityColumn(finalColumns, targetId);
      }
      if (!targetColumn) return;

      if (initialStage && targetColumn !== initialStage) {
        try {
          const wasWon = initialStage === 'Ganado';
          const resetProbability = defaultProbabilityForStage(targetColumn);
          const input: string | OpportunityUpdateInput =
            targetColumn === 'Ganado'
              ? { stage: targetColumn, probability: 100 }
              : wasWon
                ? { stage: targetColumn, probability: resetProbability }
                : targetColumn;
          await updateOpportunity(activeId, input);
          await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          await queryClient.refetchQueries({ queryKey: ['opportunities'], type: 'active' });
        } catch {
          const restored = toColumns(opportunitiesRef.current);
          columnsRef.current = restored;
          setColumns(restored);
          toast.error('No se pudo mover la oportunidad.');
        }
      }
    },
    [queryClient]
  );

  if (detailId && selected)
    return (
      <OpportunityDetail
        opportunity={selected}
        onMove={(stage) => void move(selected.id, stage)}
        onProbabilityChange={(probability) => update(selected.id, { probability })}
      />
    );

  return (
    <main className='flex flex-1 flex-col gap-6 py-2'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-primary'>PIPELINE</p>
          <h1 className='text-2xl font-semibold'>Oportunidades</h1>
          <p className='text-sm text-muted-foreground'>
            Sabe qué se mueve y cuál es el siguiente paso.
          </p>
        </div>
        <div className='flex gap-2'>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Buscar oportunidad'
          />
          <Button onClick={() => setCreateOpen(true)}>Nueva oportunidad</Button>
        </div>
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva oportunidad</DialogTitle>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleCreateOpportunity}>
            <Input
              autoFocus
              placeholder='Nombre de la oportunidad'
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            {customerData.length > 0 ? (
              <div className='space-y-2'>
                <NativeSelect
                  aria-label='Cliente'
                  value={customerMode === 'new' ? NEW_CUSTOMER_VALUE : selectedCustomerId}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === NEW_CUSTOMER_VALUE) {
                      setCustomerMode('new');
                      setSelectedCustomerId('');
                      return;
                    }
                    setCustomerMode('existing');
                    setSelectedCustomerId(value);
                    setNewCustomer('');
                  }}
                >
                  <NativeSelectOption value=''>Seleccionar cliente existente</NativeSelectOption>
                  {customerData.map((customer) => (
                    <NativeSelectOption key={customer.id} value={customer.id}>
                      {customer.name}
                    </NativeSelectOption>
                  ))}
                  <NativeSelectOption value={NEW_CUSTOMER_VALUE}>
                    Escribir otro cliente…
                  </NativeSelectOption>
                </NativeSelect>
                {customerMode === 'new' ? (
                  <Input
                    autoFocus
                    placeholder='Nombre del cliente'
                    aria-label='Nombre del cliente'
                    value={newCustomer}
                    onChange={(event) => setNewCustomer(event.target.value)}
                  />
                ) : null}
              </div>
            ) : (
              <Input
                placeholder='Nombre del cliente'
                value={newCustomer}
                onChange={(event) => setNewCustomer(event.target.value)}
              />
            )}
            <Input
              type='number'
              min='0'
              placeholder='Valor estimado'
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <div className='space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-sm font-medium'>Probabilidad de cierre</p>
                  <p className='text-xs text-muted-foreground'>
                    ¿Qué posibilidades crees que hay de cerrar esta oportunidad?
                  </p>
                </div>
                <span className='text-sm font-semibold'>{newProbability}%</span>
              </div>
              <input
                aria-label='Probabilidad de cierre'
                type='range'
                min='0'
                max='100'
                step='5'
                value={newProbability}
                onChange={(event) => setNewProbability(Number(event.target.value))}
                className='w-full accent-primary'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={
                  !newTitle.trim() ||
                  (customerMode === 'existing' ? !selectedCustomerId : !newCustomer.trim())
                }
              >
                Crear oportunidad
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {isLoading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          {stages.map((stage) => (
            <div key={stage} className='h-48 rounded-xl border bg-muted/20' />
          ))}
        </div>
      ) : isError ? (
        <div className='rounded-xl border border-destructive/20 bg-destructive/[0.04] p-6 text-sm'>
          No se pudieron cargar las oportunidades.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className='min-w-0 overflow-x-auto pb-2'>
            <div className='flex min-w-max gap-4'>
              {stages.map((stage) => (
                <OpportunityColumn
                  key={stage}
                  stage={stage}
                  opportunities={visibleColumns[stage]}
                  onOpen={setSelectedId}
                  suppressClickRef={suppressClickRef}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {activeOpportunity ? <OpportunityDragPreview opportunity={activeOpportunity} /> : null}
          </DragOverlay>
          <OpportunityTrashDropZone
            active={Boolean(activeOpportunity)}
            over={overId === OPPORTUNITY_TRASH_ID}
          />
        </DndContext>
      )}
    </main>
  );
}

function OpportunityDetail({
  opportunity,
  onMove,
  onProbabilityChange
}: {
  opportunity: Opportunity;
  onMove: (stage: string) => void;
  onProbabilityChange: (probability: number) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [probability, setProbability] = useState(opportunity.probability);
  const [savingProbability, setSavingProbability] = useState(false);

  React.useEffect(() => {
    setProbability(opportunity.probability);
  }, [opportunity.id, opportunity.probability, opportunity.stage]);

  const effectiveProbability = probability;

  return (
    <main className='flex flex-1 flex-col gap-6 py-2'>
      <Link
        href='/dashboard/opportunities'
        className='text-sm text-muted-foreground hover:text-foreground'
      >
        Volver al pipeline
      </Link>
      <div>
        <Badge variant='outline'>{opportunity.stage}</Badge>
        <h1 className='mt-2 text-3xl font-semibold'>{opportunity.title}</h1>
        <p className='text-muted-foreground'>
          {opportunity.customer} · Responsable {opportunity.owner}
        </p>
      </div>
      <div className='grid gap-4 sm:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Valor</p>
            <p className='mt-1 font-semibold'>{money(opportunity.value)}</p>
          </CardContent>
        </Card>
        <Card className='sm:col-span-2 border-primary/15 bg-primary/[0.02]'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='text-xs text-muted-foreground'>Probabilidad de cierre</p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Qué posibilidades crees que hay de cerrarla.
                </p>
              </div>
              <span className='text-lg font-semibold'>{effectiveProbability}%</span>
            </div>
            <div className='mt-4 h-2 overflow-hidden rounded-full bg-primary/[0.08] ring-1 ring-inset ring-primary/10'>
              <div
                className='h-full rounded-full bg-primary transition-[width] duration-200 ease-out'
                style={{ width: `${effectiveProbability}%` }}
              />
            </div>
            <div className='mt-3 flex items-center gap-3'>
              <input
                aria-label='Probabilidad de cierre'
                type='range'
                min='0'
                max='100'
                step='5'
                value={effectiveProbability}
                onChange={(event) => setProbability(Number(event.target.value))}
                className='w-full accent-primary'
                disabled={savingProbability}
              />
              <div className='relative w-20 shrink-0'>
                <input
                  aria-label='Porcentaje de probabilidad de cierre'
                  type='number'
                  min='0'
                  max='100'
                  step='5'
                  value={effectiveProbability}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next)) setProbability(Math.min(100, Math.max(0, next)));
                  }}
                  className='h-9 w-full rounded-lg border bg-background px-2 pr-6 text-center text-sm font-semibold outline-none ring-offset-background focus:ring-2 focus:ring-primary/20'
                  disabled={savingProbability}
                />
                <span className='pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground'>
                  %
                </span>
              </div>
            </div>
            <div className='mt-2 flex justify-end'>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                disabled={savingProbability || probability === opportunity.probability}
                onClick={async () => {
                  setSavingProbability(true);
                  try {
                    await onProbabilityChange(probability);
                  } catch {
                    setProbability(opportunity.probability);
                    toast.error('No se pudo actualizar la probabilidad.');
                  } finally {
                    setSavingProbability(false);
                  }
                }}
              >
                {savingProbability ? 'Guardando…' : 'Guardar probabilidad'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Cierre esperado</p>
            <p className='mt-1 font-semibold'>{opportunity.close}</p>
          </CardContent>
        </Card>
        <Card className='sm:col-span-4'>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Salud</p>
            <p className='mt-1 font-semibold'>
              {effectiveProbability > 60 ? 'Fuerte' : 'En riesgo'}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Actividad relacionada</CardTitle>
          <CardDescription>Todo lo que ayuda a cerrar esta oportunidad.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='font-medium'>Enviar propuesta revisada</span>
            <Badge variant='secondary'>Pendiente</Badge>
          </div>
          <Separator />
          <div className='flex gap-2'>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder='Añadir una nota'
            />
            <Button variant='outline' onClick={() => setNote('Nota guardada')}>
              Guardar
            </Button>
          </div>
          <NativeSelect
            aria-label='Cambiar etapa'
            value={opportunity.stage}
            onChange={(event) => onMove(event.target.value)}
          >
            {stages.map((stage) => (
              <NativeSelectOption key={stage} value={stage}>
                {stage}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </CardContent>
      </Card>
    </main>
  );
}

export function OperatingSystemPage({
  kind,
  organizationId,
  userId
}: {
  kind:
    | 'inbox'
    | 'playbooks'
    | 'automations'
    | 'goals'
    | 'documents'
    | 'my-work'
    | 'weekly-review'
    | 'follow-ups'
    | 'workspace';
  organizationId?: string;
  userId?: string;
}) {
  const titles = {
    inbox: 'Inbox de trabajo',
    playbooks: 'Playbooks',
    automations: 'Automations',
    goals: 'Goals',
    documents: 'Documents',
    'my-work': 'My Work',
    'weekly-review': 'Weekly Review',
    'follow-ups': 'Smart Follow-ups',
    workspace: 'Workspace modules'
  };

  const { data: tasks = [] } = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 20_000
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['workspace-customer-summary'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok)
        return [] as Array<{ id: string; name: string; nextActionAt: string | null }>;
      return (await response.json()) as Array<{
        id: string;
        name: string;
        nextActionAt: string | null;
      }>;
    },
    staleTime: 30_000
  });

  const summary = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status !== 'done');
    const overdue = openTasks.filter(
      (task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now()
    );
    const noDate = openTasks.filter((task) => !task.dueAt && !task.eventId);
    const outdatedFollowUps = customers.filter(
      (customer) =>
        customer.nextActionAt &&
        new Date(customer.nextActionAt).getTime() < Date.now() - 1000 * 60 * 60 * 24 * 7
    );

    const maps = {
      inbox: {
        metrics: [
          { label: 'Por ordenar', value: String(noDate.length) },
          { label: 'Vencidas', value: String(overdue.length) },
          { label: 'Clientes a seguir', value: String(outdatedFollowUps.length) }
        ],
        cards: [
          {
            title: 'Tareas sin fecha',
            description: 'Ordena el trabajo que aún no tiene una próxima acción.',
            meta: noDate[0]?.title ?? 'Sin bloqueos'
          },
          {
            title: 'Seguimientos vencidos',
            description: 'Revisa clientes que llevan tiempo sin respuesta.',
            meta: outdatedFollowUps[0]?.name ?? 'Tómatelo con calma'
          },
          {
            title: 'Siguiente decisión',
            description: 'Cierra el siguiente paso antes de que se vuelvan ruido.',
            meta: openTasks[0]?.title ?? 'Todo bajo control'
          }
        ]
      },
      playbooks: {
        metrics: [
          { label: 'Playbooks activos', value: '4' },
          { label: 'Listas reutilizables', value: '11' },
          { label: 'Tareas guiadas', value: String(openTasks.length) }
        ],
        cards: [
          {
            title: 'Onboarding',
            description: 'Guía clara para nuevos clientes y primeros pasos.',
            meta: '3 clientes activos'
          },
          {
            title: 'Seguimiento comercial',
            description: 'Secuencia útil cuando el cliente necesita una respuesta.',
            meta: '2 pendientes'
          },
          {
            title: 'Cierre de proyecto',
            description: 'Checklist para cerrar trabajo y dejarlo listo para el siguiente ciclo.',
            meta: '1 revisión necesaria'
          }
        ]
      },
      automations: {
        metrics: [
          { label: 'Reglas creadas', value: '6' },
          { label: 'Alertas vivas', value: '3' },
          {
            label: 'Acciones sugeridas',
            value: String(Math.max(1, Math.min(5, overdue.length + 1)))
          }
        ],
        cards: [
          {
            title: 'Recordatorio de vencimiento',
            description: 'Avisa cuando una tarea ya debería haber avanzado.',
            meta: overdue.length > 0 ? 'Activa' : 'Sin riesgos'
          },
          {
            title: 'Seguimiento cliente',
            description: 'Acelera las respuestas cuando el cliente lleva 7 días sin movimiento.',
            meta: 'Automatización recomendada'
          },
          {
            title: 'Sincronización de calendario',
            description: 'Mantén tareas y eventos conectados sin cambiar el contexto.',
            meta: 'Listo'
          }
        ]
      },
      goals: {
        metrics: [
          { label: 'Nuevo pipeline', value: '€42k' },
          { label: 'Clientes nuevos', value: '8' },
          { label: 'Objetivo del mes', value: '74%' }
        ],
        cards: [
          {
            title: 'Cerrar 3 nuevos clientes',
            description: 'El pipeline actual está en línea con la intención del trimestre.',
            meta: '74% de avance'
          },
          {
            title: 'Ritmo de seguimiento',
            description: 'Mantén la cadencia en los clientes con mayor oportunidad.',
            meta: '9 seguimientos activos'
          },
          {
            title: 'Tiempo de respuesta',
            description: 'Reduce el tiempo de reacción para conservar el movimiento.',
            meta: '1.7 días promedio'
          }
        ]
      },
      documents: {
        metrics: [
          { label: 'Activos', value: '18' },
          { label: 'Por revisar', value: '5' },
          { label: 'Último cambio', value: 'Hoy' }
        ],
        cards: [
          {
            title: 'Propuestas abiertas',
            description: 'Revisa documentos que dependen de una decisión activa.',
            meta: '3 esperando respuesta'
          },
          {
            title: 'Contratos',
            description: 'Verifica qué proyectos necesitan confirmación o firma.',
            meta: '2 pendientes'
          },
          {
            title: 'Notas internas',
            description: 'Deja contexto útil para que próximo trabajo no se pierda.',
            meta: '7 listas'
          }
        ]
      },
      'follow-ups': {
        metrics: [
          { label: 'Pendientes', value: String(outdatedFollowUps.length || 2) },
          {
            label: 'Hoy',
            value: String(
              customers.filter(
                (customer) =>
                  customer.nextActionAt && isSameDay(new Date(customer.nextActionAt), new Date())
              ).length
            )
          },
          { label: 'Sin respuesta', value: String(Math.max(1, outdatedFollowUps.length)) }
        ],
        cards: [
          {
            title: 'Clientes con seguimiento pendiente',
            description: 'Cierra la conversación antes de que se vuelva pasiva.',
            meta: outdatedFollowUps[0]?.name ?? 'Sin bloqueos'
          },
          {
            title: 'Próximo contacto',
            description: 'Programar la respuesta correcta requiere claridad sobre el contexto.',
            meta: 'Hoy'
          },
          {
            title: 'Resumen de salud',
            description: 'Sigue el momentum real de cada relación con la persona adecuada.',
            meta: '3 clientes críticos'
          }
        ]
      },
      workspace: {
        metrics: [
          { label: 'Módulos activos', value: '9' },
          {
            label: 'Tareas hoy',
            value: String(
              tasks.filter((task) => task.dueAt && isSameDay(new Date(task.dueAt), new Date()))
                .length
            )
          },
          { label: 'Equipo', value: '8 personas' }
        ],
        cards: [
          {
            title: 'Operaciones del día',
            description: 'La agenda de trabajo ya está conectada a tareas, clientes y calendario.',
            meta: 'Flujo claro'
          },
          {
            title: 'Carga de equipo',
            description: 'Comprueba dónde hay presión o desbalance antes del próximo turno.',
            meta: 'Disponible'
          },
          {
            title: 'Decisiones importantes',
            description: 'Haz seguimiento de lo que más importa sin perder el contexto.',
            meta: 'Toda la operación'
          }
        ]
      }
    } as const;

    return kind === 'my-work' || kind === 'weekly-review' ? maps.workspace : maps[kind];
  }, [kind, tasks, customers]);

  const [open, setOpen] = useState<string | null>(null);

  if (kind === 'my-work')
    return <MyWorkExperience organizationId={organizationId} userId={userId} />;
  if (kind === 'weekly-review') return <WeeklyReviewExperience />;

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-primary'>WORKSPACE</p>
          <h1 className='text-2xl font-semibold'>{titles[kind]}</h1>
          <p className='text-sm text-muted-foreground'>Procesa lo importante sin perder el foco.</p>
        </div>
        <Button variant='outline' onClick={() => setOpen('Resumen del módulo')}>
          Ver contexto
        </Button>
      </div>

      <Pulse />

      <div className='grid gap-3 md:grid-cols-3'>
        {summary.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className='p-4'>
              <p className='text-[10px] uppercase tracking-[0.2em] text-muted-foreground'>
                {metric.label}
              </p>
              <p className='mt-2 text-3xl font-semibold'>{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {summary.cards.map((item, index) => (
          <Card
            key={`${item.title}-${index}`}
            className='cursor-pointer transition-colors'
            onClick={() => setOpen(item.title)}
          >
            <CardHeader>
              <div className='flex items-start justify-between gap-3'>
                <CardTitle className='text-base'>{item.title}</CardTitle>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                  {index === 0 ? 'Activo' : 'Revisión'}
                </Badge>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-xl bg-muted/40 p-3 text-sm font-medium text-foreground/90'>
                {item.meta}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(open)} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-205'>
          <DialogHeader>
            <DialogTitle>{open ?? titles[kind]}</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 p-4'>
            <p className='text-sm text-muted-foreground'>
              Este espacio contiene el contexto que importa hoy para mover trabajo sin romper el
              flujo.
            </p>
            <div className='rounded-xl border bg-muted/30 p-3 text-sm'>
              {kind === 'inbox' &&
                'Revisa tareas sin fecha, prioriza el trabajo pendiente y deja lista la próxima acción.'}
              {kind === 'playbooks' &&
                'Los playbooks mantienen cada repetición ordenada: checklist, contexto y criterio.'}
              {kind === 'automations' &&
                'Las automatizaciones ayudan a que el sistema recuerde lo importante sin depender de la memoria.'}
              {kind === 'goals' &&
                'Las metas del trimestre se conectan con oportunidades, clientes y seguimiento real.'}
              {kind === 'documents' &&
                'Los documentos quedan cerca del trabajo para no perder contexto ni decisiones.'}
              {kind === 'follow-ups' &&
                'Los seguimientos ayudan a mantener relaciones activas sin un trabajo manual pesado.'}
              {kind === 'workspace' &&
                'El espacio de trabajo reúne los módulos del día para que cada decisión tenga contexto.'}
            </div>
            <Button onClick={() => setOpen(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function AutomationExperience({ organizationId }: { organizationId: string }) {
  return (
    <main className='flex flex-1 flex-col gap-6 py-2'>
      <div>
        <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>Flujo</p>
        <h1 className='mt-1 text-2xl font-semibold tracking-tight'>Automatizaciones</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Cuando ocurre algo, el sistema hace lo siguiente.
        </p>
      </div>
      <div className='grid gap-5 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Nueva regla</CardTitle>
            <CardDescription>Reglas simples y previsibles.</CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationForm organizationId={organizationId} />
          </CardContent>
        </Card>
        <AutomationsList organizationId={organizationId} />
      </div>
    </main>
  );
}

function MyWorkExperience({
  organizationId,
  userId
}: {
  organizationId?: string;
  userId?: string;
}) {
  const queryClient = useQueryClient();
  const intoRange = (days: number) => {
    const start = startOfDay(new Date());
    return {
      startDate: start.toISOString(),
      endDate: addDays(start, days).toISOString()
    };
  };

  const tasksQuery = useQuery({
    queryKey: taskKeys.list(),
    queryFn: () => getTasks(),
    staleTime: 20_000
  });
  const eventsQuery = useQuery({
    queryKey: eventKeys.list(intoRange(14)),
    queryFn: () => getEvents(intoRange(14)),
    staleTime: 20_000
  });
  const customersQuery = useQuery({
    queryKey: ['my-work-customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', { cache: 'no-store' });
      if (!response.ok)
        return [] as Array<{ id: string; name: string; nextActionAt: string | null }>;
      const payload = (await response.json()) as Array<{
        id: string;
        name: string;
        nextActionAt: string | null;
      }>;
      return payload;
    },
    staleTime: 30_000
  });

  const tasks = tasksQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const customers = customersQuery.data ?? [];

  const nextTask = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== 'done')
        .sort((a, b) => {
          const priority = { high: 3, medium: 2, low: 1 } as Record<string, number>;
          return (
            (priority[b.priority] ?? 0) - (priority[a.priority] ?? 0) ||
            new Date(a.dueAt ?? '2999-01-01').getTime() -
              new Date(b.dueAt ?? '2999-01-01').getTime()
          );
        })[0],
    [tasks]
  );

  const inboxTasks = useMemo(
    () =>
      tasks.filter((task) => task.status !== 'done' && !task.dueAt && !task.eventId).slice(0, 4),
    [tasks]
  );

  const todayPlan = useMemo(() => {
    const today = startOfDay(new Date());
    const taskItems = tasks
      .filter(
        (task) => task.status !== 'done' && task.dueAt && isSameDay(new Date(task.dueAt), today)
      )
      .map((task) => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        title: task.title,
        when: new Date(task.dueAt!),
        task
      }));
    const eventItems = events
      .filter((event) => isSameDay(new Date(event.startAt), today))
      .map((event) => ({
        id: `event-${event.id}`,
        type: 'event' as const,
        title: event.title,
        when: new Date(event.startAt),
        event
      }));
    return [...taskItems, ...eventItems]
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .slice(0, 5);
  }, [tasks, events]);

  const followUps = useMemo(
    () =>
      customers
        .filter(
          (customer) =>
            customer.nextActionAt &&
            new Date(customer.nextActionAt).getTime() < addDays(new Date(), -7).getTime()
        )
        .slice(0, 4),
    [customers]
  );

  const onCompleteTask = async (task: Task) => {
    try {
      await updateTask(task.id, { status: 'done' });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Tarea completada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo completar la tarea.');
    }
  };

  const onReschedule = async (task: Task, when: 'today' | 'tomorrow') => {
    const date = new Date();
    if (when === 'tomorrow') date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);

    try {
      await updateTask(task.id, { dueAt: date.toISOString() });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success(when === 'today' ? 'Añadida a hoy' : 'Añadida a mañana');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo reprogramar la tarea.');
    }
  };

  const onPlanTask = async (task: Task) => {
    const start = task.dueAt ? new Date(task.dueAt) : new Date();
    try {
      const created = await createEvent({
        title: task.title,
        description: task.description ?? undefined,
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        customerId: task.customerId,
        assigneeId: task.assigneeId,
        status: 'planned'
      });
      await updateTask(task.id, { eventId: created.id, dueAt: start.toISOString() });
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Tarea planificada en calendario');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo planificar la tarea.');
    }
  };

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      {organizationId && userId && (
        <Card className='border-primary/15 bg-primary/[0.03]'>
          <CardHeader>
            <CardDescription>Atención</CardDescription>
            <CardTitle className='text-xl'>Decisiones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <AttentionItems compact />
          </CardContent>
        </Card>
      )}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
            Mi trabajo
          </p>
          <h1 className='mt-1 text-2xl font-semibold tracking-tight'>Flujo del día</h1>
        </div>
        <Link href='/dashboard/today' className='text-sm text-primary'>
          Ver hoy
        </Link>
      </div>

      <div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
        <Card className='border-primary/20 bg-primary/[0.03]'>
          <CardHeader>
            <CardDescription>Siguiente acción</CardDescription>
            <CardTitle className='text-xl'>
              {nextTask ? nextTask.title : 'Todo está bajo control'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              {nextTask
                ? `${nextTask.customer?.name ?? 'Trabajo interno'} · ${nextTask.priority === 'high' ? 'Prioridad alta' : 'Siguiente paso'}${nextTask.dueAt ? ` · ${format(new Date(nextTask.dueAt), 'd MMM', { locale: es })}` : ''}`
                : 'No hay trabajo atrapado. El día puede seguir con calma.'}
            </p>
            {nextTask && (
              <div className='flex flex-wrap gap-2'>
                <Button size='sm' onClick={() => void onCompleteTask(nextTask)}>
                  Hecho
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void onReschedule(nextTask, 'today')}
                >
                  Hoy
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void onReschedule(nextTask, 'tomorrow')}
                >
                  Mañana
                </Button>
                <Button variant='outline' size='sm' onClick={() => void onPlanTask(nextTask)}>
                  Planificar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='border-0 bg-transparent shadow-none'>
          <CardHeader>
            <CardDescription>Resumen</CardDescription>
            <CardTitle className='text-xl'>Este día</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-3 text-sm'>
            <div className='rounded-xl bg-muted/45 p-3'>
              <div className='text-2xl font-semibold'>
                {tasks.filter((task) => task.status !== 'done').length}
              </div>
              <div className='text-muted-foreground'>abiertas</div>
            </div>
            <div className='rounded-xl bg-muted/45 p-3'>
              <div className='text-2xl font-semibold'>{todayPlan.length}</div>
              <div className='text-muted-foreground'>hoy</div>
            </div>
            <div className='rounded-xl bg-muted/45 p-3'>
              <div className='text-2xl font-semibold'>{followUps.length}</div>
              <div className='text-muted-foreground'>seguimientos</div>
            </div>
            <div className='rounded-xl bg-muted/45 p-3'>
              <div className='text-2xl font-semibold'>{inboxTasks.length}</div>
              <div className='text-muted-foreground'>por organizar</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
        <Card className='border-0 bg-transparent shadow-none'>
          <CardHeader>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardDescription>Hoy</CardDescription>
                <CardTitle>Agenda del día</CardTitle>
              </div>
              <Link href='/dashboard/calendar' className='text-xs text-muted-foreground'>
                Calendario
              </Link>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {todayPlan.length === 0 && (
              <p className='text-sm text-muted-foreground'>No hay trabajo programado para hoy.</p>
            )}
            {todayPlan.map((item) => (
              <div
                key={item.id}
                className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3'
              >
                <span className='flex size-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary'>
                  {item.type === 'task' ? (
                    <Icons.check className='size-4' />
                  ) : (
                    <Icons.calendar className='size-4' />
                  )}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{item.title}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {item.type === 'task' ? 'Tarea' : 'Evento'} · {format(item.when, 'HH:mm')}
                  </p>
                </div>
                {item.type === 'task' && item.task && (
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => void onCompleteTask(item.task!)}
                    >
                      Hecho
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className='border-0 bg-transparent shadow-none'>
          <CardHeader>
            <CardDescription>Entrada</CardDescription>
            <CardTitle>Por organizar</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {inboxTasks.length === 0 && (
              <p className='text-sm text-muted-foreground'>La bandeja está despejada.</p>
            )}
            {inboxTasks.map((task) => (
              <div
                key={task.id}
                className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3'
              >
                <span className='flex size-8 items-center justify-center rounded-xl bg-muted'>
                  <Icons.inbox className='size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{task.title}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {task.customer?.name ?? 'Trabajo interno'}
                  </p>
                </div>
                <div className='flex gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => void onReschedule(task, 'today')}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => void onReschedule(task, 'tomorrow')}
                  >
                    Mañana
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardDescription>Seguimiento</CardDescription>
            <CardTitle>Clientes que necesitan respuesta</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {followUps.length === 0 && (
              <p className='text-sm text-muted-foreground'>Todo está al día.</p>
            )}
            {followUps.map((customer) => (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className='flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/50 p-3 text-left'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{customer.name}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs'>
                    {customer.nextActionAt
                      ? format(new Date(customer.nextActionAt), 'd MMM yyyy', { locale: es })
                      : 'Sin fecha'}
                  </p>
                </div>
                <Icons.chevronRight className='text-muted-foreground size-4' />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Trabajo</CardDescription>
            <CardTitle>Lo útil para cerrar el día</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Link
              href='/dashboard/tasks'
              className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 p-3'
            >
              <span className='text-sm font-medium'>Revisar tareas</span>
              <Icons.chevronRight className='text-muted-foreground size-4' />
            </Link>
            <Link
              href='/dashboard/team'
              className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 p-3'
            >
              <span className='text-sm font-medium'>Ver carga del equipo</span>
              <Icons.chevronRight className='text-muted-foreground size-4' />
            </Link>
            <Link
              href='/dashboard/activity'
              className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 p-3'
            >
              <span className='text-sm font-medium'>Comprobar actividad reciente</span>
              <Icons.chevronRight className='text-muted-foreground size-4' />
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function WeeklyReviewExperience() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const { data: tasks = [] } = useQuery({ queryKey: taskKeys.list(), queryFn: () => getTasks() });
  const { data: events = [] } = useQuery({
    queryKey: eventKeys.list({
      startDate: weekStart.toISOString(),
      endDate: addDays(weekStart, 7).toISOString()
    }),
    queryFn: () =>
      getEvents({
        startDate: weekStart.toISOString(),
        endDate: addDays(weekStart, 7).toISOString()
      })
  });

  const done = tasks.filter((task) => task.status === 'done').length;
  const pending = tasks.filter((task) => task.status !== 'done').length;
  const committed = events.length;

  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      <div>
        <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
          Revisión semanal
        </p>
        <h1 className='mt-1 text-2xl font-semibold tracking-tight'>Lo que importa esta semana</h1>
      </div>

      <div className='grid gap-3 md:grid-cols-3'>
        <Card>
          <CardContent className='p-4'>
            <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Hecho</p>
            <p className='mt-2 text-3xl font-semibold'>{done}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Pendiente</p>
            <p className='mt-2 text-3xl font-semibold'>{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Compromisos</p>
            <p className='mt-2 text-3xl font-semibold'>{committed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/60 bg-card/35 shadow-none'>
        <CardHeader>
          <CardDescription>Vista semanal</CardDescription>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-2 md:grid-cols-7'>
          {weekDays.map((day) => {
            const items = events.filter((event) => isSameDay(new Date(event.startAt), day));
            return (
              <div key={day.toISOString()} className='rounded-xl bg-muted/30 p-3'>
                <p className='text-muted-foreground text-[10px] uppercase tracking-[0.2em]'>
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className='mt-2 text-lg font-semibold'>{format(day, 'd')}</p>
                <div className='mt-3 space-y-1'>
                  {items.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className='rounded-md bg-primary/[0.05] px-2 py-1 text-[11px]'
                    >
                      {event.title}
                    </div>
                  ))}
                  {items.length === 0 && <p className='text-[11px] text-muted-foreground'>Libre</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}

export function ClientPortalPreview() {
  return (
    <main className='min-h-screen bg-muted/30 p-4 md:p-10'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader>
          <CardDescription>MY WORKSPACE · CLIENT PORTAL</CardDescription>
          <CardTitle>Hola, María López</CardTitle>
          <p className='text-muted-foreground'>
            Todo lo que necesitas para avanzar en tu proyecto.
          </p>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Progress value={80} />
          <div className='rounded-lg border bg-background p-4'>
            <p className='font-medium'>Pendiente de ti</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Aprueba la propuesta para comenzar.
            </p>
            <Button className='mt-3'>Revisar propuesta</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
export function ProposalPreview() {
  const [status, setStatus] = useState('Borrador');
  return (
    <main className='flex flex-1 justify-center p-4 md:p-10'>
      <Card className='w-full max-w-3xl'>
        <CardHeader>
          <CardDescription>PROPUESTA · WEBSITE REDESIGN</CardDescription>
          <CardTitle className='text-3xl'>7.500 €</CardTitle>
        </CardHeader>
        <CardContent className='flex gap-3'>
          <Badge>{status}</Badge>
          <Button variant='outline' onClick={() => setStatus('Enviada')}>
            Enviar
          </Button>
          <Button onClick={() => setStatus('Aceptada')}>Marcar aceptada</Button>
        </CardContent>
      </Card>
    </main>
  );
}
export function WhatChanged() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>DESDE AYER</CardDescription>
        <CardTitle>Qué ha cambiado</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        {['2 clientes nuevos', '7 tareas completadas', '3 eventos programados'].map((item) => (
          <div key={item} className='flex justify-between rounded-lg border p-3 text-sm'>
            <span>{item}</span>
            <span className='text-muted-foreground'>Ver detalle</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
export function BusinessPulse() {
  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      <div>
        <p className='text-sm font-medium text-primary'>INTERPRETACIÓN</p>
        <h1 className='text-2xl font-semibold'>Business Pulse</h1>
        <p className='text-sm text-muted-foreground'>
          Una lectura clara de lo que merece atención.
        </p>
      </div>
      <Pulse />
      <WhatChanged />
    </main>
  );
}
export function QuickCapture({ onClose }: { onClose?: () => void }) {
  return (
    <div className='grid gap-2 p-2'>
      {[
        ['Cliente', '/dashboard/customers'],
        ['Tarea', '/dashboard/tasks'],
        ['Evento', '/dashboard/calendar'],
        ['Oportunidad', '/dashboard/opportunities']
      ].map(([label, href]) => (
        <Link
          key={label}
          href={href}
          onClick={onClose}
          className='flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted'
        >
          Nueva {label.toLowerCase()}
        </Link>
      ))}
    </div>
  );
}
export function WorkspaceConfigurator() {
  const [template, setTemplate] = useState('Agency');
  const [modules, setModules] = useState({
    Clientes: true,
    Tareas: true,
    Calendario: true,
    Documentos: false
  });
  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Configuración del workspace</h1>
        <p className='text-sm text-muted-foreground'>Activa solo lo que tu equipo necesita.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sector template</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          {['Agency', 'Consulting', 'Services', 'Sales'].map((item) => (
            <Button
              key={item}
              variant={template === item ? 'default' : 'outline'}
              onClick={() => setTemplate(item)}
            >
              {item}
            </Button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Workspace modules</CardTitle>
          <CardDescription>{template} · vistas sugeridas</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 sm:grid-cols-2'>
          {Object.entries(modules).map(([name, enabled]) => (
            <label
              key={name}
              className='flex items-center justify-between rounded-lg border p-3 text-sm'
            >
              <span>{name}</span>
              <Checkbox
                aria-label={`Enable ${name}`}
                checked={enabled}
                onCheckedChange={() =>
                  setModules((current) => ({
                    ...current,
                    [name]: !current[name as keyof typeof current]
                  }))
                }
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
export function ContextDrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        Abrir contexto
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-205'>
          <DialogHeader>
            <DialogTitle>Contexto rápido</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 p-4'>
            <Badge>Cliente · María López</Badge>
            <p className='text-sm text-muted-foreground'>
              3 tareas abiertas · 2 eventos · 1 oportunidad
            </p>
            <Button onClick={() => setOpen(false)}>Programar próximo paso</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function ShortcutOverlay() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        Ver atajos · Cmd K
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-205'>
          <DialogHeader>
            <DialogTitle>Atajos de teclado</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-3 p-4 text-sm'>
            {[
              ['Cmd K', 'Buscar'],
              ['C', 'Nuevo cliente'],
              ['T', 'Nueva tarea'],
              ['E', 'Nuevo evento']
            ].map(([key, label]) => (
              <div className='flex justify-between border-b pb-2' key={key}>
                <span>{label}</span>
                <kbd className='rounded border px-2 py-0.5 font-mono text-xs'>{key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function MainBriefing() {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <BusinessPulse />
      <div className='flex flex-col gap-3'>
        <ContextDrawerDemo />
        <ShortcutOverlay />
      </div>
    </div>
  );
}
export function CustomerHealth() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer health</CardTitle>
        <CardDescription>Señales comprensibles, no una caja negra.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {[
          ['María López', 82, 'Actividad reciente'],
          ['Juan García', 48, 'Seguimiento vencido']
        ].map(([name, score, signal]) => (
          <div key={name as string}>
            <div className='flex justify-between text-sm font-medium'>
              <span>{name}</span>
              <span>{score}%</span>
            </div>
            <Progress value={score as number} className='mt-2' />
            <p className='mt-1 text-xs text-muted-foreground'>{signal}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
export function OverviewExpansion() {
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <MainBriefing />
      <CustomerHealth />
    </div>
  );
}
