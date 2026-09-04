import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LiquidGlassSurface } from '@/components/ui/liquid-glass';

export const metadata = { title: 'Design Sandbox' };

export default function DesignSandboxPage() {
  return (
    <main
      data-design-id='design.sandbox'
      data-design-component='DesignSandbox'
      className='mx-auto flex w-full max-w-6xl flex-col gap-8 p-5 pb-24 md:p-10'
    >
      <header
        data-design-id='design.header'
        data-design-component='SandboxHeader'
        className='max-w-2xl'
      >
        <p className='text-primary text-xs font-semibold uppercase tracking-[0.18em]'>
          Internal tool
        </p>
        <h1 className='mt-2 text-4xl font-semibold tracking-tight'>Design Sandbox</h1>
        <p className='text-muted-foreground mt-3 text-base'>
          A living canvas of the components used across the workspace.
        </p>
      </header>
      <section
        data-design-id='design.typography'
        data-design-component='Typography'
        className='space-y-3'
      >
        <h2 className='text-2xl font-semibold'>Typography and status</h2>
        <p className='text-muted-foreground'>
          Headings, supporting copy, labels and status signals share the active theme.
        </p>
        <div className='flex flex-wrap gap-2'>
          <Badge data-design-id='badge.default' data-design-component='Badge'>
            On track
          </Badge>
          <Badge data-design-id='badge.secondary' data-design-component='Badge' variant='secondary'>
            In review
          </Badge>
          <Badge data-design-id='badge.outline' data-design-component='Badge' variant='outline'>
            Draft
          </Badge>
        </div>
      </section>
      <section
        data-design-id='design.controls'
        data-design-component='Controls'
        className='grid gap-4 md:grid-cols-2'
      >
        <Card
          data-design-id='card.default'
          data-design-component='Card'
          data-design-variant='default'
        >
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            <Button
              data-design-id='button.primary'
              data-design-component='Button'
              data-design-variant='primary'
            >
              Primary action
            </Button>
            <Button
              data-design-id='button.secondary'
              data-design-component='Button'
              data-design-variant='secondary'
              variant='secondary'
            >
              Secondary
            </Button>
            <Button
              data-design-id='button.outline'
              data-design-component='Button'
              data-design-variant='outline'
              variant='outline'
            >
              Outline
            </Button>
            <Button
              data-design-id='button.ghost'
              data-design-component='Button'
              data-design-variant='ghost'
              variant='ghost'
            >
              Ghost
            </Button>
          </CardContent>
        </Card>
        <Card data-design-id='card.input' data-design-component='Card' data-design-variant='input'>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Input
              data-design-id='input.default'
              data-design-component='Input'
              placeholder='Write a clear intention...'
            />
            <Input
              data-design-id='input.search'
              data-design-component='Input'
              placeholder='Search customers'
            />
          </CardContent>
        </Card>
      </section>
      <section
        data-design-id='design.surfaces'
        data-design-component='Surfaces'
        className='grid gap-4 md:grid-cols-2'
      >
        <LiquidGlassSurface
          data-design-id='surface.glass'
          data-design-component='Surface'
          className='min-h-40 p-6'
        >
          <h2 className='text-xl font-semibold'>Liquid surface</h2>
          <p className='text-muted-foreground mt-2 text-sm'>Material preview for Glass.</p>
        </LiquidGlassSurface>
        <Card
          data-design-id='calendar.event'
          data-design-component='CalendarEvent'
          data-design-variant='default'
        >
          <CardHeader>
            <CardTitle>Calendar Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='border-primary/30 bg-primary/10 rounded-lg border p-4'>
              <p className='font-medium'>Product review</p>
              <p className='text-muted-foreground mt-1 text-sm'>Today · 14:30</p>
            </div>
          </CardContent>
        </Card>
      </section>
      <section
        data-design-id='design.table'
        data-design-component='Table'
        className='rounded-2xl border border-border/60 bg-card/45 p-4'
      >
        <h2 className='mb-3 text-lg font-semibold'>Customer rows</h2>
        {['Acme Studio', 'Northstar Labs', 'Morrow & Co.'].map((name) => (
          <button
            data-design-id='customers.row'
            data-design-component='CustomerRow'
            key={name}
            type='button'
            className='flex w-full items-center justify-between border-t border-border/50 py-3 text-left text-sm first:border-t-0'
          >
            <span>{name}</span>
            <span className='text-muted-foreground'>Open context</span>
          </button>
        ))}
      </section>
    </main>
  );
}
