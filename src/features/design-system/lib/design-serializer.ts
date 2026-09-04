import type { DesignDocument, DesignTheme, ElementStyleOverride } from '../types/design-types';

const PROPERTY_MAP: Record<keyof ElementStyleOverride, string> = {
  background: 'background',
  color: 'color',
  borderRadius: 'border-radius',
  boxShadow: 'box-shadow',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  letterSpacing: 'letter-spacing',
  lineHeight: 'line-height',
  opacity: 'opacity',
  padding: 'padding',
  width: 'width',
  height: 'height'
};

function declarations(styles: ElementStyleOverride): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `  ${PROPERTY_MAP[key as keyof ElementStyleOverride]}: ${value};`)
    .join('\n');
}

export function serializeDesign(document: DesignDocument, theme: DesignTheme): string {
  return JSON.stringify({ theme, ...document.themes[theme] }, null, 2);
}

export function serializeThemeCss(document: DesignDocument, theme: DesignTheme): string {
  const themeState = document.themes[theme];
  const tokenCss = Object.entries(themeState.tokens)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join('\n');
  const rules = Object.entries(themeState.elements)
    .map(([id, styles]) => {
      const css = declarations(styles);
      return css ? `[data-theme='${theme}'] [data-design-id='${id}'] {\n${css}\n}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

  return `[data-theme='${theme}'] {\n${tokenCss}\n}${rules ? `\n\n${rules}` : ''}`;
}

export function serializeLiveCss(document: DesignDocument): string {
  return (Object.keys(document.themes) as DesignTheme[])
    .map((theme) => serializeThemeCss(document, theme))
    .filter(Boolean)
    .join('\n\n');
}
