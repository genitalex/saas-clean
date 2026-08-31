'use client';

import * as React from 'react';

/**
 * Tracks scroll direction on window scroll to drive show/hide chrome
 * (e.g. a mobile bottom nav). Designed to be cheap:
 * - passive scroll listener, coalesced with requestAnimationFrame
 * - returns a boolean ref-like state that only changes on real direction
 *   flips, not on every pixel, so it doesn't cause excess re-renders
 * - always "visible" near the top of the page
 *
 * @param threshold minimum px scrolled before we react (avoids jitter)
 * @param topOffset px from top that always counts as "visible"
 */
export function useScrollDirection(threshold = 8, topOffset = 24) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const currentY = window.scrollY;
      const delta = currentY - lastY;

      if (currentY <= topOffset) {
        setVisible(true);
      } else if (Math.abs(delta) > threshold) {
        setVisible(delta < 0);
      }

      lastY = currentY;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, topOffset]);

  return visible;
}
