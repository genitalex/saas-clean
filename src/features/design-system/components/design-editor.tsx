'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { useThemeConfig } from '@/components/themes/active-theme';
import { cn } from '@/lib/utils';
import { ElementTree } from './element-tree';
import { Control, SelectControl, ShadowControl, StyleGrid, StyleSection } from './style-controls';
import {
  DESIGN_THEMES,
  INITIAL_GLASS_MATERIAL,
  createDesignDocument,
  type DesignDocument,
  type DesignState,
  type DesignTarget,
  type DesignTheme,
  type DesignViewport,
  type MaterialValues,
  type StyleValues
} from '../types/design-types';
import { SCREEN_TREES, targetFromElement } from '../lib/design-registry';
import {
  parseDesignImport,
  serializeDesign,
  serializeLiveCss,
  serializeThemeCss,
  styleForState
} from '../lib/design-serializer';

const STORAGE_KEY = 'workspace-design-system-v1';
const EDITOR_ATTRIBUTE = 'data-design-editor';
const STATES: DesignState[] = ['default', 'hover', 'active', 'focus', 'disabled', 'selected'];
const VIEWPORTS: DesignViewport[] = ['desktop', 'tablet', 'mobile'];
const TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'popover',
  'primary',
  'secondary',
  'muted',
  'accent',
  'border',
  'input',
  'ring',
  'radius',
  'font-sans'
];
const LAYOUT = [
  { key: 'display', label: 'Display' },
  { key: 'position', label: 'Position' },
  { key: 'top', label: 'Top', placeholder: 'auto' },
  { key: 'right', label: 'Right', placeholder: 'auto' },
  { key: 'bottom', label: 'Bottom', placeholder: 'auto' },
  { key: 'left', label: 'Left', placeholder: 'auto' },
  { key: 'zIndex', label: 'Z-index', type: 'number' },
  { key: 'overflow', label: 'Overflow' },
  { key: 'alignItems', label: 'Align items' },
  { key: 'justifyContent', label: 'Justify' },
  { key: 'flexDirection', label: 'Flex direction' },
  { key: 'flexWrap', label: 'Flex wrap' },
  { key: 'gap', label: 'Gap' }
];
const SIZE = ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'].map((key) => ({
  key,
  label: key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`),
  placeholder: 'auto'
}));
const SPACING = [
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft'
].map((key) => ({
  key,
  label: key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`),
  placeholder: '0'
}));
const TYPE = [
  { key: 'fontFamily', label: 'Font family', placeholder: 'var(--font-sans)' },
  { key: 'fontSize', label: 'Font size', placeholder: '1rem' },
  { key: 'fontWeight', label: 'Font weight', type: 'number' },
  { key: 'lineHeight', label: 'Line height' },
  { key: 'letterSpacing', label: 'Letter spacing' },
  { key: 'textTransform', label: 'Transform' },
  { key: 'textDecoration', label: 'Decoration' },
  { key: 'textAlign', label: 'Align' }
];
const BORDER = [
  { key: 'borderTopWidth', label: 'Top width' },
  { key: 'borderRightWidth', label: 'Right width' },
  { key: 'borderBottomWidth', label: 'Bottom width' },
  { key: 'borderLeftWidth', label: 'Left width' },
  { key: 'borderStyle', label: 'Style', placeholder: 'solid' },
  { key: 'borderColor', label: 'Color', placeholder: 'var(--border)' }
];
const EFFECTS = [
  { key: 'opacity', label: 'Opacity', type: 'number' },
  { key: 'filter', label: 'Filter' },
  { key: 'backdropFilter', label: 'Backdrop filter' }
];
const TRANSITIONS = [
  { key: 'transitionDuration', label: 'Duration', placeholder: '180ms' },
  { key: 'transitionDelay', label: 'Delay' },
  { key: 'transitionTimingFunction', label: 'Timing', placeholder: 'cubic-bezier(0.32,0.72,0,1)' }
];

function loadDocument(): DesignDocument {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed = value ? (JSON.parse(value) as DesignDocument) : null;
    return parsed?.version === 1 ? parsed : createDesignDocument();
  } catch {
    return createDesignDocument();
  }
}
function clone<T>(value: T): T {
  return structuredClone(value);
}
function pathForElement(target: DesignTarget): string {
  return target.source || 'Runtime element';
}

