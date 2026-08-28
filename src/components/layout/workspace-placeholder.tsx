import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';

const copy = {
  today: {
    title: 'Hoy',
    description: 'Tu agenda operativa para avanzar sin perder el contexto.',
    heading: 'Tu foco del día',
    body: 'Aquí aparecerán las tareas vencidas, seguimientos y eventos próximos.',
    action: 'Ir a tareas',
    href: '/dashboard/tasks'
  },
  activity: {
    title: 'Actividad',
    description: 'Un registro claro de los cambios recientes del espacio de trabajo.',
    heading: 'Actividad reciente',
    body: 'Cuando tu equipo cree tareas, clientes o eventos, los verás aquí.',
    action: 'Ver clientes',
    href: '/dashboard/customers'
  },
  team: {
    title: 'Equipo',
    description: 'Personas y permisos del espacio de trabajo.',
    heading: 'Miembros del equipo',
    body: 'Invita a tu equipo para compartir clientes, tareas y próximos pasos.',
    action: 'Gestionar equipo',
    href: '/dashboard/team'
  },
  settings: {
    title: 'Configuración',
    description: 'Ajusta la apariencia y los datos de tu espacio.',
    heading: 'Preferencias del espacio',
    body: 'La configuración de tema y cuenta está disponible desde tu perfil.',
    action: 'Abrir perfil',
    href: '/dashboard/profile'
  }
} as const;

export default function WorkspacePlaceholder({ section }: { section: keyof typeof copy }) {
  const content = copy[section];
  return (
    <PageContainer pageTitle={content.title} pageDescription={content.description}>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
        <Card className='min-h-[360px]'>
          <CardHeader className='flex flex-row items-start justify-between gap-4'>
            <div className='flex flex-col gap-1.5'>
              <CardTitle>{content.heading}</CardTitle>
              <CardDescription>{content.body}</CardDescription>
            </div>
            <Badge variant='secondary'>En vivo</Badge>
          </CardHeader>
          <CardContent>
            <Empty className='border-border/70 bg-muted/20 min-h-56 border border-dashed'>
              <EmptyHeader>
                <EmptyTitle>Todo despejado por ahora</EmptyTitle>
                <EmptyDescription>
                  Las novedades de tu organización aparecerán en este espacio.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className='flex w-full flex-col gap-3'>
                <div className='grid w-full gap-2 text-left sm:grid-cols-3'>
                  {(section === 'today'
                    ? [
                        'Revisar tareas vencidas',
                        'Confirmar seguimientos',
                        'Preparar próxima reunión'
                      ]
                    : section === 'activity'
                      ? ['Nuevos clientes', 'Tareas actualizadas', 'Eventos próximos']
                      : section === 'team'
                        ? ['Miembros activos', 'Invitaciones pendientes', 'Roles del espacio']
                        : ['Apariencia', 'Datos del espacio', 'Preferencias de cuenta']
                  ).map((item) => (
                    <div
                      key={item}
                      className='border-border/70 bg-background flex flex-col gap-2 rounded-lg border p-3'
                    >
                      <span className='text-sm font-medium'>{item}</span>
                      <span className='text-muted-foreground text-xs'>Sin novedades</span>
                    </div>
                  ))}
                </div>
                <Link className={buttonVariants({ variant: 'outline' })} href={content.href}>
                  <Icons.add data-icon='inline-start' />
                  {content.action}
                </Link>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Una vista rápida de lo importante.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center justify-between border-b pb-3 text-sm'>
              <span className='text-muted-foreground'>Pendientes</span>
              <strong>0</strong>
            </div>
            <div className='flex items-center justify-between border-b pb-3 text-sm'>
              <span className='text-muted-foreground'>Actualizado</span>
              <strong>Ahora</strong>
            </div>
            <div className='text-muted-foreground flex items-start gap-2 text-sm leading-6'>
              <Icons.info className='mt-1 shrink-0' /> Mantén tus datos al día para que este resumen
              sea accionable.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
