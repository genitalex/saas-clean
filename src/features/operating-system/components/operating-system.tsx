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
import { createEvent, eventKeys, getEvents, updateEvent } from '@/features/calendar/queries';
import { getTasks, taskKeys, updateTask } from '@/features/tasks/queries';
import type { Task } from '@/features/tasks/types';

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
      className={`touch-none cursor-grab transition-[transform,opacity] active:cursor-grabbing ${
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
        <NativeSelect
          aria-label='Mover etapa'
          value={opportunity.stage}
          onChange={(event) => {
            event.stopPropagation();
            onMove(opportunity.id, event.target.value);
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {stages.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {option}
            </NativeSelectOption>
          ))}
        </NativeSelect>
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