export function DesignEditor({ children }: { children: React.ReactNode }) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const pathname = usePathname();
  const [document, setDocument] = useState<DesignDocument>(() => loadDocument());
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [state, setState] = useState<DesignState>('default');
  const [viewport, setViewport] = useState<DesignViewport>('desktop');
  const [compare, setCompare] = useState(false);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [originalCss, setOriginalCss] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const theme = DESIGN_THEMES.some((item) => item.value === activeTheme)
    ? (activeTheme as DesignTheme)
    : 'glass';
  const id = target?.dataset.designId || '';
  const targetInfo = target ? targetFromElement(target) : null;
  const screen = pathname.includes('my-work')
    ? 'work'
    : pathname.includes('calendar')
      ? 'calendar'
      : pathname.includes('customers')
        ? 'customers'
        : 'today';
  const tree = SCREEN_TREES[screen];
  const stateStyles = id
    ? {
        ...styleForState(document, theme, id, state),
        ...(viewport === 'desktop' ? {} : document.themes[theme].responsive[id]?.[viewport] || {})
      }
    : {};
  const themeState = document.themes[theme];
  const selectedMaterial = id
    ? themeState.materials[id] || (theme === 'glass' ? INITIAL_GLASS_MATERIAL : undefined)
    : undefined;
  const presets = themeState.presets.filter(
    (preset) =>
      !query ||
      preset.name.toLowerCase().includes(query.toLowerCase()) ||
      preset.sourceId.includes(query.toLowerCase())
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
    if (!styleRef.current) {
      styleRef.current = window.document.createElement('style');
      styleRef.current.dataset.designPreview = 'true';
      window.document.head.appendChild(styleRef.current);
    }
    styleRef.current.textContent = `${serializeLiveCss(document)}${compare && targetInfo ? `\n${originalCss}` : ''}`;
  }, [compare, document, originalCss, targetInfo]);
  useEffect(() => {
    if (!target) return;
    target.toggleAttribute('data-design-preview-original', compare);
    target.setAttribute('data-design-preview-state', state);
    return () => {
      target.removeAttribute('data-design-preview-original');
      target.removeAttribute('data-design-preview-state');
    };
  }, [compare, state, target]);
  useEffect(() => {
    if (!selecting) return;
    const move = (event: MouseEvent) => {
      const element = (event.target as HTMLElement)?.closest<HTMLElement>(
        '[data-design-id], [data-slot], button, input, textarea, select, a, h1, h2, h3, p, label, nav, table, tr, section, main, header'
      );
      if (element && !element.closest(`[${EDITOR_ATTRIBUTE}]`)) setHovered(element);
    };
    const click = (event: MouseEvent) => {
      const element = (event.target as HTMLElement)?.closest<HTMLElement>(
        '[data-design-id], [data-slot], button, input, textarea, select, a, h1, h2, h3, p, label, nav, table, tr, section, main, header'
      );
      if (!element || element.closest(`[${EDITOR_ATTRIBUTE}]`)) return;
      event.preventDefault();
      event.stopPropagation();
      selectElement(element);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('click', click, true);
      setHovered(null);
    };
  }, [selecting]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!open || !(event.target as HTMLElement)?.closest(`[${EDITOR_ATTRIBUTE}]`)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  function selectElement(element: HTMLElement) {
    const elementId =
      element.dataset.designId || `auto.${element.dataset.slot || element.tagName.toLowerCase()}`;
    if (!element.dataset.designId) element.setAttribute('data-design-editor-target', elementId);
    const styles = getComputedStyle(element);
    const css = `[data-design-id='${elementId}'][data-design-preview-original='true'], [data-design-editor-target='${elementId}'][data-design-preview-original='true'] { background: ${styles.background}; color: ${styles.color}; border-radius: ${styles.borderRadius}; box-shadow: ${styles.boxShadow}; font-family: ${styles.fontFamily}; font-size: ${styles.fontSize}; font-weight: ${styles.fontWeight}; padding: ${styles.padding}; opacity: ${styles.opacity}; }`;
    setOriginalCss(css);
    setTarget(element);
    setOpen(true);
  }
  function commit(next: DesignDocument) {
    setHistory((items) => [document, ...items].slice(0, 50));
    setFuture([]);
    setDocument(next);
  }
  function changeStyles(values: StyleValues, targetId = id, selectedState = state) {
    if (!targetId) return;
    const next = clone(document);
    if (viewport !== 'desktop' && selectedState === 'default')
      next.themes[theme].responsive[targetId] = {
        ...next.themes[theme].responsive[targetId],
        [viewport]: { ...next.themes[theme].responsive[targetId]?.[viewport], ...values }
      };
    else if (selectedState === 'default')
      next.themes[theme].elements[targetId] = {
        ...next.themes[theme].elements[targetId],
        ...values
      };
    else
      next.themes[theme].states[targetId] = {
        ...next.themes[theme].states[targetId],
        [selectedState]: { ...next.themes[theme].states[targetId]?.[selectedState], ...values }
      };
    commit(next);
  }
  function changeComponent(values: StyleValues) {
    if (!targetInfo?.component) return;
    const next = clone(document);
    const key = `${targetInfo.component.toLowerCase()}.${targetInfo.variant || 'default'}`;
    next.themes[theme].components[key] = { ...next.themes[theme].components[key], ...values };
    commit(next);
  }
  function changeToken(name: string, value: string) {
    const next = clone(document);
    next.themes[theme].tokens[name] = value;
    commit(next);
  }
  function changeMaterial(values: Partial<MaterialValues>) {
    if (!id) return;
    const next = clone(document);
    next.themes[theme].materials[id] = {
      ...(next.themes[theme].materials[id] || INITIAL_GLASS_MATERIAL),
      ...values
    };
    commit(next);
  }
  function updateNote(note: string) {
    if (!id) return;
    const next = clone(document);
    next.themes[theme].notes[id] = note;
    commit(next);
  }
  function undo() {
    if (!history.length) return;
    const [previous, ...rest] = history;
    setFuture((items) => [document, ...items]);
    setDocument(previous);
    setHistory(rest);
  }
  function redo() {
    if (!future.length) return;
    const [next, ...rest] = future;
    setHistory((items) => [document, ...items]);
    setDocument(next);
    setFuture(rest);
  }
  function reset(kind: 'property' | 'element' | 'theme' | 'all' = 'element') {
    const next = clone(document);
    if (kind === 'all') {
      commit(createDesignDocument());
      return;
    }
    if (kind === 'theme') {
      next.themes[theme] = createDesignDocument().themes[theme];
    } else if (id) {
      if (kind === 'property') {
        delete next.themes[theme].elements[id];
      } else {
        delete next.themes[theme].elements[id];
        delete next.themes[theme].states[id];
        delete next.themes[theme].materials[id];
        delete next.themes[theme].notes[id];
      }
    }
    commit(next);
  }
  function savePreset() {
    if (!id) return;
    const next = clone(document);
    next.themes[theme].presets.push({
      id: crypto.randomUUID(),
      name: `${theme} / ${id}`,
      sourceId: id,
      styles: stateStyles,
      states: next.themes[theme].states[id] || {},
      material: selectedMaterial,
      note: next.themes[theme].notes[id] || '',
      createdAt: new Date().toISOString()
    });
    commit(next);
  }
  function applyPreset(presetId: string) {
    const preset = themeState.presets.find((item) => item.id === presetId);
    if (!preset || !id) return;
    const next = clone(document);
    next.themes[theme].elements[id] = preset.styles;
    next.themes[theme].states[id] = preset.states;
    if (preset.material) next.themes[theme].materials[id] = preset.material;
    next.themes[theme].notes[id] = preset.note;
    commit(next);
  }
  function deletePreset(presetId: string) {
    const next = clone(document);
    next.themes[theme].presets = next.themes[theme].presets.filter(
      (preset) => preset.id !== presetId
    );
    commit(next);
  }
  function register() {
    if (!target || target.dataset.designId) return;
    target.dataset.designId = id;
    target.removeAttribute('data-design-editor-target');
    setTarget(target);
  }
  function selectTreeNode(node: { selector: string }) {
    const element = window.document.querySelector<HTMLElement>(node.selector);
    if (element) selectElement(element);
    else setMessage('Ese elemento aún no existe en esta pantalla');
  }
  function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((value) => {
      try {
        const imported = parseDesignImport(value);
        const next = clone(document);
        next.themes[imported.theme] = { ...next.themes[imported.theme], ...imported.data };
        commit(next);
        setMessage('Diseño importado');
      } catch {
        setMessage('JSON no válido');
      }
    });
  }
  async function copy(value: string, text: string) {
    await navigator.clipboard.writeText(value);
    setMessage(text);
    window.setTimeout(() => setMessage(''), 1600);
  }

  return (
    <>
      {children}
      {selecting && hovered && (
        <div
          className='design-hover-label'
          style={{
            top: hovered.getBoundingClientRect().top + 3,
            left: hovered.getBoundingClientRect().left + 3
          }}
        >
          {hovered.dataset.designId || hovered.dataset.slot || hovered.tagName.toLowerCase()}
        </div>
      )}
      <div data-design-editor className='design-editor-root'>
        <button
          type='button'
          className='design-trigger'
          onClick={() => {
            setOpen((value) => !value);
            setSelecting(true);
          }}
        >
          <Icons.palette className='size-4' />
          <span>Editor de diseño</span>
        </button>
        {open && (
          <aside className='design-panel' aria-label='Editor visual'>
            <header className='design-panel-header'>
              <div>
                <p className='design-eyebrow'>Internal design system</p>
                <h2>Editor visual</h2>
              </div>
              <button
                type='button'
                className='design-icon-button'
                aria-label='Cerrar'
                onClick={() => {
                  setOpen(false);
                  setSelecting(false);
                }}
              >
                <Icons.close className='size-4' />
              </button>
            </header>
            <div className='design-panel-body'>
              <div className='design-toolbar'>
                <select value={theme} onChange={(event) => setActiveTheme(event.target.value)}>
                  {DESIGN_THEMES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  value={viewport}
                  onChange={(event) => setViewport(event.target.value as DesignViewport)}
                >
                  {VIEWPORTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  className={cn('design-mode-button', selecting && 'active')}
                  onClick={() => setSelecting((value) => !value)}
                >
                  Select
                </button>
              </div>
              <div className='design-actions'>
                <button
                  type='button'
                  className='design-icon-button'
                  aria-label='Undo'
                  onClick={undo}
                >
                  <Icons.chevronLeft className='size-4' />
                </button>
                <button
                  type='button'
                  className='design-icon-button'
                  aria-label='Redo'
                  onClick={redo}
                >
                  <Icons.chevronRight className='size-4' />
                </button>
                <button
                  type='button'
                  className={cn('design-mode-button', compare && 'active')}
                  onClick={() => setCompare((value) => !value)}
                >
                  Original / Edited
                </button>
              </div>
              <div className='design-search'>
                <Icons.search className='size-3.5' />
                <input
                  value={query}
                  placeholder='Search elements or presets'
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <StyleSection title='ELEMENT TREE' open>
                <ElementTree
                  nodes={tree.filter(
                    (node) =>
                      !query ||
                      node.id.includes(query) ||
                      node.label.toLowerCase().includes(query.toLowerCase())
                  )}
                  onSelect={selectTreeNode}
                />
              </StyleSection>
              {targetInfo ? (
                <>
                  <div className='design-selection'>
                    <strong>{targetInfo.label}</strong>
                    <small>
                      {targetInfo.type} · {targetInfo.component} · {theme}
                    </small>
                    {!targetInfo.id && (
                      <button type='button' className='design-register-button' onClick={register}>
                        Registrar
                      </button>
                    )}
                  </div>
                  <StyleSection title='ELEMENT'>
                    <div className='design-meta'>
                      <span>
                        DATA-DESIGN-ID<code>{targetInfo.id || 'Elemento no registrado'}</code>
                      </span>
                      <span>
                        VARIANT<code>{targetInfo.variant || 'default'}</code>
                      </span>
                      <span>
                        SOURCE<code>{pathForElement(targetInfo)}</code>
                      </span>
                    </div>
                    <Control
                      label='Nota de diseño'
                      value={themeState.notes[id]}
                      placeholder='Más fino, menos radius...'
                      onChange={updateNote}
                    />
                  </StyleSection>
                  <StyleSection title='STATES' open>
                    <div className='design-state-tabs'>
                      {STATES.map((item) => (
                        <button
                          type='button'
                          key={item}
                          className={state === item ? 'active' : ''}
                          onClick={() => setState(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <SelectControl
                      label='Preview state'
                      value={state}
                      options={STATES}
                      onChange={(value) => setState(value as DesignState)}
                    />
                  </StyleSection>
                  <StyleSection title='LAYOUT'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={LAYOUT}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                  </StyleSection>
                  <StyleSection title='SIZE'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={SIZE}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                  </StyleSection>
                  <StyleSection title='SPACING'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={SPACING}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                    <Control
                      label='Linked spacing'
                      placeholder='0.75rem'
                      onChange={(value) =>
                        changeStyles({
                          paddingTop: value,
                          paddingRight: value,
                          paddingBottom: value,
                          paddingLeft: value
                        })
                      }
                      value=''
                    />
                  </StyleSection>
                  <StyleSection title='TYPOGRAPHY'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={TYPE}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                    <Control
                      label='Text color'
                      value={stateStyles.color}
                      placeholder='var(--foreground) or #hex'
                      onChange={(value) => changeStyles({ color: value })}
                    />
                  </StyleSection>
                  <StyleSection title='BACKGROUND & COLOR'>
                    <Control
                      label='Background'
                      value={stateStyles.background}
                      placeholder='var(--card), rgba(...)'
                      onChange={(value) => changeStyles({ background: value })}
                    />
                    <Control
                      label='Gradient / image'
                      value={stateStyles.backgroundImage}
                      placeholder='linear-gradient(...)'
                      onChange={(value) => changeStyles({ backgroundImage: value })}
                    />
                  </StyleSection>
                  <StyleSection title='BORDER & RADIUS'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={BORDER}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                    <Control
                      label='Linked radius'
                      value={stateStyles.borderRadius}
                      placeholder='16px'
                      onChange={(value) =>
                        changeStyles({
                          borderRadius: value,
                          borderTopLeftRadius: value,
                          borderTopRightRadius: value,
                          borderBottomRightRadius: value,
                          borderBottomLeftRadius: value
                        })
                      }
                    />
                    <StyleGrid
                      styles={stateStyles}
                      properties={[
                        { key: 'borderTopLeftRadius', label: 'Top left' },
                        { key: 'borderTopRightRadius', label: 'Top right' },
                        { key: 'borderBottomRightRadius', label: 'Bottom right' },
                        { key: 'borderBottomLeftRadius', label: 'Bottom left' }
                      ]}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                  </StyleSection>
                  <StyleSection title='SHADOW'>
                    <ShadowControl
                      value={stateStyles.boxShadow}
                      onChange={(value) => changeStyles({ boxShadow: value })}
                    />
                  </StyleSection>
                  <StyleSection title='EFFECTS & TRANSITIONS'>
                    <StyleGrid
                      styles={stateStyles}
                      properties={EFFECTS}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                    <StyleGrid
                      styles={stateStyles}
                      properties={TRANSITIONS}
                      onChange={(key, value) => changeStyles({ [key]: value })}
                    />
                  </StyleSection>
                  {theme === 'glass' && (
                    <StyleSection title='MATERIAL'>
                      <Control
                        label='Liquid Glass enabled'
                        value={selectedMaterial?.enabled}
                        placeholder='true / false'
                        onChange={(value) => changeMaterial({ enabled: value })}
                      />
                      <Control
                        label='Backdrop blur'
                        value={selectedMaterial?.backdropBlur}
                        placeholder='7px'
                        onChange={(value) => changeMaterial({ backdropBlur: value })}
                      />
                      <Control
                        label='Tint color'
                        value={selectedMaterial?.tintColor}
                        placeholder='rgba(0,0,0,.14)'
                        onChange={(value) => changeMaterial({ tintColor: value })}
                      />
                      <Control
                        label='Tint opacity'
                        value={selectedMaterial?.tintOpacity}
                        placeholder='.14'
                        onChange={(value) => changeMaterial({ tintOpacity: value })}
                      />
                      <Control
                        label='Displacement scale'
                        value={selectedMaterial?.displacementScale}
                        type='number'
                        onChange={(value) => changeMaterial({ displacementScale: value })}
                      />
                      <Control
                        label='Turbulence frequency'
                        value={selectedMaterial?.turbulenceBaseFrequency}
                        onChange={(value) => changeMaterial({ turbulenceBaseFrequency: value })}
                      />
                      <Control
                        label='Turbulence seed'
                        value={selectedMaterial?.turbulenceSeed}
                        type='number'
                        onChange={(value) => changeMaterial({ turbulenceSeed: value })}
                      />
                      <Control
                        label='Glass border'
                        value={selectedMaterial?.glassBorder}
                        placeholder='true / false'
                        onChange={(value) => changeMaterial({ glassBorder: value })}
                      />
                      <Control
                        label='Saturation'
                        value={selectedMaterial?.saturation}
                        onChange={(value) => changeMaterial({ saturation: value })}
                      />
                      <Control
                        label='Brightness'
                        value={selectedMaterial?.brightness}
                        onChange={(value) => changeMaterial({ brightness: value })}
                      />
                      <Control
                        label='Contrast'
                        value={selectedMaterial?.contrast}
                        onChange={(value) => changeMaterial({ contrast: value })}
                      />
                      <Control
                        label='Refraction intensity'
                        value={selectedMaterial?.refractionIntensity}
                        onChange={(value) => changeMaterial({ refractionIntensity: value })}
                      />
                      <Control
                        label='Highlight opacity'
                        value={selectedMaterial?.highlightOpacity}
                        onChange={(value) => changeMaterial({ highlightOpacity: value })}
                      />
                    </StyleSection>
                  )}
                  <StyleSection title='COMPONENT TOKEN'>
                    <Control
                      label={`${targetInfo.component || 'component'}.${targetInfo.variant || 'default'} background`}
                      value={
                        themeState.components[
                          `${targetInfo.component.toLowerCase()}.${targetInfo.variant || 'default'}`
                        ]?.background
                      }
                      placeholder='Shared component value'
                      onChange={(value) => changeComponent({ background: value })}
                    />
                  </StyleSection>
                  <StyleSection title='PRESETS'>
                    <button type='button' className='design-primary-button' onClick={savePreset}>
                      Save preset
                    </button>
                    {presets.map((preset) => (
                      <div className='design-preset' key={preset.id}>
                        <span>{preset.name}</span>
                        <button type='button' onClick={() => applyPreset(preset.id)}>
                          Apply
                        </button>
                        <button
                          type='button'
                          onClick={() => deletePreset(preset.id)}
                          aria-label='Delete preset'
                        >
                          <Icons.trash className='size-3' />
                        </button>
                      </div>
                    ))}
                  </StyleSection>
                  <StyleSection title='COMPUTED / SOURCE'>
                    <div className='design-computed'>
                      {[
                        'display',
                        'position',
                        'width',
                        'height',
                        'padding',
                        'margin',
                        'font',
                        'color',
                        'background',
                        'border',
                        'borderRadius',
                        'boxShadow'
                      ].map((property) => (
                        <span key={property}>
                          <b>{property}</b>
                          <code>
                            {target
                              ? (getComputedStyle(target)[
                                  property as keyof CSSStyleDeclaration
                                ] as string)
                              : '-'}
                          </code>
                        </span>
                      ))}
                    </div>
                    <pre className='design-code'>{serializeThemeCss(document, theme)}</pre>
                  </StyleSection>
                </>
              ) : (
                <div className='design-empty'>
                  Activa Select mode y selecciona un elemento real de la pantalla.
                </div>
              )}
              <StyleSection title='THEME TOKENS'>
                <div className='design-token-grid'>
                  {TOKEN_NAMES.map((name) => (
                    <Control
                      key={name}
                      label={`--${name}`}
                      value={themeState.tokens[name]}
                      placeholder='System value'
                      onChange={(value) => changeToken(name, value)}
                    />
                  ))}
                </div>
              </StyleSection>
              <StyleSection title='ADVANCED'>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => reset('property')}
                >
                  Reset property
                </button>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => reset('element')}
                >
                  Reset element
                </button>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => reset('theme')}
                >
                  Reset theme
                </button>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => reset('all')}
                >
                  Reset all
                </button>
                <input
                  ref={importRef}
                  hidden
                  type='file'
                  accept='application/json,.json'
                  onChange={importFile}
                />
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => importRef.current?.click()}
                >
                  Import JSON
                </button>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() => copy(serializeDesign(document, theme), 'JSON copiado')}
                >
                  Export JSON
                </button>
                <button
                  type='button'
                  className='design-primary-button'
                  onClick={() => copy(serializeThemeCss(document, theme), 'CSS copiado')}
                >
                  Copy CSS
                </button>
                <button
                  type='button'
                  className='design-secondary-button'
                  onClick={() =>
                    copy(
                      `Theme: ${theme}\nElement: ${targetInfo?.label || 'Theme'}\nSource: ${targetInfo?.source || '-'}\nTypography: ${stateStyles.fontFamily || 'system'} ${stateStyles.fontSize || '-'} ${stateStyles.fontWeight || '-'}\nBackground: ${stateStyles.background || '-'}\nRadius: ${stateStyles.borderRadius || '-'}\nShadow: ${stateStyles.boxShadow || '-'}\nMaterial: ${selectedMaterial ? JSON.stringify(selectedMaterial) : 'none'}`,
                      'Specification copied'
                    )
                  }
                >
                  Copy design specification
                </button>
                {message && <span className='design-message'>{message}</span>}
              </StyleSection>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
