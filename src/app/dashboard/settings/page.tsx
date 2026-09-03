'use client';

import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

export default function Page() {
  const [workspaceSettings, setWorkspaceSettings] = useState({
    dailyDigest: true,
    dueSoonAlerts: true,
    mentions: true,
    compactMode: false,
    autoArchive: true
  });

  return (
    <PageContainer
      pageTitle='Configuración'
      pageDescription='Ajusta el espacio, la experiencia y las alertas para que el día fluya sin fricción.'
      pageHeaderAction={
        <Button variant='outline' size='sm'>
          Guardar cambios
        </Button>
      }
    >
      <div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <CardDescription>Espacio</CardDescription>
                <CardTitle>Mi Workspace</CardTitle>
              </div>
              <Badge variant='secondary'>Pro</Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-2xl border border-border/60 bg-muted/30 p-3'>
                <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Dueño</p>
                <p className='mt-2 text-sm font-medium'>Alex</p>
              </div>
              <div className='rounded-2xl border border-border/60 bg-muted/30 p-3'>
                <p className='text-muted-foreground text-xs uppercase tracking-[0.2em]'>Zona</p>
                <p className='mt-2 text-sm font-medium'>España / Madrid</p>
              </div>
            </div>

            <div className='rounded-2xl border border-border/60 bg-background/60 p-3'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-sm font-medium'>Tema visual</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Cambia la identidad del espacio.
                  </p>
                </div>
                <Icons.palette className='text-muted-foreground size-4' />
              </div>
              <div className='mt-3'>
                <ThemeSelector />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Resumen</CardDescription>
            <CardTitle>Estado del trabajo</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Miembros</span>
              <strong className='text-sm'>8</strong>
            </div>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Tareas abiertas</span>
              <strong className='text-sm'>24</strong>
            </div>
            <div className='flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 p-3'>
              <span className='text-sm text-muted-foreground'>Próximos eventos</span>
              <strong className='text-sm'>6</strong>
            </div>
          </CardContent>
        </Card>

        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardDescription>Preferencias</CardDescription>
            <CardTitle>Notificaciones y flujo</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-2'>
              <SettingToggle
                label='Resumen diario'
                description='Recibe un resumen del día y las próximas decisiones.'
                checked={workspaceSettings.dailyDigest}
                onCheckedChange={(checked) =>
                  setWorkspaceSettings((current) => ({ ...current, dailyDigest: checked }))
                }
              />
              <SettingToggle
                label='Alertas de vencimiento'
                description='Avisos antes de que una tarea o seguimiento se atrase.'
                checked={workspaceSettings.dueSoonAlerts}
                onCheckedChange={(checked) =>
                  setWorkspaceSettings((current) => ({ ...current, dueSoonAlerts: checked }))
                }
              />
              <SettingToggle
                label='Menciones y comentarios'
                description='Notificaciones cada vez que alguien mencione o responda.'
                checked={workspaceSettings.mentions}
                onCheckedChange={(checked) =>
                  setWorkspaceSettings((current) => ({ ...current, mentions: checked }))
                }
              />
              <SettingToggle
                label='Modo compacto'
                description='Reduce el aire visual para ver más contenido a la vez.'
                checked={workspaceSettings.compactMode}
                onCheckedChange={(checked) =>
                  setWorkspaceSettings((current) => ({ ...current, compactMode: checked }))
                }
              />
              <SettingToggle
                label='Archivado automático'
                description='Archiva tareas cerradas después de la revisión semanal.'
                checked={workspaceSettings.autoArchive}
                onCheckedChange={(checked) =>
                  setWorkspaceSettings((current) => ({ ...current, autoArchive: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className='flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-3'>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>{label}</p>
        <p className='text-muted-foreground mt-1 text-xs leading-5'>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}
