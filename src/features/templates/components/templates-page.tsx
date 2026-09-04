'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

type Template = { id: string; name: string; text: string };
const STORAGE_KEY = 'crm-text-templates';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    try {
      setTemplates(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {
      setTemplates([]);
    }
  }, []);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selected) ?? null,
    [templates, selected]
  );

  const save = () => {
    if (!name.trim() || !text.trim()) return;
    const template = { id: selected ?? crypto.randomUUID(), name: name.trim(), text: text.trim() };
    setTemplates((current) =>
      selected
        ? current.map((item) => (item.id === selected ? template : item))
        : [template, ...current]
    );
    setName('');
    setText('');
    setSelected(null);
  };
  const copy = async (template: Template) => {
    await navigator.clipboard.writeText(template.text);
  };
  const resolve = (value: string, customerName?: string) =>
    value.replace(/{{\s*nombre\s*}}/gi, customerName ?? '{{nombre}}');

  return (
    <PageContainer
      pageTitle='Plantillas de texto'
      pageDescription='Mensajes repetitivos listos para copiar y personalizar.'
    >
      <div className='grid gap-5 lg:grid-cols-[0.9fr_1.1fr]'>
        <section className='rounded-[var(--radius-xl)] border border-border/70 bg-card p-5 sm:p-6'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
                Magic Templates
              </p>
              <h2 className='mt-1 text-lg font-semibold'>Tus textos frecuentes</h2>
            </div>
            <Link
              href='/dashboard/today'
              className='text-muted-foreground text-sm hover:text-foreground'
            >
              Hoy
            </Link>
          </div>
          <div className='mt-4 flex flex-col gap-2'>
            {templates.map((template) => (
              <button
                key={template.id}
                type='button'
                onClick={() => {
                  setSelected(template.id);
                  setName(template.name);
                  setText(template.text);
                }}
                className='rounded-2xl border border-border/50 bg-background/50 px-4 py-3 text-left transition-colors hover:bg-muted/40'
              >
                <div className='flex items-center justify-between gap-3'>
                  <span className='font-medium'>{template.name}</span>
                  <Icons.chevronRight className='size-4 shrink-0' />
                </div>
                <span className='text-muted-foreground mt-1 block truncate text-xs'>
                  {template.text}
                </span>
              </button>
            ))}
            {!templates.length && (
              <p className='text-muted-foreground py-6 text-sm'>
                Crea tu primer mensaje. Usa <code>{'{{nombre}}'}</code> para personalizarlo.
              </p>
            )}
          </div>
        </section>
        <section className='rounded-[var(--radius-xl)] border border-border/70 bg-background p-5 sm:p-6'>
          <p className='text-primary text-[10px] font-semibold uppercase tracking-[0.2em]'>
            {selectedTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
          </p>
          <div className='mt-4 flex flex-col gap-3'>
            <Input
              placeholder='Nombre'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Textarea
              className='min-h-36'
              placeholder='Hola {{nombre}}, te adjunto el presupuesto...'
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className='flex flex-wrap gap-2'>
              <Button onClick={save}>
                {selectedTemplate ? 'Guardar cambios' : 'Guardar plantilla'}
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setName('');
                  setText('');
                  setSelected(null);
                }}
              >
                Nueva
              </Button>
            </div>
            {selectedTemplate && (
              <div className='rounded-2xl border border-border/50 bg-card/60 p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.15em]'>Vista previa</p>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {resolve(selectedTemplate.text, 'Luis')}
                </p>
                <Button
                  variant='ghost'
                  size='sm'
                  className='mt-2'
                  onClick={() =>
                    void copy({ ...selectedTemplate, text: resolve(selectedTemplate.text, 'Luis') })
                  }
                >
                  <Icons.page className='size-4' />
                  Copiar con “Luis”
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
