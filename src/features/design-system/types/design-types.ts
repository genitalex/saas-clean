export type DesignTheme = 'notebook' | 'mac' | 'vercel' | 'glass';

export interface ElementStyleOverride {
  background?: string;
  color?: string;
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  opacity?: string;
  padding?: string;
  width?: string;
  height?: string;
}

export interface DesignThemeState {
  tokens: Record<string, string>;
  components: Record<string, ElementStyleOverride>;
  elements: Record<string, ElementStyleOverride>;
  notes: Record<string, string>;
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

export const EMPTY_THEME_STATE: DesignThemeState = {
  tokens: {},
  components: {},
  elements: {},
  notes: {}
};

export function createDesignDocument(): DesignDocument {
  return {
    version: 1,
    themes: {
      notebook: structuredClone(EMPTY_THEME_STATE),
      mac: structuredClone(EMPTY_THEME_STATE),
      vercel: structuredClone(EMPTY_THEME_STATE),
      glass: structuredClone(EMPTY_THEME_STATE)
    }
  };
}
