'use client';
import {useEffect, useRef} from 'react';

type Props = {
  maxCount?: number;          // верхняя граница количества частиц (реальное кол-во масштабируется от площади)
  maxSpeed?: number;          // px/кадр
  linkDistance?: number;      // порог расстояния для линий
  lineWidth?: number;
  lineColor?: string;
  pointSize?: number;
  pointColor?: string;
  mouseRadius?: number;       // радиус влияния курсора
  mousePower?: number;        // сила реакции
  mouseMode?: 'repel' | 'attract';
  asBackground?: boolean;     // рисовать как фон (absolute inset-0, pointer-events:none)
  className?: string;
};

export default function MouseRepelField({
  maxCount = 64,
  maxSpeed = 0.7,
  linkDistance = 120,
  lineWidth = 1,
  lineColor = 'rgba(99,102,241,0.5)', // indigo-500 @ 0.5
  pointSize = 2,
  pointColor = 'rgba(59,130,246,0.9)', // blue-500
  mouseRadius = 130,
  mousePower = 900,
  mouseMode = 'repel',
  asBackground = true,
  className = '',
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let mounted = true;
    let active = true;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;

    const resize = () => {
      const {width, height} = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * DPR));
      canvas.height = Math.max(1, Math.floor(height * DPR));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    type P = { x:number; y:number; vx:number; vy:number; };
    let points: P[] = [];

    const initPoints = () => {
      const {width, height} = wrap.getBoundingClientRect();
      const target = Math.min(
        maxCount,
        Math.max(20, Math.round((width * height) / 9000)) // плотность ~ 1/9000px²
      );
      points = Array.from({length: target}).map(() => ({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-maxSpeed, maxSpeed),
        vy: rand(-maxSpeed, maxSpeed),
      }));
    };

    // ===== МЫШЬ: слушаем WINDOW, чтобы работать при pointer-events:none =====
    const mouse = { x: 0, y: 0, inside: false };
    const onPointerMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height;
    };
    const onPointerLeaveDoc = () => { mouse.inside = false; };

    const r2 = mouseRadius * mouseRadius;
    const friction = 0.995;

    const draw = () => {
      const {width, height} = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      // обновление позиций и реакция на мышь
      for (const p of points) {
        p.vx *= friction; p.vy *= friction;

        if (mouse.inside) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < r2 && d2 > 0.001) {
            const inv = 1 / Math.sqrt(d2);
            const force = mousePower / (d2 + 60);
            const fx = dx * inv * force;
            const fy = dy * inv * force;
            if (mouseMode === 'repel') {
              p.vx += fx; p.vy += fy;
            } else {
              p.vx -= fx; p.vy -= fy;
            }
          }
        }

        p.x += p.vx; p.y += p.vy;

        // отражение от границ
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > height) { p.y = height; p.vy *= -1; }
      }

      // линии
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDistance) {
            const t = 1 - d / linkDistance; // прозрачность по расстоянию
            ctx.strokeStyle = withAlpha(lineColor, t * 0.9);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // точки
      ctx.fillStyle = pointColor;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const withAlpha = (color: string, alpha: number) => {
      if (color.startsWith('rgba')) {
        return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/,
          (_m, r, g, b) => `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
      }
      if (color.startsWith('rgb(')) {
        const nums = color.slice(4, -1);
        return `rgba(${nums},${alpha.toFixed(3)})`;
      }
      return color;
    };

    const step = () => {
      if (!mounted) return;
      if (active) draw();
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      active = !!entries[0]?.isIntersecting;
    }, { threshold: 0.01 });
    io.observe(wrap);

    const ro = new (window as any).ResizeObserver(() => { resize(); initPoints(); });
    ro.observe(wrap);

    const onVisibility = () => { active = document.visibilityState !== 'hidden'; };

    // init
    resize();
    initPoints();
    if (!prefersReduced) {
      // слушаем ВСЁ окно, чтобы pointer-events:none не мешал
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeaveDoc, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      step();
    }

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointerMove as any);
      window.removeEventListener('pointerleave', onPointerLeaveDoc as any);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    maxCount, maxSpeed, linkDistance, lineWidth, lineColor,
    pointSize, pointColor, mouseRadius, mousePower, mouseMode
  ]);

  // фон не влияет на лейаут, не перехватывает клики
  const bgStyle: React.CSSProperties | undefined = asBackground
    ? { position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }
    : undefined;

  return (
    <div ref={wrapRef} className={className} style={bgStyle} aria-hidden>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
