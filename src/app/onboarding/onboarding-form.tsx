'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type Plan = 'solo' | 'team';

const TOTAL_STEPS = 4;

const INDUSTRIES = [
  { value: 'services', label: 'Servicios' },
  { value: 'real-estate', label: 'Inmobiliaria' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'retail', label: 'Comercio' },
  { value: 'creative', label: 'Creativo / Agencia' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'other', label: 'Otro' }
] as const;

const USE_CASES = [
  { value: 'customers', label: 'Clientes y seguimiento' },
  { value: 'sales', label: 'Ventas y oportunidades' },
  { value: 'tasks', label: 'Trabajo y tareas' },
  { value: 'calendar', label: 'Calendario y agenda' },
  { value: 'everything', label: 'Un poco de todo' }
] as const;

export default function OnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [mainUseCase, setMainUseCase] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const displayName = authClient.useSession().data?.user.name?.trim() || 'tu espacio';

  function clearError() {
    if (error) setError('');
  }

  function next() {
    clearError();

    if (step === 1 && !plan) {
      setError('Elige cómo trabajas para continuar.');
      return;
    }

    if (step === 2 && !workspaceName.trim()) {
      setError('Escribe un nombre para tu espacio.');
      return;
    }

    if (step === 3 && !industry) {
      setError('Elige el sector que más se parezca a tu negocio.');
      return;
    }

    if (step === 3 && plan === 'team') {
      const size = Number(teamSize);
      if (!Number.isInteger(size) || size < 2 || size > 500) {
        setError('Indica un número de personas entre 2 y 500.');
        return;
      }
    }

    if (step === 4 && !mainUseCase) {
      setError('Elige qué quieres organizar principalmente.');
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function back() {
    clearError();
    setStep((current) => Math.max(current - 1, 1));
  }

  async function finish() {
    clearError();
    setPending(true);

    const numericTeamSize = plan === 'team' ? Number(teamSize) : 1;
    const seatLimit = plan === 'team' ? numericTeamSize : 1;

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName.trim(),
          plan,
          seatLimit,
          industry,
          teamSize: numericTeamSize,
          mainUseCase
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'No se pudo crear tu espacio.');
        setPending(false);
        return;
      }

      await authClient.getSession();
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      await queryClient.invalidateQueries({ queryKey: ['organization-context'] });
      router.refresh();
      router.push('/dashboard/today');
    } catch (requestError) {
      console.error('[onboarding]', requestError);
      setError(
        'No se pudo completar la configuración. Comprueba tu conexión y vuelve a intentarlo.'
      );
      setPending(false);
    }
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <main className='bg-muted/20 flex min-h-screen items-center justify-center px-5 py-8 sm:px-6'>
      <div className='w-full max-w-[600px]'>
        <div className='mb-8 flex items-center justify-between gap-6'>
          <div className='flex items-center gap-2.5'>
            <span className='bg-primary flex size-8 items-center justify-center rounded-[10px] text-sm font-semibold text-primary-foreground'>
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold tracking-tight'>Tu espacio</p>
              <p className='text-muted-foreground text-xs'>Configuración inicial</p>
            </div>
          </div>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {step} de {TOTAL_STEPS}
          </span>
        </div>

        <div className='mb-10 h-1 overflow-hidden rounded-full bg-border/70' aria-hidden='true'>
          <div
            className='bg-primary h-full rounded-full transition-[width] duration-300 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className='bg-background rounded-[28px] border border-border/70 p-6 shadow-[0_18px_45px_rgba(23,32,25,0.06)] sm:p-10'>
          {step === 1 && (
            <StepShell
              eyebrow='Empecemos'
              title='¿Cómo trabajas?'
              description='Esto nos ayuda a preparar tu espacio con la estructura adecuada.'
            >
              <div className='grid gap-3'>
                <ChoiceCard
                  selected={plan === 'solo'}
                  onClick={() => {
                    clearError();
                    setPlan('solo');
                    setTeamSize('1');
                  }}
                  title='Trabajo por mi cuenta'
                  description='Un espacio para ti, sin empleados.'
                  trailing='Autónomo'
                />
                <ChoiceCard
                  selected={plan === 'team'}
                  onClick={() => {
                    clearError();
                    setPlan('team');
                    if (!teamSize || teamSize === '1') setTeamSize('2');
                  }}
                  title='Tengo un equipo'
                  description='Un espacio para ti y las personas con las que trabajas.'
                  trailing='Equipo'
                />
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow='Tu espacio'
              title='¿Cómo quieres llamarlo?'
              description='Puedes cambiarlo más adelante. Lo verás en tu panel y en tu equipo.'
            >
              <div className='space-y-3'>
                <label className='text-sm font-medium' htmlFor='workspace-name'>
                  Nombre del espacio
                </label>
                <Input
                  id='workspace-name'
                  autoFocus
                  value={workspaceName}
                  onChange={(event) => {
                    clearError();
                    setWorkspaceName(event.target.value);
                  }}
                  placeholder='Ej. Estudio Norte'
                  maxLength={80}
                  className='h-12 rounded-[14px] px-4 text-base md:text-base'
                />
                <p className='text-muted-foreground text-xs'>
                  Un nombre corto y reconocible suele funcionar mejor.
                </p>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              eyebrow='Un poco más'
              title='Cuéntanos sobre tu negocio'
              description='Solo necesitamos un par de datos para adaptar la experiencia.'
            >
              <div className='space-y-7'>
                <ChoiceGrid
                  label='Sector'
                  options={INDUSTRIES}
                  value={industry}
                  onChange={(value) => {
                    clearError();
                    setIndustry(value);
                  }}
                />

                {plan === 'team' && (
                  <TeamSizeField
                    value={teamSize}
                    onChange={(value) => {
                      clearError();
                      setTeamSize(value);
                    }}
                  />
                )}
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              eyebrow='Último paso'
              title='¿Qué quieres organizar primero?'
              description='Lo usaremos para poner en primer plano lo que más te importa.'
            >
              <ChoiceGrid
                options={USE_CASES}
                value={mainUseCase}
                onChange={(value) => {
                  clearError();
                  setMainUseCase(value);
                }}
              />
            </StepShell>
          )}

          {error && (
            <div
              className='bg-destructive/8 text-destructive mt-7 rounded-[14px] px-4 py-3 text-sm'
              role='alert'
            >
              {error}
            </div>
          )}

          <div className='mt-9 flex items-center justify-between gap-3'>
            <Button type='button' variant='ghost' onClick={back} disabled={step === 1 || pending}>
              Atrás
            </Button>

            {step < TOTAL_STEPS ? (
              <Button type='button' size='lg' onClick={next}>
                Continuar
                <Icons.arrowRight />
              </Button>
            ) : (
              <Button type='button' size='lg' onClick={finish} disabled={pending}>
                {pending ? 'Preparando tu espacio…' : 'Entrar al panel'}
                {!pending && <Icons.arrowRight />}
              </Button>
            )}
          </div>
        </section>

        <p className='text-muted-foreground mt-5 text-center text-xs'>
          Podrás cambiar estos datos más adelante desde la configuración.
        </p>
      </div>
    </main>
  );
}

function StepShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className='text-primary mb-2 text-xs font-semibold tracking-[0.12em] uppercase'>
        {eyebrow}
      </p>
      <h1 className='text-3xl font-semibold tracking-[-0.03em] sm:text-[2.15rem]'>{title}</h1>
      <p className='text-muted-foreground mt-3 max-w-[520px] text-sm leading-6 sm:text-base'>
        {description}
      </p>
      <div className='mt-8'>{children}</div>
    </>
  );
}

function TeamSizeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parsedValue = Number(value);
  const currentValue = Number.isInteger(parsedValue) && parsedValue >= 2 ? parsedValue : 2;

  function update(nextValue: number) {
    const next = Math.min(500, Math.max(2, nextValue));
    onChange(String(next));
  }

  return (
    <div className='space-y-3'>
      <div>
        <p className='text-sm font-medium'>¿Cuántas personas necesitarán acceso?</p>
        <p className='text-muted-foreground mt-1 text-xs leading-5'>
          Indica el número exacto de personas que utilizarán este espacio.
        </p>
      </div>

      <div className='flex w-full items-center rounded-[16px] border border-border/80 bg-background p-2'>
        <button
          type='button'
          onClick={() => update(currentValue - 1)}
          disabled={currentValue <= 2}
          className='flex size-11 shrink-0 items-center justify-center rounded-[12px] text-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35'
          aria-label='Reducir número de personas'
        >
          −
        </button>

        <div className='flex min-w-0 flex-1 items-center justify-center gap-2'>
          <input
            type='number'
            inputMode='numeric'
            min={2}
            max={500}
            step={1}
            value={value || '2'}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^0-9]/g, '');
              if (!raw) {
                onChange('');
                return;
              }
              const next = Math.min(500, Math.max(2, Number(raw)));
              onChange(String(next));
            }}
            className='w-20 border-0 bg-transparent text-center text-2xl font-semibold tabular-nums outline-none ring-0 focus-visible:ring-0'
            aria-label='Número de personas'
          />
          <span className='text-muted-foreground text-sm'>personas</span>
        </div>

        <button
          type='button'
          onClick={() => update(currentValue + 1)}
          disabled={currentValue >= 500}
          className='flex size-11 shrink-0 items-center justify-center rounded-[12px] text-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35'
          aria-label='Aumentar número de personas'
        >
          +
        </button>
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  trailing
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  trailing: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-4 rounded-[18px] border px-5 py-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-200',
        'hover:-translate-y-px hover:bg-muted/60',
        selected
          ? 'border-primary bg-accent/55 shadow-[0_0_0_1px_var(--primary)]'
          : 'border-border/80 bg-background'
      )}
      aria-pressed={selected}
    >
      <span className='min-w-0'>
        <span className='block font-medium'>{title}</span>
        <span className='text-muted-foreground mt-1 block text-sm leading-5'>{description}</span>
      </span>
      <span className='flex shrink-0 items-center gap-2'>
        <span className='text-muted-foreground hidden text-sm sm:inline'>{trailing}</span>
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full border transition-colors',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
          )}
          aria-hidden='true'
        >
          {selected && <Icons.check className='size-3.5' />}
        </span>
      </span>
    </button>
  );
}

function ChoiceGrid({
  label,
  options,
  value,
  onChange,
  suffix
}: {
  label?: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div className='space-y-3'>
      {label && <p className='text-sm font-medium'>{label}</p>}
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3'>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type='button'
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-12 rounded-[14px] border px-3.5 py-3 text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-200',
                selected
                  ? 'border-primary bg-accent/55 text-foreground shadow-[0_0_0_1px_var(--primary)]'
                  : 'border-border/80 bg-background hover:bg-muted/60'
              )}
              aria-pressed={selected}
            >
              <span className='flex items-center justify-between gap-2'>
                <span>{option.label}</span>
                {selected && <Icons.check className='text-primary size-4 shrink-0' />}
              </span>
              {suffix && (
                <span className='text-muted-foreground mt-0.5 block text-xs'>{suffix}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
