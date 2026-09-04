'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { LiquidGlassSurface } from '@/components/ui/liquid-glass';

type PresetName = 'clear' | 'regular' | 'strong' | 'refractive';
type ComponentName =
  | 'surface'
  | 'button'
  | 'menu'
  | 'popover'
  | 'sheet'
  | 'dialog'
  | 'command'
  | 'navigation';
type BackgroundName = 'white' | 'gradient' | 'pattern' | 'image';

interface MaterialConfig {
  material: PresetName;
  blur: number;
  displacementScale: number;
  distortion: number;
  turbulenceFrequency: number;
  turbulenceSeed: number;
  saturation: number;
  opacity: number;
  tintColor: string;
  borderOpacity: number;
  radius: number;
  shadowIntensity: number;
  shadowSpread: number;
  highlightIntensity: number;
  highlightPosition: number;
  glassDepth: number;
  glassBorder: boolean;
}

interface SavedConfig {
  name: string;
  config: MaterialConfig;
}

const STORAGE_KEY = 'glass-lab-configurations';

const presets: Record<PresetName, Omit<MaterialConfig, 'material'>> = {
  clear: {
    blur: 2,
    displacementScale: 32,
    distortion: 0.7,
    turbulenceFrequency: 0.01,
    turbulenceSeed: 1.5,
    saturation: 100,
    opacity: 18,
    tintColor: '#ffffff',
    borderOpacity: 28,
    radius: 24,
    shadowIntensity: 8,
    shadowSpread: 4,
    highlightIntensity: 50,
    highlightPosition: 50,
    glassDepth: 30,
    glassBorder: true
  },
  regular: {
    blur: 5,
    displacementScale: 72,
    distortion: 1,
    turbulenceFrequency: 0.008,
    turbulenceSeed: 2,
    saturation: 110,
    opacity: 24,
    tintColor: '#ffffff',
    borderOpacity: 42,
    radius: 28,
    shadowIntensity: 14,
    shadowSpread: 8,
    highlightIntensity: 65,
    highlightPosition: 50,
    glassDepth: 50,
    glassBorder: true
  },
  strong: {
    blur: 10,
    displacementScale: 124,
    distortion: 1.2,
    turbulenceFrequency: 0.006,
    turbulenceSeed: 3,
    saturation: 118,
    opacity: 30,
    tintColor: '#ffffff',
    borderOpacity: 58,
    radius: 32,
    shadowIntensity: 22,
    shadowSpread: 14,
    highlightIntensity: 78,
    highlightPosition: 42,
    glassDepth: 72,
    glassBorder: true
  },
  refractive: {
    blur: 3,
    displacementScale: 72,
    distortion: 1.7,
    turbulenceFrequency: 0.012,
    turbulenceSeed: 7,
    saturation: 125,
    opacity: 22,
    tintColor: '#f8fbff',
    borderOpacity: 48,
    radius: 28,
    shadowIntensity: 16,
    shadowSpread: 10,
    highlightIntensity: 70,
    highlightPosition: 62,
    glassDepth: 65,
    glassBorder: true
  }
};

const componentNames: Array<{ value: ComponentName; label: string }> = [
  { value: 'surface', label: 'Surface' },
  { value: 'button', label: 'Button' },
  { value: 'menu', label: 'Menu' },
  { value: 'popover', label: 'Popover' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'command', label: 'Command Bar' },
  { value: 'navigation', label: 'Navigation' }
];

const backgroundNames: Array<{ value: BackgroundName; label: string }> = [
  { value: 'white', label: 'Blanco' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'image', label: 'Image' }
];

const initialConfig: MaterialConfig = { material: 'regular', ...presets.regular };

function toRgba(hex: string, opacity: number) {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
}

