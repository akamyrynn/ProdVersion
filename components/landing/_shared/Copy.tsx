"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);

const REQUIRED_FONTS = ["Google Sans"];

async function waitForFonts() {
  try {
    await document.fonts.ready;
    REQUIRED_FONTS.forEach((font) => document.fonts.check(`16px "${font}"`));
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function resolveTriggerElement(
  selector: string | null,
  fallback: HTMLElement,
): HTMLElement {
  if (typeof selector === "string" && selector.trim().length > 0) {
    return (
      (fallback.closest(selector) as HTMLElement) ||
      (document.querySelector(selector) as HTMLElement) ||
      fallback
    );
  }
  return fallback;
}

interface CopyProps {
  children: React.ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  type?: "lines" | "words";
  trigger?: string | null;
  triggerPoint?: string | null;
  start?: string | null;
}

export default function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
  type = "lines",
  trigger = null,
  triggerPoint = null,
  start = null,
}: CopyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splitInstanceRefs = useRef<SplitText[]>([]);
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      let isActive = true;

      const cleanupInstances = () => {
        scrollTriggerRefs.current.forEach((st) => st?.kill());
        scrollTriggerRefs.current = [];

        splitInstanceRefs.current.forEach((split) => split?.revert());
        splitInstanceRefs.current = [];
      };

      const buildAnimations = async () => {
        await waitForFonts();
        if (!isActive || !containerRef.current) return;

        cleanupInstances();

        const targetElements = containerRef.current.hasAttribute(
          "data-copy-wrapper",
        )
          ? Array.from(containerRef.current.children) as HTMLElement[]
          : [containerRef.current];

        const resolvedType = type === "words" ? "words" : "lines";
        const resolvedStart = start ?? "top 80%";

        const triggerElement = resolveTriggerElement(
          triggerPoint ?? trigger,
          containerRef.current,
        );

        const splitUnits: HTMLElement[] = [];

        targetElements.forEach((element) => {
          const isWordSplit = resolvedType === "words";

          const split = SplitText.create(element, {
            type: isWordSplit ? "words" : "lines",
            mask: isWordSplit ? "words" : "lines",
            ...(isWordSplit
              ? { wordsClass: "word" }
              : { linesClass: "line", lineThreshold: 0.1 }),
          });

          splitInstanceRefs.current.push(split);

          const units = isWordSplit ? split.words : split.lines;

          const computedStyle = window.getComputedStyle(element);
          const textIndent = computedStyle.textIndent;
          if (textIndent && textIndent !== "0px" && units.length > 0) {
            (units[0] as HTMLElement).style.paddingLeft = textIndent;
            element.style.textIndent = "0";
          }

          splitUnits.push(...(units as HTMLElement[]));
        });

        gsap.set(splitUnits, { y: "110%" });

        const revealAnimation = gsap.to(splitUnits, {
          y: "0%",
          duration: 1,
          ease: "power4.out",
          stagger: 0.1,
          delay,
          paused: animateOnScroll,
        });

        if (animateOnScroll) {
          const scrollTrigger = ScrollTrigger.create({
            trigger: triggerElement,
            start: resolvedStart,
            animation: revealAnimation,
            once: true,
            refreshPriority: -1,
          });
          scrollTriggerRefs.current.push(scrollTrigger);
        }
      };

      buildAnimations();

      return () => {
        isActive = false;
        cleanupInstances();
      };
    },
    {
      scope: containerRef,
      dependencies: [
        animateOnScroll,
        delay,
        type,
        trigger,
        triggerPoint,
        start,
      ],
    },
  );

  if (React.Children.count(children) === 1 && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }>,
      { ref: containerRef },
    );
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
}
