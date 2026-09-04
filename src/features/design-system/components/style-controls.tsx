'use client';

import { useState } from 'react';
import type { StyleValues } from '../types/design-types';

const UNITS = ['px', 'rem', '%', 'vw', 'vh', 'em', 'auto'];
const COLOR_TOKENS = [
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
  'ring'
];
const RANGES: Record<string, { min: number; max: number; step: number; unit: string }> = {
  radius: { min: 0, max: 40, step: 1, unit: 'px' },
  borderRadius: { min: 0, max: 40, step: 1, unit: 'px' },
  padding: { min: 0, max: 64, step: 1, unit: 'px' },
  margin: { min: 0, max: 64, step: 1, unit: 'px' },
  gap: { min: 0, max: 64, step: 1, unit: 'px' },
  fontSize: { min: 8, max: 72, step: 1, unit: 'px' },
  lineHeight: { min: 0.8, max: 3, step: 0.1, unit: '' },
  letterSpacing: { min: -2, max: 10, step: 0.1, unit: 'px' },
  border: { min: 0, max: 8, step: 1, unit: 'px' },
  opacity: { min: 0, max: 100, step: 1, unit: '%' },
  blur: { min: 0, max: 40, step: 1, unit: 'px' },
  duration: { min: 0, max: 1000, step: 10, unit: 'ms' },
  delay: { min: 0, max: 1000, step: 10, unit: 'ms' },
  displacement: { min: 0, max: 300, step: 1, unit: '' },
  saturation: { min: 0, max: 200, step: 1, unit: '%' },
  brightness: { min: 0, max: 200, step: 1, unit: '%' },
  contrast: { min: 0, max: 200, step: 1, unit: '%' }
};

function rangeFor(label: string, key?: string) {
  const source = `${key || ''} ${label}`.toLowerCase();
  return Object.entries(RANGES).find(([name]) => source.includes(name))?.[1];
}
function numericValue(
  value: string | undefined,
  range: { min: number; max: number; step: number }
) {
  const match = value?.match(/-?\d+(?:\.\d+)?/);
  const number = match ? Number(match[0]) : range.min;
  return Math.min(range.max, Math.max(range.min, number));
}
function inferredColor(value?: string) {
  return value?.match(/^#[0-9a-f]{6}$/i)?.[0] || '#808080';
}

export function Control({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  propertyKey,
  resetValue = ''
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  propertyKey?: string;
  resetValue?: string;
}) {
  const range = rangeFor(label, propertyKey);
  const isColor = /color|background|tint/i.test(label) && !/image|gradient/i.test(label);
  const [unit, setUnit] = useState(range?.unit || 'px');
  const isOpacity = Boolean(range && /opacity/i.test(`${label} ${propertyKey || ''}`));
  const numeric = range
    ? isOpacity
      ? numericValue(value, range) * (value && Number(value) <= 1 ? 100 : 1)
      : numericValue(value, range)
    : 0;
  const writeNumber = (next: number) =>
    onChange(isOpacity ? String(next / 100) : `${next}${unit === 'auto' ? '' : unit}`);
  if (isColor)
    return (
      <label className='design-field design-color-field'>
        <span>{label}</span>
        <div className='design-color-row'>
          <input
            aria-label={`${label} color picker`}
            type='color'
            value={inferredColor(value)}
            onChange={(event) => onChange(event.target.value)}
          />
          <select
            aria-label={`${label} token`}
            value={value?.match(/^var\(--([^)]+)\)$/)?.[1] || ''}
            onChange={(event) =>
              event.target.value ? onChange(`var(--${event.target.value})`) : undefined
            }
          >
            <option value=''>Custom</option>
            {COLOR_TOKENS.map((token) => (
              <option key={token} value={token}>
                --{token}
              </option>
            ))}
          </select>
          <strong>{value || placeholder || 'Custom color'}</strong>
          <button type='button' onClick={() => onChange(resetValue)} aria-label={`Reset ${label}`}>
            ↶
          </button>
        </div>
      </label>
    );
  if (!range)
    return (
      <label className='design-field'>
        <span>{label}</span>
        <div className='design-text-row'>
          <input
            type={type}
            value={value || ''}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
          <button type='button' onClick={() => onChange(resetValue)} aria-label={`Reset ${label}`}>
            ↶
          </button>
        </div>
      </label>
    );
  return (
    <label className='design-field design-range-field'>
      <span className='design-range-heading'>
        <span>{label}</span>
        <strong>
          {numeric}
          {unit === 'auto' ? '' : unit}
        </strong>
      </span>
      <input
        className='design-range'
        aria-label={label}
        type='range'
        min={range.min}
        max={range.max}
        step={range.step}
        value={numeric}
        onChange={(event) => writeNumber(Number(event.target.value))}
      />
      <div className='design-range-actions'>
        <button
          type='button'
          onClick={() => writeNumber(numeric - range.step)}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          aria-label={`${label} numeric value`}
          type='number'
          min={range.min}
          max={range.max}
          step={range.step}
          value={numeric}
          onChange={(event) => writeNumber(Number(event.target.value))}
        />
        <select
          aria-label={`${label} unit`}
          value={unit}
          onChange={(event) => {
            setUnit(event.target.value);
            if (event.target.value === 'auto') onChange('auto');
            else writeNumber(numeric);
          }}
        >
          {UNITS.filter((item) =>
            range.unit === '%'
              ? item === '%'
              : range.unit === ''
                ? item === 'auto'
                : item !== 'auto'
          ).map((item) => (
            <option key={item} value={item}>
              {item || 'unitless'}
            </option>
          ))}
        </select>
        <button
          type='button'
          onClick={() => writeNumber(numeric + range.step)}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
        <button type='button' onClick={() => onChange(resetValue)} aria-label={`Reset ${label}`}>
          ↶
        </button>
      </div>
    </label>
  );
}