function Control({
  label,
  value,
  min,
  max,
  step,
  suffix = '',
  disabled = false,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className='block space-y-2'>
      <span className='flex items-center justify-between gap-3 text-xs font-medium text-slate-700'>
        <span>{label}</span>
        <span className='font-mono text-[11px] text-slate-500'>
          {value}
          {suffix}
          {disabled ? ' / fixed' : ''}
        </span>
      </span>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className='h-1.5 w-full cursor-pointer accent-slate-950 disabled:cursor-not-allowed disabled:opacity-40'
      />
    </label>
  );
}

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className='block space-y-2'>
      <span className='text-xs font-medium text-slate-700'>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className='h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='border-b border-slate-200 px-5 py-5 last:border-b-0'>
      <h2 className='mb-4 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase'>
        {title}
      </h2>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

function PatternBackground() {
  return (
    <div className='absolute inset-0 overflow-hidden bg-[#f2f0eb] text-slate-950'>
      <div className='absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_23px,#101828_24px,#101828_25px)] opacity-80' />
      <div className='absolute top-8 left-8 h-10 w-28 border-2 border-slate-950 bg-white' />
      <div className='absolute right-12 bottom-10 h-20 w-20 bg-slate-950' />
      <p className='absolute top-14 right-12 text-4xl font-semibold tracking-[-0.04em]'>REFRACT</p>
      <p className='absolute bottom-12 left-10 max-w-48 text-xs font-semibold tracking-[0.18em] uppercase'>
        Edge / blur / displacement / type
      </p>
    </div>
  );
}

function Background({ type }: { type: BackgroundName }) {
  if (type === 'pattern') return <PatternBackground />;
  if (type === 'image') {
    return (
      <div
        className='absolute inset-0 bg-cover bg-center'
        style={{ backgroundImage: "url('/placeholder.jpg')" }}
      />
    );
  }
  if (type === 'gradient') {
    return (
      <div className='absolute inset-0 bg-[linear-gradient(135deg,#f5f2ec_0%,#b8d2d6_48%,#f2c9a6_100%)]' />
    );
  }
  return <div className='absolute inset-0 bg-white' />;
}

function BehindContent() {
  return (
    <div aria-hidden='true' className='absolute inset-0 overflow-hidden text-slate-950'>
      <div className='absolute top-8 left-8 h-px w-[calc(100%-4rem)] bg-slate-950' />
      <div className='absolute top-1/2 left-0 h-px w-full -rotate-6 bg-slate-950' />
      <div className='absolute top-14 left-14 h-16 w-16 rotate-12 border-2 border-slate-950' />
      <div className='absolute right-20 bottom-14 h-20 w-20 rounded-full border-2 border-slate-950' />
      <div className='absolute right-12 bottom-8 h-24 w-2 rotate-45 bg-slate-950' />
      <p className='absolute top-1/2 left-10 -translate-y-1/2 text-[clamp(2rem,6vw,5rem)] font-semibold tracking-[-0.06em]'>
        REFRACTION
      </p>
      <p className='absolute right-10 bottom-10 text-xs font-semibold tracking-[0.22em] uppercase'>
        type / line / form
      </p>
    </div>
  );
}

