"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Fire reveal when 10% of the element is in view, biased 40px past the
// viewport bottom so content settles before reaching the fold.
const REVEAL_THRESHOLD = 0.1;
const REVEAL_ROOT_MARGIN = "0px 0px -40px 0px";

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const delayRef = useRef(delay);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delayRef.current}ms`;
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
}
