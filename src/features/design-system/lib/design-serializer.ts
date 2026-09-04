import type { DesignDocument, DesignState, DesignTheme, StyleValues } from '../types/design-types';

const PROPERTY_MAP: Record<string, string> = {
  zIndex: 'z-index',
  alignItems: 'align-items',
  justifyContent: 'justify-content',
  flexDirection: 'flex-direction',
  flexWrap: 'flex-wrap',
  minWidth: 'min-width',
  maxWidth: 'max-width',
  minHeight: 'min-height',
  maxHeight: 'max-height',
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textTransform: 'text-transform',
  textDecoration: 'text-decoration',
  textAlign: 'text-align',
  backgroundImage: 'background-image',
  borderTopWidth: 'border-top-width',
  borderRightWidth: 'border-right-width',
  borderBottomWidth: 'border-bottom-width',
  borderLeftWidth: 'border-left-width',
  borderStyle: 'border-style',
  borderColor: 'border-color',
  borderRadius: 'border-radius',
  borderTopLeftRadius: 'border-top-left-radius',
  borderTopRightRadius: 'border-top-right-radius',
  borderBottomRightRadius: 'border-bottom-right-radius',
  borderBottomLeftRadius: 'border-bottom-left-radius',
  boxShadow: 'box-shadow',
  backdropFilter: 'backdrop-filter',
  transitionDuration: 'transition-duration',
  transitionDelay: 'transition-delay',
  transitionTimingFunction: 'transition-timing-function'
};

const UNSAFE_VALUE = /[{};]/;
function declarations(styles: StyleValues): string {
  return Object.entries(styles)
    .filter(([, value]) => value && !UNSAFE_VALUE.test(value))
    .map(
      ([key, value]) =>
        `  ${PROPERTY_MAP[key] || key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`
    )
    .join('\n');
}
function selector(theme: DesignTheme, id: string): string {
  return `[data-theme='${theme}'] [data-design-id='${id}'], [data-theme='${theme}'] [data-design-editor-target='${id}']`;
}

export function serializeDesign(document: DesignDocument, theme: DesignTheme): string {
  return JSON.stringify({ version: 1, theme, ...document.themes[theme] }, null, 2);
}

export function serializeThemeCss(document: DesignDocument, theme: DesignTheme): string {
  const state = document.themes[theme];
  const tokenCss = Object.entries(state.tokens)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');
  const rules: string[] = [];
  const addRule = (target: string, styles: StyleValues, suffix = '') => {
    const css = declarations(styles);
    if (css) {
      const targetWithSuffix = target
        .split(', ')
        .map((part) => `${part}${suffix}`)
        .join(', ');
      rules.push(`${targetWithSuffix} {\n${css}\n}`);
    }
  };
  Object.entries(state.components).forEach(([id, styles]) => {
    const [component, variant] = id.split('.');
    const title = component.charAt(0).toUpperCase() + component.slice(1);
    addRule(
      `[data-theme='${theme}'] [data-design-component='${component}'][data-design-variant='${variant || 'default'}'], [data-theme='${theme}'] [data-design-component='${title}'][data-design-variant='${variant || 'default'}']`,
      styles
    );
  });
  Object.entries(state.elements).forEach(([id, styles]) => addRule(selector(theme, id), styles));
  Object.entries(state.states).forEach(([id, states]) =>
    Object.entries(states).forEach(([stateName, styles]) => {
      const suffix =
        stateName === 'default'
          ? ''
          : stateName === 'hover'
            ? ':hover'
            : stateName === 'active'
              ? ':active'
              : stateName === 'focus'
                ? ':focus'
                : stateName === 'disabled'
                  ? ':disabled'
                  : `[data-design-preview-state='${stateName}']`;
      addRule(selector(theme, id), styles || {}, suffix);
    })
  );
  Object.entries(state.responsive).forEach(([id, viewports]) =>
    Object.entries(viewports).forEach(([viewport, styles]) => {
      const query =
        viewport === 'mobile'
          ? '(max-width: 639px)'
          : viewport === 'tablet'
            ? '(min-width: 640px) and (max-width: 1023px)'
            : '(min-width: 1024px)';
      const css = declarations(styles || {});
      if (css) rules.push(`@media ${query} {\n${selector(theme, id)} {\n${css}\n}\n}`);
    })
  );
  Object.entries(state.materials).forEach(([id, material]) => {
    if (material.enabled !== 'true') return;
    const styles: StyleValues = {
      backdropFilter: `blur(${material.backdropBlur}) saturate(${material.saturation}) brightness(${material.brightness}) contrast(${material.contrast})`,
      borderRadius: material.borderRadius,
      borderColor:
        material.glassBorder === 'true'
          ? `color-mix(in oklab, ${material.tintColor} ${material.tintOpacity}, transparent)`
          : 'transparent'
    };
    addRule(selector(theme, id), styles);
  });
  return `[data-theme='${theme}'] {\n${tokenCss}\n}${rules.length ? `\n\n${rules.join('\n\n')}` : ''}`;
}
export function serializeLiveCss(document: DesignDocument): string {
  return (Object.keys(document.themes) as DesignTheme[])
    .map((theme) => serializeThemeCss(document, theme))
    .join('\n\n');
}
export function parseDesignImport(value: string): {
  theme: DesignTheme;
  data: Partial<DesignDocument['themes'][DesignTheme]>;
} {
  const parsed = JSON.parse(value) as { version?: number; theme?: DesignTheme } & Partial<
    DesignDocument['themes'][DesignTheme]
  >;
  if (
    parsed.version !== 1 ||
    !parsed.theme ||
    !['notebook', 'mac', 'vercel', 'glass'].includes(parsed.theme)
  )
    throw new Error('Formato de diseño no válido');
  return {
    theme: parsed.theme,
    data: {
      tokens: parsed.tokens || {},
      components: parsed.components || {},
      elements: parsed.elements || {},
      states: parsed.states || {},
      responsive: parsed.responsive || {},
      materials: parsed.materials || {},
      notes: parsed.notes || {},
      presets: parsed.presets || []
    }
  };
}

export function styleForState(
  document: DesignDocument,
  theme: DesignTheme,
  id: string,
  state: DesignState
): StyleValues {
  const componentId = id.split('.').slice(0, 2).join('.');
  return {
    ...document.themes[theme].components[componentId],
    ...document.themes[theme].elements[id],
    ...document.themes[theme].states[id]?.[state]
  };
}