function PreviewContent({ component }: { component: ComponentName }) {
  const label = componentNames.find((item) => item.value === component)?.label;
  if (component === 'button') {
    return (
      <button className='rounded-full bg-slate-950 px-7 py-3 text-sm font-semibold text-white'>
        Primary action
      </button>
    );
  }
  if (component === 'command') {
    return (
      <div className='flex w-full max-w-md items-center justify-between gap-4 rounded-full border border-slate-300/70 bg-white/40 px-4 py-3 text-sm'>
        <span className='text-slate-500'>Search anything...</span>
        <kbd className='rounded-md border border-slate-300 bg-white/50 px-2 py-1 font-mono text-xs'>
          ⌘K
        </kbd>
      </div>
    );
  }
  if (component === 'navigation') {
    return (
      <nav className='flex items-center gap-5 rounded-full border border-slate-300/70 bg-white/40 px-5 py-3 text-sm font-medium'>
        <span>Studio</span>
        <span className='text-slate-500'>Work</span>
        <span className='text-slate-500'>Notes</span>
        <span className='h-2 w-2 rounded-full bg-emerald-500' />
      </nav>
    );
  }
  if (component === 'menu') {
    return (
      <div className='w-56 space-y-1 rounded-xl border border-slate-300/70 bg-white/45 p-2 text-sm'>
        <div className='rounded-lg bg-slate-950 px-3 py-2 text-white'>New project</div>
        <div className='px-3 py-2'>Duplicate</div>
        <div className='px-3 py-2 text-slate-500'>Archive</div>
      </div>
    );
  }
  if (component === 'sheet') {
    return (
      <div className='h-full w-full max-w-sm border-l border-slate-300/70 bg-white/35 p-6 text-sm'>
        Sheet surface
      </div>
    );
  }
  return (
    <div className='w-full max-w-md space-y-3 rounded-2xl border border-slate-300/70 bg-white/35 p-6'>
      <div className='flex items-center justify-between'>
        <span className='text-lg font-semibold'>{label}</span>
        <span className='h-2 w-2 rounded-full bg-emerald-500' />
      </div>
      <p className='text-sm text-slate-600'>
        One material configuration, adapted to a {label?.toLowerCase()} context.
      </p>
      <div className='h-px bg-slate-900/25' />
      <p className='text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase'>
        Live preview
      </p>
    </div>
  );
}

function GlassPreview({
  config,
  component,
  background
}: {
  config: MaterialConfig;
  component: ComponentName;
  background: BackgroundName;
}) {
  const effectiveDisplacement = Math.round(config.displacementScale * config.distortion);
  const tintAlpha = Math.min(0.8, (config.opacity / 100) * (0.6 + config.glassDepth / 250));
  const surfaceStyle: CSSProperties = {
    borderRadius: `${config.radius}px`,
    borderColor: `rgba(255, 255, 255, ${config.borderOpacity / 100})`,
    boxShadow: `0 ${Math.round(config.shadowSpread / 2)}px ${config.shadowSpread * 2}px rgba(15, 23, 42, ${config.shadowIntensity / 100})`,
    filter: `saturate(${config.saturation}%)`
  };
  const componentStyle: CSSProperties = {
    borderRadius:
      component === 'command' || component === 'navigation' || component === 'button'
        ? '999px'
        : `${config.radius}px`,
    padding: component === 'sheet' ? 0 : undefined
  };

  return (
    <div
      className='relative min-h-[min(620px,70vh)] overflow-hidden rounded-2xl border border-slate-200 bg-white'
      data-testid='glass-preview'
    >
      <Background type={background} />
      <BehindContent />
      <LiquidGlassSurface
        glassBorder={config.glassBorder}
        backdropBlur={config.blur}
        displacementScale={effectiveDisplacement}
        turbulenceBaseFrequency={config.turbulenceFrequency}
        turbulenceSeed={config.turbulenceSeed}
        tintColor={toRgba(config.tintColor, tintAlpha * 100)}
        style={{ ...surfaceStyle, ...componentStyle }}
        className={`absolute inset-8 flex items-center justify-center overflow-hidden text-slate-950 ${component === 'sheet' ? 'justify-end' : ''}`}
      >
        <PreviewContent component={component} />
      </LiquidGlassSurface>
      <div className='absolute right-4 bottom-4 rounded-full border border-white/70 bg-white/45 px-3 py-1.5 font-mono text-[10px] text-slate-600'>
        displacement {effectiveDisplacement} / blur {config.blur}px
      </div>
    </div>
  );
}

