'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';

type AlphabetTracePadProps = {
  character: string;
  transliteration: string;
  accent: string;
  onPracticed?: () => void;
};

type Point = { x: number; y: number };

export default function AlphabetTracePad({ character, transliteration, accent, onPracticed }: AlphabetTracePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const practicedRef = useRef(false);

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.strokeRect(size * 0.08, size * 0.08, size * 0.84, size * 0.84);
    ctx.setLineDash([]);

    ctx.font = `${size * 0.62}px var(--font-ethiopic-display), var(--font-ethiopic), sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.fillText(character, size / 2, size / 2 + size * 0.03);
  }, [character]);

  useEffect(() => {
    drawGuide();
    setStrokeCount(0);
    setHasDrawn(false);
    practicedRef.current = false;
  }, [character, drawGuide]);

  useEffect(() => {
    const onResize = () => drawGuide();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawGuide]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
    setStrokeCount((count) => count + 1);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getPoint(event);
    const last = lastPointRef.current ?? point;

    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(4, canvas.clientWidth * 0.018);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
    setHasDrawn(true);

    if (!practicedRef.current) {
      practicedRef.current = true;
      onPracticed?.();
    }
  };

  const endDraw = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    drawGuide();
    setStrokeCount(0);
    setHasDrawn(false);
    practicedRef.current = false;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Trace this letter</p>
          <p className="text-xs text-slate-500">
            Use your finger or mouse to follow the faded guide — <span className="font-ethiopic text-base">{character}</span>{' '}
            ({transliteration})
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={clear}>
          Clear
        </Button>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          className="aspect-square w-full touch-none cursor-crosshair"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          aria-label={`Tracing pad for ${character}`}
        />
      </div>

      <p className="text-xs text-slate-500">
        {hasDrawn
          ? `Nice work! ${strokeCount} stroke${strokeCount === 1 ? '' : 's'} — keep practicing until the shape feels natural.`
          : 'Draw on top of the light gray letter to practice writing it.'}
      </p>
    </div>
  );
}
