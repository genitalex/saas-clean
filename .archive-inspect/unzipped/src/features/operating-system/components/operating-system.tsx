'use client';

import { Children, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Opportunity = {
  id: number;
  title: string;
  customer: string;
  value: number;
  probability: number;
  stage: string;
  close: string;
  owner: string;
};
const stages = ['Prospecto', 'Contactado', 'Propuesta', 'Negociación', 'Ganado', 'Perdido'];
const seed: Opportunity[] = [
  {
    id: 1,
    title: 'Rediseño web',
    customer: 'María López',
    value: 7500,
    probability: 70,
    stage: 'Propuesta',
    close: '30 ago',
    owner: 'Alex'
  },
  {
    id: 2,
    title: 'Proyecto expansión',
    customer: 'Juan García',
    value: 4000,
    probability: 35,
    stage: 'Prospecto',
    close: '12 sep',
    owner: 'Alex'
  },
  {
    id: 3,
    title: 'Soporte anual',
    customer: 'Estudio Norte',
    value: 12000,
    probability: 80,
    stage: 'Negociación',
    close: '4 sep',
    owner: 'María'
  }
];
const money = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);

function OpportunityCard({
  opportunity,
  onOpen,
  onMove
}: {
  opportunity: Opportunity;
  onOpen: () => void;
  onMove: (id: number, stage: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity }
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none cursor-grab transition-[transform,box-shadow,opacity] hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'z-10 scale-[1.02] opacity-40 shadow-xl' : ''
      }`}
      onClick={onOpen}
    >
      <CardContent className='flex flex-col gap-3 p-4'>
        <div>
          <p className='font-medium'>{opportunity.title}</p>
          <p className='text-sm text-muted-foreground'>{opportunity.customer}</p>
        </div>
        <div className='flex items-end justify-between'>
          <span className='text-lg font-semibold'>{money(opportunity.value)}</span>
          <span className='text-xs text-muted-foreground'>{opportunity.probability}%</span>
        </div>
        <Progress value={opportunity.probability} className='h-1.5' />
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{opportunity.owner}</span>
          <span>Cierra {opportunity.close}</span>
        </div>
        <select
          aria-label='Mover etapa'
          value={opportunity.stage}
          onChange={(event) => {
            event.stopPropagation();
            onMove(opportunity.id, event.target.value);
          }}
          onClick={(event) => event.stopPropagation()}
          className='rounded-md border bg-background px-2 py-1 text-xs'
        >
          {stages.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </CardContent>
    </Card>
  );
}

function OpportunityColumn({ stage, children }: { stage: string; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      className={`flex min-w-[250px] flex-1 flex-col gap-3 rounded-xl p-3 transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/35'
      }`}
    >
      <div className='flex items-center justify-between'>
        <h2 className='text-sm font-semibold'>{stage}</h2>
        <Badge variant='secondary'>{Children.count(children)}</Badge>
      </div>
      <div className='flex min-h-24 flex-col gap-3'>{children}</div>
    </section>
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

export function OpportunitiesPage({ detailId }: { detailId?: string }) {
  const [opportunities, setOpportunities] = useState(seed);
  const [selected, setSelected] = useState<Opportunity | null>(
    detailId ? (seed.find((item) => String(item.id) === detailId) ?? null) : null
  );
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const filtered = useMemo(
    () =>
      opportunities.filter((item) =>
        `${item.title} ${item.customer}`.toLowerCase().includes(query.toLowerCase())
      ),
    [opportunities, query]
  );
  const move = (id: number, stage: string) =>
    setOpportunities((items) => items.map((item) => (item.id === id ? { ...item, stage } : item)));
  if (detailId && selected)
    return (
      <OpportunityDetail
        opportunity={selected}
        onMove={(stage) => {
          move(selected.id, stage);
          setSelected({ ...selected, stage });
        }}
      />
    );
  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
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
          <Button>Nueva oportunidad</Button>
        </div>
      </div>
      <Pulse />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event: DragStartEvent) => setActiveId(Number(event.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(event: DragEndEvent) => {
          const destination = event.over?.id;
          if (typeof destination === 'string' && stages.includes(destination)) {
            move(Number(event.active.id), destination);
          }
          setActiveId(null);
        }}
      >
        <div className='min-w-0 overflow-x-auto pb-2'>
          <div className='flex min-w-max gap-4'>
            {stages.map((stage) => (
              <OpportunityColumn key={stage} stage={stage}>
                {filtered
                  .filter((item) => item.stage === stage)
                  .map((item) => (
                    <OpportunityCard
                      key={item.id}
                      opportunity={item}
                      onOpen={() => setSelected(item)}
                      onMove={move}
                    />
                  ))}
              </OpportunityColumn>
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className='w-[250px] rotate-[1deg] rounded-xl shadow-2xl'>
              <OpportunityCard
                opportunity={opportunities.find((item) => item.id === activeId) ?? seed[0]}
                onOpen={() => undefined}
                onMove={move}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function OpportunityDetail({
  opportunity,
  onMove
}: {
  opportunity: Opportunity;
  onMove: (stage: string) => void;
}) {
  const [note, setNote] = useState('');
  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
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
        {[
          ['Valor', money(opportunity.value)],
          ['Probabilidad', `${opportunity.probability}%`],
          ['Cierre esperado', opportunity.close],
          ['Salud', opportunity.probability > 60 ? 'Fuerte' : 'En riesgo']
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className='p-4'>
              <p className='text-xs text-muted-foreground'>{label}</p>
              <p className='mt-1 font-semibold'>{value}</p>
            </CardContent>
          </Card>
        ))}
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
          <select
            aria-label='Cambiar etapa'
            value={opportunity.stage}
            onChange={(event) => onMove(event.target.value)}
            className='rounded-md border bg-background p-2'
          >
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </CardContent>
      </Card>
    </main>
  );
}

export function OperatingSystemPage({
  kind
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
  const [items, setItems] = useState(
    kind === 'goals'
      ? ['20 nuevos clientes', '50.000 € en pipeline', '100 tareas completadas']
      : ['Nuevo cliente', 'Seguimiento comercial', 'Onboarding']
  );
  const [open, setOpen] = useState<string | null>(null);
  return (
    <main className='flex flex-1 flex-col gap-6 p-4 md:p-6'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <p className='text-sm font-medium text-primary'>WORKSPACE</p>
          <h1 className='text-2xl font-semibold'>{titles[kind]}</h1>
          <p className='text-sm text-muted-foreground'>Procesa lo importante sin perder el foco.</p>
        </div>
        <Button onClick={() => setItems((current) => [...current, 'Nuevo elemento'])}>Crear</Button>
      </div>
      <Pulse />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {items.map((item, index) => (
          <Card
            key={`${item}-${index}`}
            className='cursor-pointer hover:shadow-md'
            onClick={() => setOpen(item)}
          >
            <CardHeader>
              <div className='flex items-start justify-between gap-3'>
                <CardTitle className='text-base'>{item}</CardTitle>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                  {kind === 'goals' ? `${58 + index * 12}%` : 'Activo'}
                </Badge>
              </div>
              <CardDescription>Siguiente acción recomendada</CardDescription>
            </CardHeader>
            <CardContent>
              {kind === 'goals' ? (
                <Progress value={58 + index * 12} />
              ) : (
                <p className='text-sm text-muted-foreground'>
                  Abrir contexto y ver elementos relacionados.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Sheet open={Boolean(open)} onOpenChange={(value) => !value && setOpen(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{open}</SheetTitle>
          </SheetHeader>
          <div className='flex flex-col gap-4 p-4'>
            <p className='text-sm text-muted-foreground'>
              Este contexto está conectado con clientes, tareas y próximos pasos.
            </p>
            <Button onClick={() => setOpen(null)}>Resolver y cerrar</Button>
          </div>
        </SheetContent>
      </Sheet>
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
              <input
                type='checkbox'
                aria-label={`Enable ${name}`}
                checked={enabled}
                onChange={() =>
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Contexto rápido</SheetTitle>
          </SheetHeader>
          <div className='flex flex-col gap-4 p-4'>
            <Badge>Cliente · María López</Badge>
            <p className='text-sm text-muted-foreground'>
              3 tareas abiertas · 2 eventos · 1 oportunidad
            </p>
            <Button onClick={() => setOpen(false)}>Programar próximo paso</Button>
          </div>
        </SheetContent>
      </Sheet>
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Atajos de teclado</SheetTitle>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>
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
