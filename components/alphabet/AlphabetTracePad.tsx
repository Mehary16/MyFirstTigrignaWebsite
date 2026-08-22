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
type Stroke = Point[];

export default function AlphabetTracePad({ character, transliteration, accent, onPracticed }: AlphabetTracePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const practicedRef = useRef(false);

  const drawStrokePath = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: Stroke, lineWidth: number) => {
      if (stroke.length === 0) return;

      ctx.strokeStyle = accent;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i += 1) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    },
    [accent]
  );

  const redrawCanvas = useCallback(() => {
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

    const lineWidth = Math.max(4, size * 0.018);
    for (const stroke of strokesRef.current) {
      drawStrokePath(ctx, stroke, lineWidth);
    }
    if (currentStrokeRef.current) {
      drawStrokePath(ctx, currentStrokeRef.current, lineWidth);
    }
  }, [character, drawStrokePath]);

  useEffect(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redrawCanvas();
    setStrokeCount(0);
    setHasDrawn(false);
    practicedRef.current = false;
  }, [character, redrawCanvas]);

  useEffect(() => {
    const onResize = () => redrawCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [redrawCanvas]);

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
    const point = getPoint(event);
    currentStrokeRef.current = [point];
    setStrokeCount((count) => count + 1);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentStrokeRef.current) return;

    const point = getPoint(event);
    currentStrokeRef.current.push(point);
    redrawCanvas();
    setHasDrawn(true);

    if (!practicedRef.current) {
      practicedRef.current = true;
      onPracticed?.();
    }
  };

  const endDraw = () => {
    if (currentStrokeRef.current && currentStrokeRef.current.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = null;
    drawingRef.current = false;
  };

  const undoLastStroke = () => {
    if (drawingRef.current) {
      currentStrokeRef.current = null;
      drawingRef.current = false;
      redrawCanvas();
      setStrokeCount((count) => Math.max(0, count - 1));
      setHasDrawn(strokesRef.current.length > 0);
      if (strokesRef.current.length === 0) {
        practicedRef.current = false;
      }
      return;
    }

    if (strokesRef.current.length === 0) return;

    strokesRef.current.pop();
    redrawCanvas();
    setStrokeCount((count) => Math.max(0, count - 1));
    setHasDrawn(strokesRef.current.length > 0);

    if (strokesRef.current.length === 0) {
      practicedRef.current = false;
    }
  };

  const clear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redrawCanvas();
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
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={undoLastStroke}
            disabled={strokeCount === 0}
          >
            Undo
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={clear} disabled={strokeCount === 0}>
            Clear all
          </Button>
        </div>
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
