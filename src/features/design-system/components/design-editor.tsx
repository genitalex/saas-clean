'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icons } from '@/components/icons';
import { useThemeConfig } from '@/components/themes/active-theme';
import { cn } from '@/lib/utils';
import {
  createDesignDocument,
  DESIGN_THEMES,
  type DesignDocument,
  type DesignTheme,
  type ElementStyleOverride
} from '../types/design-types';
import { serializeDesign, serializeLiveCss, serializeThemeCss } from '../lib/design-serializer';

const STORAGE_KEY = 'workspace-design-system-v1';
const EDITOR_TARGET = 'data-design-editor-target';
const COLOR_TOKENS = ['background', 'card', 'primary', 'foreground', 'border', 'radius'];

function labelForElement(element: HTMLElement): string {
  const id = element.dataset.designId;
  if (id) return id;
  const slot = element.dataset.slot;
  if (slot) return slot.replaceAll('-', ' ');
  return element.tagName.toLowerCase();
}

function getSelectionTarget(eventTarget: EventTarget | null): HTMLElement | null {
  if (!(eventTarget instanceof HTMLElement)) return null;
  if (eventTarget.closest('[data-design-editor]')) return null;
  return eventTarget.closest<HTMLElement>(
    '[data-design-id], [data-slot], button, input, textarea, select, a, h1, h2, h3, p, label, nav, table, tr, section, main, header'
  );
}

function loadDocument(): DesignDocument {
  if (typeof window === 'undefined') return createDesignDocument();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as DesignDocument | null;
    return parsed?.version === 1 ? parsed : createDesignDocument();
  } catch {
    return createDesignDocument();
  }
}

function updateStyle(
  document: DesignDocument,
  theme: DesignTheme,
  id: string,
  field: keyof ElementStyleOverride,
  value: string
): DesignDocument {
  const next = structuredClone(document);
  const current = next.themes[theme].elements[id] || {};
  next.themes[theme].elements[id] = { ...current, [field]: value };
  return next;
}

function Field({
  label,
  value,
  type = 'text',
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='design-field'>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className='design-section' open>
      <summary>{title}</summary>
      <div className='design-section-content'>{children}</div>
    </details>
  );
}