export default function GlassLabEditor() {
  const [config, setConfig] = useState<MaterialConfig>(initialConfig);
  const [component, setComponent] = useState<ComponentName>('surface');
  const [background, setBackground] = useState<BackgroundName>('white');
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [saveName, setSaveName] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      setSavedConfigs(
        JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedConfig[]
      );
    } catch {
      setSavedConfigs([]);
    }
  }, []);

  const effectiveDisplacement = useMemo(
    () => Math.round(config.displacementScale * config.distortion),
    [config.displacementScale, config.distortion]
  );

  function updateConfig<Key extends keyof MaterialConfig>(key: Key, value: MaterialConfig[Key]) {
    setConfig((current) => ({ ...current, [key]: value }));
    setNotice('');
  }

  function choosePreset(material: PresetName) {
    setConfig({ material, ...presets[material] });
    setNotice(`Preset ${material} cargado`);
  }

  function reset() {
    setConfig(initialConfig);
    setComponent('surface');
    setBackground('white');
    setNotice('Configuración restablecida');
  }

  async function copyConfig() {
    const payload = { ...config, effectiveDisplacementScale: effectiveDisplacement };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setNotice('JSON copiado al portapapeles');
  }

  function saveConfig() {
    const name = saveName.trim();
    if (!name) {
      setNotice('Escribe un nombre para guardar');
      return;
    }
    const next = [...savedConfigs.filter((item) => item.name !== name), { name, config }];
    setSavedConfigs(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSelectedSaved(name);
    setSaveName('');
    setNotice(`Configuración "${name}" guardada`);
  }

  function loadConfig(name: string) {
    setSelectedSaved(name);
    const saved = savedConfigs.find((item) => item.name === name);
    if (saved) setConfig(saved.config);
  }

  function deleteConfig() {
    if (!selectedSaved) return;
    const next = savedConfigs.filter((item) => item.name !== selectedSaved);
    setSavedConfigs(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSelectedSaved('');
    setNotice('Preset eliminado');
  }

  return (
    <div className='space-y-5 text-slate-950'>
      <header className='flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5'>
        <div>
          <p className='mb-2 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase'>
            Material Lab / Live editor
          </p>
          <h1 className='text-3xl font-semibold tracking-[-0.04em]'>Diseña el efecto Glass</h1>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-500'>
            Ajusta el motor SVG en tiempo real. Los parámetros no soportados por la API aparecen
            bloqueados para mantener la prueba honesta.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button
            type='button'
            onClick={reset}
            className='h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50'
          >
            Reset
          </button>
          <button
            type='button'
            onClick={copyConfig}
            className='h-9 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800'
          >
            Copy config
          </button>
        </div>
      </header>

      <div className='grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]'>
        <aside className='overflow-hidden rounded-2xl border border-slate-200 bg-[#fafafa]'>
          <Panel title='Material'>
            <SelectControl
              label='Preset / starting point'
              value={config.material}
              options={Object.keys(presets).map((value) => ({
                value: value as PresetName,
                label: value[0].toUpperCase() + value.slice(1)
              }))}
              onChange={choosePreset}
            />
            <Control
              label='Blur'
              value={config.blur}
              min={0}
              max={24}
              step={0.5}
              suffix=' px'
              onChange={(value) => updateConfig('blur', value)}
            />
            <Control
              label='Displacement scale'
              value={config.displacementScale}
              min={0}
              max={240}
              step={1}
              onChange={(value) => updateConfig('displacementScale', value)}
            />
            <Control
              label='Distortion / refraction'
              value={config.distortion}
              min={0.25}
              max={2}
              step={0.05}
              suffix='x'
              onChange={(value) => updateConfig('distortion', value)}
            />
            <p className='font-mono text-[11px] text-slate-500'>
              Effective displacement: {effectiveDisplacement}
            </p>
            <Control
              label='Turbulence frequency'
              value={config.turbulenceFrequency}
              min={0.001}
              max={0.02}
              step={0.001}
              onChange={(value) => updateConfig('turbulenceFrequency', value)}
            />
            <Control
              label='Turbulence seed'
              value={config.turbulenceSeed}
              min={0}
              max={20}
              step={0.5}
              onChange={(value) => updateConfig('turbulenceSeed', value)}
            />
            <Control
              label='Glass depth / intensity'
              value={config.glassDepth}
              min={0}
              max={100}
              step={1}
              suffix='%'
              onChange={(value) => updateConfig('glassDepth', value)}
            />
          </Panel>
          <Panel title='Surface finish'>
            <div className='flex items-center justify-between gap-3 text-xs font-medium text-slate-700'>
              <span>Tint color</span>
              <input
                aria-label='Tint color'
                type='color'
                value={config.tintColor}
                onChange={(event) => updateConfig('tintColor', event.target.value)}
                className='h-8 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1'
              />
            </div>
            <Control
              label='Opacity / tint alpha'
              value={config.opacity}
              min={5}
              max={70}
              step={1}
              suffix='%'
              onChange={(value) => updateConfig('opacity', value)}
            />
            <Control
              label='Saturation'
              value={config.saturation}
              min={50}
              max={160}
              step={1}
              suffix='%'
              onChange={(value) => updateConfig('saturation', value)}
            />
            <Control
              label='Border opacity'
              value={config.borderOpacity}
              min={0}
              max={100}
              step={1}
              suffix='%'
              onChange={(value) => updateConfig('borderOpacity', value)}
            />
            <Control
              label='Border radius'
              value={config.radius}
              min={0}
              max={56}
              step={1}
              suffix=' px'
              onChange={(value) => updateConfig('radius', value)}
            />
            <Control
              label='Shadow intensity'
              value={config.shadowIntensity}
              min={0}
              max={40}
              step={1}
              suffix='%'
              onChange={(value) => updateConfig('shadowIntensity', value)}
            />
            <Control
              label='Shadow spread'
              value={config.shadowSpread}
              min={0}
              max={32}
              step={1}
              suffix=' px'
              onChange={(value) => updateConfig('shadowSpread', value)}
            />
            <Control
              label='Highlight intensity'
              value={config.highlightIntensity}
              min={0}
              max={100}
              step={1}
              suffix='%'
              disabled
              onChange={() => undefined}
            />
            <Control
              label='Highlight position'
              value={config.highlightPosition}
              min={0}
              max={100}
              step={1}
              suffix='%'
              disabled
              onChange={() => undefined}
            />
            <p className='text-[11px] leading-4 text-slate-500'>
              Highlight intensity and position are fixed internally by `glassBorder`; the package
              exposes no runtime controls for them.
            </p>
          </Panel>
          <Panel title='Preview'>
            <SelectControl
              label='Component'
              value={component}
              options={componentNames}
              onChange={setComponent}
            />
            <SelectControl
              label='Background test'
              value={background}
              options={backgroundNames}
              onChange={setBackground}
            />
          </Panel>
          <Panel title='Export style'>
            <input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder='Nombre: Glass principal'
              className='h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
            />
            <button
              type='button'
              onClick={saveConfig}
              className='h-9 w-full rounded-lg border border-slate-300 bg-white text-sm font-medium hover:bg-slate-50'
            >
              Guardar configuración
            </button>
            <div className='flex gap-2'>
              <select
                value={selectedSaved}
                onChange={(event) => loadConfig(event.target.value)}
                className='h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm'
              >
                <option value=''>Recuperar preset...</option>
                {savedConfigs.map((saved) => (
                  <option key={saved.name} value={saved.name}>
                    {saved.name}
                  </option>
                ))}
              </select>
              <button
                type='button'
                onClick={deleteConfig}
                disabled={!selectedSaved}
                aria-label='Borrar preset seleccionado'
                className='h-9 rounded-lg border border-slate-200 px-3 text-sm hover:bg-red-50 disabled:opacity-40'
              >
                Borrar
              </button>
            </div>
          </Panel>
        </aside>

        <main className='min-w-0 space-y-4'>
          <GlassPreview config={config} component={component} background={background} />
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500'>
            <span>
              Library props: blur {config.blur}px / displacement {effectiveDisplacement} / frequency{' '}
              {config.turbulenceFrequency} / seed {config.turbulenceSeed}
            </span>
            <span className='font-mono text-slate-700'>react-liquid-glass-svg</span>
          </div>
          {notice && (
            <p role='status' className='text-sm text-slate-600'>
              {notice}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
