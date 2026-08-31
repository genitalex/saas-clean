'use client';

import * as React from 'react';

/**
 * Measures the rendered height of an element and publishes it as a CSS
 * custom property on the document root (e.g. `--app-header-height`).
 *
 * This exists so persistent chrome (the top app header, the mobile bottom
 * nav) can expose its *actual* rendered height to the rest of the app,
 * instead of every consumer independently guessing/hardcoding a pixel or
 * rem value that has to be kept in sync by hand. Anything that needs to
 * size itself against "what's left of the viewport" reads the same
 * variable via `var(--app-header-height, <fallback>)`.
 *
 * Uses ResizeObserver so it stays correct across breakpoint changes, font
 * scaling, or future edits to the measured element — not just on mount.
 *
 * @param ref the element whose rendered height should be published
 * @param cssVariable the custom property name, e.g. '--app-header-height'
 */
export function useShellMetric(ref: React.RefObject<HTMLElement | null>, cssVariable: string) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const publish = (height: number) => {
      document.documentElement.style.setProperty(cssVariable, `${height}px`);
    };

    publish(el.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) publish(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(cssVariable);
    };
  }, [ref, cssVariable]);
}