export function SelectControl({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className='design-field'>
      <span>{label}</span>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
        <option value=''>System default</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
export function StyleSection({
  title,
  children,
  open = false
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className='design-section' open={open}>
      <summary>{title}</summary>
      <div className='design-section-content'>{children}</div>
    </details>
  );
}
export function StyleGrid({
  styles,
  properties,
  onChange
}: {
  styles: StyleValues;
  properties: Array<{ key: string; label: string; type?: string; placeholder?: string }>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className='design-control-grid'>
      {properties.map((property) => (
        <Control
          key={property.key}
          propertyKey={property.key}
          label={property.label}
          type={property.type}
          placeholder={property.placeholder}
          value={styles[property.key]}
          onChange={(value) => onChange(property.key, value)}
        />
      ))}
    </div>
  );
}

export function ColorPreview({
  value,
  onChange
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='design-color-preview'>
      <input
        type='color'
        aria-label='Choose color'
        value={inferredColor(value)}
        onChange={(event) => onChange(event.target.value)}
      />
      <span>{value || 'Custom color'}</span>
    </div>
  );
}

export function ShadowControl({
  value,
  onChange
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const layers = value?.split(/,\s+(?=-?\d)/) || ['0 8px 24px rgba(0,0,0,0.18)'];
  const numbers = layers[0].match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [0, 8, 24, 0];
  const update = (index: number, next: number) => {
    const parts = [numbers[0] || 0, numbers[1] || 0, numbers[2] || 0, numbers[3] || 0];
    parts[index] = next;
    const first = `${parts[0]}px ${parts[1]}px ${parts[2]}px ${parts[3]}px rgba(0,0,0,0.18)`;
    onChange([first, ...layers.slice(1)].join(', '));
  };
  return (
    <div className='design-shadow-control'>
      <div
        className='design-shadow-preview'
        style={{ boxShadow: value || '0 8px 24px rgba(0,0,0,.18)' }}
      >
        Shadow preview · {layers.length} layer{layers.length === 1 ? '' : 's'}
      </div>
      <Control
        label='X'
        propertyKey='shadowX'
        value={`${numbers[0] || 0}px`}
        onChange={(next) => update(0, Number.parseFloat(next) || 0)}
      />
      <Control
        label='Y'
        propertyKey='shadowY'
        value={`${numbers[1] || 0}px`}
        onChange={(next) => update(1, Number.parseFloat(next) || 0)}
      />
      <Control
        label='Blur'
        propertyKey='blur'
        value={`${numbers[2] || 0}px`}
        onChange={(next) => update(2, Number.parseFloat(next) || 0)}
      />
      <Control
        label='Spread'
        propertyKey='shadowSpread'
        value={`${numbers[3] || 0}px`}
        onChange={(next) => update(3, Number.parseFloat(next) || 0)}
      />
      <Control
        label='Color / opacity'
        value={layers[0].match(/rgba?\([^)]*\)/)?.[0] || 'rgba(0,0,0,0.18)'}
        onChange={(next) =>
          onChange(
            `${numbers[0] || 0}px ${numbers[1] || 0}px ${numbers[2] || 0}px ${numbers[3] || 0}px ${next}${layers.length > 1 ? `, ${layers.slice(1).join(', ')}` : ''}`
          )
        }
      />
      <div className='design-shadow-actions'>
        <button
          type='button'
          onClick={() =>
            onChange(`${value || '0 8px 24px rgba(0,0,0,.18)'}, 0 4px 12px rgba(0,0,0,.1)`)
          }
        >
          + Add shadow
        </button>
        <button
          type='button'
          disabled={layers.length < 2}
          onClick={() => onChange(layers.slice(0, -1).join(', '))}
        >
          Remove shadow
        </button>
      </div>
    </div>
  );
}
