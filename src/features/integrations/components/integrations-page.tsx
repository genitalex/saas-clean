'use client';

import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconCode,
  IconDots,
  IconKey,
  IconLink,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconWebhook,
  IconX
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  activity,
  getIntegration,
  integrations,
  statusClass,
  statusLabel,
  toneClass,
  type Integration,
  type IntegrationCategory
} from '../data/integrations';

const categories: Array<'All' | IntegrationCategory> = [
  'All',
  'Calendar',
  'Communication',
  'Automation',
  'Developer tools'
];

function IntegrationMark({ integration }: { integration: Integration }) {
  return (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${toneClass(integration.tone)}`}
    >
      {integration.initials}
    </div>
  );
}

function IntegrationCard({
  integration,
  onOpen
}: {
  integration: Integration;
  onOpen: () => void;
}) {
  const disabled = integration.status === 'coming-soon';
  return (
    <Card className='group flex min-h-48 flex-col justify-between border-border/70 shadow-none transition hover:-translate-y-0.5 hover:shadow-md'>
      <CardHeader className='gap-4 pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <IntegrationMark integration={integration} />
          <Badge
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${statusClass(integration.status)}`}
          >
            {statusLabel(integration.status)}
          </Badge>
        </div>
        <div>
          <CardTitle className='text-base'>{integration.name}</CardTitle>
          <CardDescription className='mt-1 leading-relaxed'>
            {integration.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex items-center justify-between gap-3 pt-0'>
        <div className='min-w-0 text-xs text-muted-foreground'>
          {integration.account ? (
            <>
              <span className='truncate'>{integration.account}</span>
              <span className='block'>{integration.detail}</span>
            </>
          ) : (
            <span>{disabled ? 'We are working on it' : 'Ready to configure'}</span>
          )}
        </div>
        <Button
          size='sm'
          variant={integration.status === 'connected' ? 'outline' : 'default'}
          disabled={disabled}
          onClick={onOpen}
        >
          {integration.status === 'connected'
            ? 'Manage'
            : integration.status === 'attention'
              ? 'Reconnect'
              : 'Connect'}
          <IconChevronRight data-icon='inline-end' />
        </Button>
      </CardContent>
    </Card>
  );
}