export function DesignEditor({ children }: { children: React.ReactNode }) {
  const { activeTheme, setActiveTheme } = useThemeConfig();
  const [document, setDocument] = useState<DesignDocument>(createDesignDocument);
  const [history, setHistory] = useState<DesignDocument[]>([]);
  const [future, setFuture] = useState<DesignDocument[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [message, setMessage] = useState('');

  const theme = DESIGN_THEMES.some((item) => item.value === activeTheme)
    ? (activeTheme as DesignTheme)
    : 'glass';
  const selectedId = selected?.dataset.designId || selected?.getAttribute(EDITOR_TARGET) || '';
  const styles = selectedId ? document.themes[theme].elements[selectedId] || {} : {};

  useEffect(() => setDocument(loadDocument()), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
    let styleElement = documentRef.current;
    if (!styleElement) {
      styleElement = window.document.createElement('style');
      styleElement.dataset.designPreview = 'true';
      window.document.head.appendChild(styleElement);
      documentRef.current = styleElement;
    }
    styleElement.textContent = serializeLiveCss(document);
  }, [document]);

  const documentRef = useMemo(() => ({ current: null as HTMLStyleElement | null }), []);

  useEffect(() => {
    if (!isSelecting) return;
    const handleMove = (event: MouseEvent) => {
      const target = getSelectionTarget(event.target);
      window.document
        .querySelectorAll<HTMLElement>('[data-design-hover]')
        .forEach((element) => element.removeAttribute('data-design-hover'));
      target?.setAttribute('data-design-hover', 'true');
      if (target !== hovered) setHovered(target);
    };
    const handleClick = (event: MouseEvent) => {
      const target = getSelectionTarget(event.target);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (!target.dataset.designId)
        target.setAttribute(EDITOR_TARGET, `auto-${target.tagName.toLowerCase()}`);
      window.document
        .querySelectorAll<HTMLElement>('[data-design-selected]')
        .forEach((element) => element.removeAttribute('data-design-selected'));
      target.setAttribute('data-design-selected', 'true');
      setSelected(target);
      setIsOpen(true);
    };
    window.document.addEventListener('mousemove', handleMove);
    window.document.addEventListener('click', handleClick, true);
    return () => {
      window.document.removeEventListener('mousemove', handleMove);
      window.document.removeEventListener('click', handleClick, true);
      window.document
        .querySelectorAll<HTMLElement>('[data-design-hover], [data-design-selected]')
        .forEach((element) => {
          element.removeAttribute('data-design-hover');
          element.removeAttribute('data-design-selected');
        });
      setHovered(null);
    };
  }, [hovered, isSelecting]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !isOpen ||
        !event.target ||
        !(event.target instanceof HTMLElement) ||
        !event.target.closest('[data-design-editor]')
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey && future.length) {
          const [next, ...rest] = future;
          setHistory((items) => [document, ...items]);
          setDocument(next);
          setFuture(rest);
        } else if (!event.shiftKey && history.length) {
          const [previous, ...rest] = history;
          setFuture((items) => [document, ...items]);
          setDocument(previous);
          setHistory(rest);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document, future, history, isOpen]);

  function commit(next: DesignDocument) {
    setHistory((items) => [document, ...items].slice(0, 30));
    setFuture([]);
    setDocument(next);
  }

  function change(field: keyof ElementStyleOverride, value: string) {
    if (!selectedId) return;
    commit(updateStyle(document, theme, selectedId, field, value));
  }

  function setToken(name: string, value: string) {
    const next = structuredClone(document);
    next.themes[theme].tokens[name] = value;
    commit(next);
  }

  function resetElement() {
    if (!selectedId) return;
    const next = structuredClone(document);
    delete next.themes[theme].elements[selectedId];
    commit(next);
  }

  function registerSelectedElement() {
    if (!selected || selected.dataset.designId || !selectedId) return;
    selected.setAttribute('data-design-id', selectedId);
    selected.setAttribute('data-design-component', selected.tagName.toLowerCase());
    selected.removeAttribute(EDITOR_TARGET);
    setSelected(selected);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
    setMessage('Diseño guardado');
    window.setTimeout(() => setMessage(''), 1800);
  }

  async function copy(value: string, success: string) {
    await navigator.clipboard.writeText(value);
    setMessage(success);
    window.setTimeout(() => setMessage(''), 1800);
  }

  const cssPreview = selectedId ? serializeThemeCss(document, theme) : '';

  return (
    <>
      {children}
      {isSelecting && hovered && (
        <div
          className='design-hover-label'
          style={{
            top: hovered.getBoundingClientRect().top + 4,
            left: hovered.getBoundingClientRect().left + 4
          }}
        >
          {labelForElement(hovered)}
        </div>
      )}
      <div data-design-editor className={cn('design-editor-root', isOpen && 'design-editor-open')}>
        <button
          type='button'
          className='design-trigger'
          onClick={() => {
            setIsOpen((value) => !value);
            setIsSelecting(true);
          }}
          aria-label='Abrir editor de diseño'
        >
          <Icons.palette className='size-4' />
          <span>Editor de diseño</span>
        </button>
        {isOpen && (
          <aside className='design-panel' aria-label='Editor de diseño'>
            <header className='design-panel-header'>
              <div>
                <p className='design-eyebrow'>Design system</p>
                <h2>Editor visual</h2>
              </div>
              <button
                type='button'
                className='design-icon-button'
                onClick={() => setIsOpen(false)}
                aria-label='Cerrar editor'
              >
                <Icons.close className='size-4' />
              </button>
            </header>
            <div className='design-panel-body'>
              <div className='design-theme-row'>
                <span>Tema activo</span>
                <select value={theme} onChange={(event) => setActiveTheme(event.target.value)}>
                  {DESIGN_THEMES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='design-actions'>
                <button
                  type='button'
                  className={cn('design-mode-button', isSelecting && 'active')}
                  onClick={() => setIsSelecting((value) => !value)}
                >
                  <Icons.adjustments className='size-4' />
                  {isSelecting ? 'Seleccionando' : 'Select mode'}
                </button>
                <button
                  type='button'
                  className='design-icon-button'
                  onClick={() => {
                    if (history.length) {
                      const [previous, ...rest] = history;
                      setFuture((items) => [document, ...items]);
                      setDocument(previous);
                      setHistory(rest);
                    }
                  }}
                  aria-label='Deshacer'
                >
                  <Icons.chevronLeft className='size-4' />
                </button>
                <button
                  type='button'
                  className='design-icon-button'
                  onClick={() => {
                    if (future.length) {
                      const [next, ...rest] = future;
                      setHistory((items) => [document, ...items]);
                      setDocument(next);
                      setFuture(rest);
                    }
                  }}
                  aria-label='Rehacer'
                >
                  <Icons.chevronRight className='size-4' />
                </button>
              </div>
              {selected ? (
                <div className='design-selection'>
                  <span className='design-selection-dot' />
                  <div>
                    <strong>{labelForElement(selected)}</strong>
                    <small>
                      {selected.dataset.designComponent || selected.tagName.toLowerCase()}{' '}
                      {selected.dataset.designVariant ? `/ ${selected.dataset.designVariant}` : ''}
                    </small>
                  </div>
                  {!selected.dataset.designId && (
                    <button
                      type='button'
                      className='design-register-button'
                      onClick={registerSelectedElement}
                    >
                      Registrar
                    </button>
                  )}
                </div>
              ) : (
                <div className='design-empty'>
                  Activa Select mode y toca cualquier elemento visual.
                </div>
              )}
              <Section title='TOKENS DEL TEMA'>
                <div className='design-token-grid'>
                  {COLOR_TOKENS.map((token) => (
                    <Field
                      key={token}
                      label={`--${token}`}
                      value={document.themes[theme].tokens[token] || ''}
                      placeholder={token === 'radius' ? '0.625rem' : 'var(--...)'}
                      type={token === 'radius' ? 'text' : 'text'}
                      onChange={(value) => setToken(token, value)}
                    />
                  ))}
                </div>
              </Section>
              {selected && (
                <>
                  <Section title='COLOR'>
                    <Field
                      label='Background'
                      value={styles.background || ''}
                      placeholder='var(--primary)'
                      onChange={(value) => change('background', value)}
                    />
                    <Field
                      label='Text'
                      value={styles.color || ''}
                      placeholder='var(--foreground)'
                      onChange={(value) => change('color', value)}
                    />
                    <Field
                      label='Opacity'
                      value={styles.opacity || ''}
                      placeholder='1'
                      type='number'
                      onChange={(value) => change('opacity', value)}
                    />
                  </Section>
                  <Section title='TYPOGRAPHY'>
                    <Field
                      label='Font family'
                      value={styles.fontFamily || ''}
                      placeholder='var(--font-sans)'
                      onChange={(value) => change('fontFamily', value)}
                    />
                    <Field
                      label='Font size'
                      value={styles.fontSize || ''}
                      placeholder='1rem'
                      onChange={(value) => change('fontSize', value)}
                    />
                    <Field
                      label='Font weight'
                      value={styles.fontWeight || ''}
                      placeholder='500'
                      type='number'
                      onChange={(value) => change('fontWeight', value)}
                    />
                    <Field
                      label='Letter spacing'
                      value={styles.letterSpacing || ''}
                      placeholder='0'
                      onChange={(value) => change('letterSpacing', value)}
                    />
                  </Section>
                  <Section title='SPACING & SIZE'>
                    <Field
                      label='Padding'
                      value={styles.padding || ''}
                      placeholder='0.75rem 1rem'
                      onChange={(value) => change('padding', value)}
                    />
                    <Field
                      label='Width'
                      value={styles.width || ''}
                      placeholder='auto'
                      onChange={(value) => change('width', value)}
                    />
                    <Field
                      label='Height'
                      value={styles.height || ''}
                      placeholder='auto'
                      onChange={(value) => change('height', value)}
                    />
                  </Section>
                  <Section title='BORDER & SHADOW'>
                    <Field
                      label='Radius'
                      value={styles.borderRadius || ''}
                      placeholder='var(--radius)'
                      onChange={(value) => change('borderRadius', value)}
                    />
                    <Field
                      label='Box shadow'
                      value={styles.boxShadow || ''}
                      placeholder='var(--shadow-sm)'
                      onChange={(value) => change('boxShadow', value)}
                    />
                  </Section>
                  <Section title='CSS EFECTIVO'>
                    <pre className='design-code'>{cssPreview || '/* Aún no hay overrides */'}</pre>
                  </Section>
                </>
              )}
            </div>
            <footer className='design-panel-footer'>
              <button type='button' className='design-secondary-button' onClick={resetElement}>
                Restablecer
              </button>
              <button type='button' className='design-secondary-button' onClick={save}>
                Guardar
              </button>
              <button
                type='button'
                className='design-secondary-button'
                onClick={() => copy(serializeDesign(document, theme), 'JSON copiado')}
              >
                Exportar JSON
              </button>
              <button
                type='button'
                className='design-primary-button'
                onClick={() => copy(serializeThemeCss(document, theme), 'CSS copiado')}
              >
                Copiar CSS
              </button>
              {message && <span className='design-message'>{message}</span>}
            </footer>
          </aside>
        )}
      </div>
    </>
  );
}
