"use client";

import { useEffect, useRef } from "react";

export function HeroParallax({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const img = el.querySelector("img");
    if (!img) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = el!.getBoundingClientRect();
        const viewH = window.innerHeight;
        // Only apply when element is in view
        if (rect.bottom > 0 && rect.top < viewH) {
          const progress = (viewH - rect.top) / (viewH + rect.height);
          const offset = (progress - 0.5) * 30; // max ±15px
          img!.style.transform = `scale(1.08) translateY(${offset}px)`;
        }
        ticking = false;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={ref} className={`parallax-hero ${className}`}>
      {children}
    </div>
  );
}