function CalendarPanel({ onClose }: { onClose: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(true);
  const [syncMode, setSyncMode] = useState('two-way');
  const [selected, setSelected] = useState(['Work calendar']);
  const toggle = (name: string) =>
    setSelected((items) =>
      items.includes(name) ? items.filter((item) => item !== name) : [...items, name]
    );
  return (
    <div
      className='fixed inset-0 z-40 flex justify-end bg-foreground/20 backdrop-blur-[2px]'
      role='dialog'
      aria-modal='true'
      aria-label='Google Calendar settings'
    >
      <div className='bg-background flex h-full w-full max-w-xl flex-col overflow-y-auto border-l shadow-2xl'>
        <div className='flex items-center justify-between border-b px-6 py-5'>
          <div className='flex items-center gap-3'>
            <div className='bg-blue-500/10 flex size-10 items-center justify-center rounded-xl font-semibold text-blue-600'>
              G
            </div>
            <div>
              <h2 className='font-semibold'>Google Calendar</h2>
              <p className='text-sm text-muted-foreground'>Personal integration</p>
            </div>
          </div>
          <Button size='icon' variant='ghost' onClick={onClose} aria-label='Close'>
            <IconX />
          </Button>
        </div>
        <div className='flex flex-1 flex-col gap-6 p-6'>
          <div className='rounded-xl border border-blue-500/20 bg-blue-500/5 p-4'>
            <div className='flex items-start gap-3'>
              <IconCalendar className='mt-0.5 text-blue-600' />
              <div>
                <p className='font-medium'>Preview mode</p>
                <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
                  This connection is simulated locally. No calendar data or credentials leave this
                  preview.
                </p>
              </div>
            </div>
          </div>
          {!connected ? (
            <Card className='shadow-none'>
              <CardHeader>
                <CardTitle className='text-base'>Connect your account</CardTitle>
                <CardDescription>Choose which Google account you want to use.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className='w-full'
                  disabled={connecting}
                  onClick={() => {
                    setConnecting(true);
                    window.setTimeout(() => {
                      setConnecting(false);
                      setConnected(true);
                    }, 700);
                  }}
                >
                  {connecting ? 'Connecting…' : 'Continue with Google'}
                  <IconArrowUpRight data-icon='inline-end' />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <p className='mb-3 text-sm font-medium'>Account</p>
                <div className='flex items-center justify-between rounded-xl border p-3'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-muted flex size-9 items-center justify-center rounded-full text-sm font-medium'>
                      AA
                    </div>
                    <div>
                      <p className='text-sm font-medium'>Alex Anderson</p>
                      <p className='text-xs text-muted-foreground'>alex@northstar.studio</p>
                    </div>
                  </div>
                  <IconCheck className='text-emerald-600' />
                </div>
              </div>
              <div>
                <p className='mb-3 text-sm font-medium'>Calendars to sync</p>
                <div className='flex flex-col gap-2'>
                  {['Work calendar', 'Personal calendar', 'Team events'].map((name) => (
                    <button
                      type='button'
                      key={name}
                      onClick={() => toggle(name)}
                      className='flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/50'
                    >
                      <span
                        className={`flex size-5 items-center justify-center rounded-md border ${selected.includes(name) ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                      >
                        {selected.includes(name) && <IconCheck />}
                      </span>
                      <span className='text-sm'>{name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className='mb-3 text-sm font-medium'>Sync direction</p>
                <Tabs value={syncMode} onValueChange={(value) => setSyncMode(value)}>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='two-way'>Two-way</TabsTrigger>
                    <TabsTrigger value='to-app'>To app</TabsTrigger>
                    <TabsTrigger value='from-app'>From app</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Separator />
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>Last synced</p>
                    <p className='text-xs text-muted-foreground'>Today at 9:42 AM</p>
                  </div>
                  <Badge className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'>
                    <IconCheck /> Healthy
                  </Badge>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' className='flex-1' onClick={() => {}}>
                    <IconRefresh data-icon='inline-start' />
                    Sync now
                  </Button>
                  <Button variant='outline' className='flex-1' onClick={() => setConnected(false)}>
                    Disconnect
                  </Button>
                </div>
              </div>
              <Card className='border-amber-500/30 bg-amber-500/5 shadow-none'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    <IconAlertTriangle className='text-amber-600' />
                    Conflict resolution
                  </CardTitle>
                  <CardDescription>
                    When an event changes in both places, keep the most recently updated version.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant='outline' size='sm'>
                    Review conflict rules
                  </Button>
                </CardContent>
              </Card>
              <div>
                <p className='mb-3 text-sm font-medium'>Recent activity</p>
                <div className='flex flex-col gap-3'>
                  {activity.slice(0, 2).map(([time, label, source]) => (
                    <div key={time} className='flex items-center justify-between text-sm'>
                      <span>{label}</span>
                      <span className='text-xs text-muted-foreground'>{time}</span>
                      <span className='sr-only'>{source}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeveloperSurface({ kind }: { kind: 'api' | 'webhooks' }) {
  const [created, setCreated] = useState(false);
  const [enabled, setEnabled] = useState(true);
  return (
    <Card className='shadow-none'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          {kind === 'api' ? <IconKey /> : <IconWebhook />}
          {kind === 'api' ? 'API keys' : 'Webhooks'}
        </CardTitle>
        <CardDescription>
          {kind === 'api'
            ? 'Create scoped keys for internal tools and extensions.'
            : 'Deliver workspace events to your own endpoint.'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center justify-between rounded-xl border p-3'>
          <div>
            <p className='text-sm font-medium'>
              {kind === 'api'
                ? created
                  ? 'ns_live_••••••••••••'
                  : 'No keys created'
                : 'Activity events endpoint'}
            </p>
            <p className='text-xs text-muted-foreground'>
              {kind === 'api'
                ? 'Created just now · shown once'
                : 'https://hooks.example.com/northstar'}
            </p>
          </div>
          <Button
            size='sm'
            variant='outline'
            onClick={() => (kind === 'api' ? setCreated(true) : setEnabled(!enabled))}
          >
            {kind === 'api' ? 'Create key' : enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
        {kind === 'api' && created && (
          <div className='rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300'>
            Copy this secret now. It will be masked after you leave this view.
          </div>
        )}
        <Button variant='ghost' size='sm' className='self-start'>
          View delivery logs <IconArrowUpRight data-icon='inline-end' />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = useMemo(
    () =>
      integrations.filter(
        (item) =>
          (category === 'All' || item.category === category) &&
          `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())
      ),
    [category, query]
  );
  const personal = filtered.filter((item) => item.scope === 'personal');
  const workspace = filtered.filter((item) => item.scope === 'workspace');
  return (
    <>
      <div className='flex flex-col gap-8'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-end'>
          <div>
            <div className='mb-3 flex items-center gap-2'>
              <Badge variant='outline' className='rounded-full'>
                Extensions layer
              </Badge>
              <span className='text-xs text-muted-foreground'>Preview</span>
            </div>
            <h1 className='text-3xl font-semibold tracking-tight text-balance'>Integrations</h1>
            <p className='mt-2 max-w-2xl text-muted-foreground'>
              Connect the tools you already use. Personal connections stay private; workspace
              connections unlock shared automations.
            </p>
          </div>
          <Button variant='outline'>
            <IconCode data-icon='inline-start' />
            Developer docs
          </Button>
        </div>
        <div className='grid gap-3 sm:grid-cols-3'>
          <Card className='shadow-none'>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='rounded-lg bg-emerald-500/10 p-2 text-emerald-600'>
                <IconCheck />
              </div>
              <div>
                <p className='text-2xl font-semibold'>2</p>
                <p className='text-xs text-muted-foreground'>Connected</p>
              </div>
            </CardContent>
          </Card>
          <Card className='shadow-none'>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='rounded-lg bg-amber-500/10 p-2 text-amber-600'>
                <IconAlertTriangle />
              </div>
              <div>
                <p className='text-2xl font-semibold'>1</p>
                <p className='text-xs text-muted-foreground'>Needs attention</p>
              </div>
            </CardContent>
          </Card>
          <Card className='shadow-none'>
            <CardContent className='flex items-center gap-3 p-4'>
              <div className='rounded-lg bg-blue-500/10 p-2 text-blue-600'>
                <IconBolt />
              </div>
              <div>
                <p className='text-2xl font-semibold'>8</p>
                <p className='text-xs text-muted-foreground'>Available extensions</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className='flex flex-col gap-3 md:flex-row'>
          <div className='relative flex-1'>
            <IconSearch className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2' />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search integrations'
              className='pl-9'
            />
          </div>
          <Tabs
            value={category}
            onValueChange={(value) => setCategory(value as (typeof categories)[number])}
          >
            <TabsList className='h-auto flex-wrap justify-start'>
              <TabsTrigger value='All'>All</TabsTrigger>
              {categories.slice(1).map((item) => (
                <TabsTrigger key={item} value={item}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <section>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Personal</h2>
              <p className='text-sm text-muted-foreground'>Only visible to you</p>
            </div>
            <Badge variant='secondary'>Private by default</Badge>
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {personal.map((item) => (
              <IntegrationCard
                key={item.id}
                integration={item}
                onOpen={() => setSelected(item.id)}
              />
            ))}
          </div>
        </section>
        <section>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold'>Workspace</h2>
              <p className='text-sm text-muted-foreground'>Shared with your team</p>
            </div>
            <Button variant='ghost' size='sm'>
              Workspace settings <IconSettings data-icon='inline-end' />
            </Button>
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {workspace.map((item) => (
              <IntegrationCard
                key={item.id}
                integration={item}
                onOpen={() => setSelected(item.id)}
              />
            ))}
          </div>
        </section>
        <div className='grid gap-4 lg:grid-cols-2'>
          <DeveloperSurface kind='api' />
          <DeveloperSurface kind='webhooks' />
        </div>
        <Card className='shadow-none'>
          <CardHeader>
            <CardTitle className='text-base'>Activity</CardTitle>
            <CardDescription>Changes to your connections and extension layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-4'>
              {activity.map(([time, label, source]) => (
                <div key={time} className='flex items-center gap-3 text-sm'>
                  <div className='size-2 rounded-full bg-emerald-500' />
                  <span className='flex-1'>
                    {label}
                    <span className='ml-2 text-muted-foreground'>· {source}</span>
                  </span>
                  <span className='text-xs text-muted-foreground'>{time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {selected === 'google-calendar' && <CalendarPanel onClose={() => setSelected(null)} />}
      {selected && selected !== 'google-calendar' && (
        <div
          className='fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 p-4'
          onClick={() => setSelected(null)}
        >
          <Card className='w-full max-w-md shadow-xl' onClick={(event) => event.stopPropagation()}>
            <CardHeader>
              <CardTitle>{getIntegration(selected)?.name}</CardTitle>
              <CardDescription>
                Configuration is available in the full workspace experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setSelected(null)}>Done</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
