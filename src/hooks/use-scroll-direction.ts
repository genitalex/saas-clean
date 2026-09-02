'use client';

import * as React from 'react';

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

    const onMouseMove = (event: MouseEvent) => {
      if (event.clientY >= window.innerHeight - 110) {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [threshold, topOffset]);

  return visible;
}
