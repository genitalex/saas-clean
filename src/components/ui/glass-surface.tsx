import type { ComponentProps } from 'react';

import { LiquidGlassSurface } from '@/components/ui/liquid-glass';

type GlassSurfaceProps = ComponentProps<typeof LiquidGlassSurface> & {
  material?: 'clear' | 'regular' | 'frosted';
  refractive?: boolean;
  refractionStrength?: number;
};

export function GlassSurface({
  material: _material,
  refractive: _refractive,
  refractionStrength: _refractionStrength,
  ...props
}: GlassSurfaceProps) {
  return <LiquidGlassSurface {...props} />;
}

export type { GlassSurfaceProps };
