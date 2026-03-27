"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Connects Lenis scroll to GSAP ScrollTrigger so scroll-triggered animations fire correctly */
function LenisGSAPSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Every Lenis scroll frame → tell ScrollTrigger to recalculate
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP ticker instead of its own rAF
    const onTick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger positions after layout stabilizes
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 500);

    return () => {
      clearTimeout(refreshTimer);
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
    };
  }, [lenis]);

  return null;
}

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
      }}
    >
      <LenisGSAPSync />
      {children}
    </ReactLenis>
  );
}
