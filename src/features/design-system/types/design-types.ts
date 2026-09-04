export type DesignTheme = 'notebook' | 'mac' | 'vercel' | 'glass';
export type DesignState = 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'selected';
export type DesignViewport = 'desktop' | 'tablet' | 'mobile';

export interface StyleValues {
  [property: string]: string | undefined;
}

export interface MaterialValues {
  enabled: string;
  backdropBlur: string;
  tintColor: string;
  tintOpacity: string;
  displacementScale: string;
  turbulenceBaseFrequency: string;
  turbulenceSeed: string;
  glassBorder: string;
  saturation: string;
  brightness: string;
  contrast: string;
  refractionIntensity: string;
  highlightOpacity: string;
  borderRadius: string;
}

export interface DesignPreset {
  id: string;
  name: string;
  sourceId: string;
  styles: StyleValues;
  states: Partial<Record<DesignState, StyleValues>>;
  material?: MaterialValues;
  note: string;
  createdAt: string;
}

export interface DesignTarget {
  id: string;
  label: string;
  type: string;
  component: string;
  role: string;
  variant: string;
  source: string;
}

export interface DesignThemeState {
  tokens: Record<string, string>;
  components: Record<string, StyleValues>;
  elements: Record<string, StyleValues>;
  states: Record<string, Partial<Record<DesignState, StyleValues>>>;
  responsive: Record<string, Partial<Record<DesignViewport, StyleValues>>>;
  materials: Record<string, MaterialValues>;
  notes: Record<string, string>;
  presets: DesignPreset[];
}

export interface DesignDocument {
  version: 1;
  themes: Record<DesignTheme, DesignThemeState>;
}

export const DESIGN_THEMES: Array<{ value: DesignTheme; label: string; accent: string }> = [
  { value: 'notebook', label: 'Notebook', accent: '#d97706' },
  { value: 'mac', label: 'Mac / iOS', accent: '#0ea5e9' },
  { value: 'vercel', label: 'Vercel', accent: '#111827' },
  { value: 'glass', label: 'Glass', accent: '#14b8a6' }
];

export const STYLE_PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'overflow',
  'alignItems',
  'justifyContent',
  'flexDirection',
  'flexWrap',
  'gap',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textDecoration',
  'textAlign',
  'color',
  'background',
  'backgroundImage',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'boxShadow',
  'opacity',
  'filter',
  'backdropFilter',
  'transitionDuration',
  'transitionDelay',
  'transitionTimingFunction'
] as const;

export type StyleProperty = (typeof STYLE_PROPERTIES)[number];

export const INITIAL_GLASS_MATERIAL: MaterialValues = {
  enabled: 'true',
  backdropBlur: '7px',
  tintColor: 'rgba(0,0,0,0.14)',
  tintOpacity: '0.14',
  displacementScale: '170',
  turbulenceBaseFrequency: '0.008',
  turbulenceSeed: '0',
  glassBorder: 'true',
  saturation: '100%',
  brightness: '100%',
  contrast: '100%',
  refractionIntensity: '1',
  highlightOpacity: '0.2',
  borderRadius: '16px'
};

function emptyTheme(): DesignThemeState {
  return {
    tokens: {},
    components: {},
    elements: {},
    states: {},
    responsive: {},
    materials: {},
    notes: {},
    presets: []
  };
}

export function createDesignDocument(): DesignDocument {
  return {
    version: 1,
    themes: { notebook: emptyTheme(), mac: emptyTheme(), vercel: emptyTheme(), glass: emptyTheme() }
  };
}
