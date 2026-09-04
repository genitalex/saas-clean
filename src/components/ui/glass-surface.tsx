'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type GlassMaterial = 'clear' | 'regular' | 'frosted';

type GlassSurfaceProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  material?: GlassMaterial;
  refractive?: boolean;
  refractionStrength?: number;
};

const FILTERS = [
  { material: 'clear', scale: 10, frequency: '0.006 0.012' },
  { material: 'regular', scale: 14, frequency: '0.008 0.014' },
  { material: 'frosted', scale: 17, frequency: '0.01 0.016' }
] as const;

function ensureGlassFilters(): void {
  if (typeof document === 'undefined' || document.getElementById('glass-filter-registry')) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'glass-filter-registry';
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'fixed';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.pointerEvents = 'none';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  FILTERS.forEach(({ material, scale, frequency }) => {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.id = `glass-filter-${material}`;
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', frequency);
    turbulence.setAttribute('numOctaves', '2');
    turbulence.setAttribute('seed', '7');
    turbulence.setAttribute('result', 'glass-noise');

    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'baseFrequency');
    animate.setAttribute('values', `${frequency};${frequency} 0.018;${frequency}`);
    animate.setAttribute('dur', '7s');
    animate.setAttribute('repeatCount', 'indefinite');
    turbulence.appendChild(animate);

    const displacement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'feDisplacementMap'
    );
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('in2', 'glass-noise');
    displacement.setAttribute('scale', String(scale));
    displacement.setAttribute('xChannelSelector', 'R');
    displacement.setAttribute('yChannelSelector', 'G');

    filter.append(turbulence, displacement);
    defs.appendChild(filter);
  });

  svg.appendChild(defs);
  document.body.appendChild(svg);
}

export const GlassSurface = React.forwardRef<HTMLElement, GlassSurfaceProps>(function GlassSurface(
  {
    as: Component = 'div',
    material = 'regular',
    refractive = false,
    refractionStrength,
    className,
    children,
    style,
    ...props
  },
  ref
) {
  React.useEffect(() => {
    ensureGlassFilters();
  }, []);

  return (
    <Component
      ref={ref}
      data-glass-material={material}
      data-glass-refractive={refractive ? 'true' : 'false'}
      className={cn('glass-surface', className)}
      style={{
        ...style,
        ...(refractionStrength === undefined
          ? undefined
          : ({ '--glass-refraction-strength': refractionStrength } as React.CSSProperties))
      }}
      {...props}
    >
      <span className='glass-surface__refraction' aria-hidden='true' />
      <span className='glass-surface__content'>{children}</span>
    </Component>
  );
});

GlassSurface.displayName = 'GlassSurface';

export type { GlassMaterial, GlassSurfaceProps };
