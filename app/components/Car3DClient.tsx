"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Car3D = dynamic(() => import("./Car3D"), {
  ssr: false,
  loading: () => <CarSkeleton />,
});

function CarSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-24 w-40 animate-pulse rounded-2xl bg-brand/20" />
    </div>
  );
}

export default function Car3DClient() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    // Respect reduced-motion + skip WebGL on very small/again-unsupported cases.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setEnabled(false);

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!ref.current) return;
        const y = window.scrollY;
        // Subtle scroll parallax: the car drifts up and fades slightly.
        ref.current.style.transform = `translateY(${y * -0.08}px)`;
        ref.current.style.opacity = String(Math.max(0, 1 - y / 700));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="h-full w-full will-change-transform">
      {enabled ? <Car3D /> : <CarSkeleton />}
    </div>
  );
}
