'use client';

import type { StyleValues } from '../types/design-types';

export function Control({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = ''
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className='design-field'>
      <span>{label}</span>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
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
