'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type SignaturePadProps = {
  value?: string;
  onChange?: (value: string) => void;
  label: string;
};

export function SignaturePad({ value = '', onChange, label }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2;
      context.strokeStyle = '#172019';

      if (value) {
        const image = new Image();
        image.onload = () => {
          context.clearRect(0, 0, rect.width, rect.height);
          context.drawImage(image, 0, 0, rect.width, rect.height);
        };
        image.src = value;
      }
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [value]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const emitValue = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onChange) return;
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className='rounded-[14px] border border-border/60 bg-background'>
      <div className='flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2.5'>
        <div>
          <p className='text-xs font-semibold'>{label}</p>
          <p className='text-muted-foreground mt-0.5 text-[10px]'>
            Firma con ratón o pantalla táctil.
          </p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='h-7 gap-1.5 px-2 text-[10px]'
          onClick={() => onChange?.('')}
          disabled={!value}
        >
          <Icons.trash className='size-3.5' />
          Limpiar
        </Button>
      </div>

      <div className='relative'>
        <canvas
          ref={canvasRef}
          aria-label={label}
          className='block h-[120px] w-full touch-none cursor-crosshair bg-white'
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            lastPointRef.current = pointFromEvent(event);
          }}
          onPointerMove={(event) => {
            if (!drawingRef.current) return;
            const canvas = canvasRef.current;
            const context = canvas?.getContext('2d');
            if (!canvas || !context) return;

            const point = pointFromEvent(event);
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 2;
            context.strokeStyle = '#172019';
            context.beginPath();
            context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            context.lineTo(point.x, point.y);
            context.stroke();
            lastPointRef.current = point;
          }}
          onPointerUp={(event) => {
            drawingRef.current = false;
            event.currentTarget.releasePointerCapture(event.pointerId);
            emitValue();
          }}
          onPointerCancel={() => {
            drawingRef.current = false;
          }}
        />
        <div className='pointer-events-none absolute inset-x-4 bottom-5 border-b border-dashed border-border/70' />
        {!value && (
          <span className='pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-muted-foreground/55'>
            Firma aquí
          </span>
        )}
      </div>
    </div>
  );
}
