import type { ComponentProps } from 'react';

import { LiquidGlass } from 'react-liquid-glass-svg';

export type LiquidGlassSurfaceProps = ComponentProps<typeof LiquidGlass>;

export function LiquidGlassSurface(props: LiquidGlassSurfaceProps) {
  return <LiquidGlass {...props} />;
}
