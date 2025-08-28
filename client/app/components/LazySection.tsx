'use client';
import {useEffect, useRef, useState} from 'react';

type Props = {
  children: React.ReactNode;
  rootMargin?: string;
  fallbackMinHeight?: number;
  className?: string;
};

export default function LazySection({
  children,
  rootMargin = '300px 0px',
  fallbackMinHeight = 480,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          io && io.disconnect();
          io = null;
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => { if (io) io.disconnect(); };
  }, [rootMargin]);

  return (
    <div ref={ref} className={className} style={!visible ? {minHeight: fallbackMinHeight} : undefined}>
      {visible ? children : null}
    </div>
  );
}
