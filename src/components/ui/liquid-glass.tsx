'use client';

import type { ComponentProps } from 'react';

import { LiquidGlass } from 'react-liquid-glass-svg';
import { useThemeConfig } from '@/components/themes/active-theme';
import { cn } from '@/lib/utils';

export type LiquidGlassSurfaceProps = ComponentProps<typeof LiquidGlass>;

export const LIQUID_GLASS_MATERIAL = {
  backdropBlur: 7,
  tintColor: 'rgba(0, 0, 0, 0.14)',
  displacementScale: 170,
  turbulenceBaseFrequency: 0.008,
  turbulenceSeed: 0,
  glassBorder: true
} as const;

export const LIQUID_GLASS_BORDER_RADIUS = 16;

export function LiquidGlassSurface(props: LiquidGlassSurfaceProps) {
  const { activeTheme } = useThemeConfig();
  const { style, ...rest } = props;

  if (activeTheme !== 'glass') {
    const { as: Component = 'div', children, className, ...fallbackProps } = rest;
    return (
      <Component
        {...fallbackProps}
        className={cn('liquid-glass-fallback', className)}
        style={{ ...style, borderRadius: LIQUID_GLASS_BORDER_RADIUS }}
      >
        {children}
      </Component>
    );
  }

  return (
    <LiquidGlass
      {...rest}
      {...LIQUID_GLASS_MATERIAL}
      style={{ ...style, borderRadius: LIQUID_GLASS_BORDER_RADIUS }}
    />
  );
}
