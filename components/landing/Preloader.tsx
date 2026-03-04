"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import styles from "./Preloader.module.css";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const EXIT_ANIMATION_MS = 700;
const SESSION_KEY = "10coffee_preloader_shown";

function hasSeenPreloader(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markPreloaderSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

interface PreloaderProps {
  onAnimationComplete?: () => void;
}

/** Button with per-character hover animation */
function CharButton({
  text,
  className,
  bgClassName,
  onClick,
  btnRef,
}: {
  text: string;
  className: string;
  bgClassName?: string;
  onClick?: () => void;
  btnRef?: React.Ref<HTMLButtonElement>;
}) {
  const internalRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = internalRef.current;
    if (!button || window.innerWidth < 1000) return;

    const defaultChars = button.querySelectorAll(`.${styles.charDefault}`);
    const hoverChars = button.querySelectorAll(`.${styles.charHover}`);

    gsap.set(defaultChars, { yPercent: 0 });
    gsap.set(hoverChars, { yPercent: -100 });

    const handleMouseEnter = () => {
      gsap.to(defaultChars, {
        yPercent: 100,
        duration: 0.3,
        ease: "power3.out",
        stagger: 0.015,
      });
      gsap.to(hoverChars, {
        yPercent: 0,
        duration: 0.3,
        ease: "power3.out",
        stagger: 0.015,
        delay: 0.08,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(hoverChars, {
        yPercent: -100,
        duration: 0.4,
        ease: "power3.inOut",
        stagger: 0.015,
      });
      gsap.to(defaultChars, {
        yPercent: 0,
        duration: 0.4,
        ease: "power3.inOut",
        stagger: 0.015,
        delay: 0.1,
      });
    };

    button.addEventListener("mouseenter", handleMouseEnter);
    button.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      button.removeEventListener("mouseenter", handleMouseEnter);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const mergeRef = (node: HTMLButtonElement | null) => {
    (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current =
      node;
    if (typeof btnRef === "function") btnRef(node);
    else if (btnRef && typeof btnRef === "object")
      (btnRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
  };

  const chars = text.split("");

  return (
    <button type="button" className={className} ref={mergeRef} onClick={onClick}>
      {bgClassName && <span className={bgClassName} />}
      <span className={styles.btnText}>
        {chars.map((char, i) => (
          <span key={i} className={styles.char}>
            <span className={styles.charDefault}>
              {char === " " ? "\u00A0" : char}
            </span>
            <span className={styles.charHover}>
              {char === " " ? "\u00A0" : char}
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

export default function Preloader({ onAnimationComplete }: PreloaderProps) {
  const lenis = useLenis();
  const buttonWrapRef = useRef<HTMLDivElement>(null);
  const enterBtnRef = useRef<HTMLButtonElement>(null);

  const [isVisible, setIsVisible] = useState(() => !hasSeenPreloader());
  const [isScrollLocked, setIsScrollLocked] = useState(
    () => !hasSeenPreloader(),
  );
  const [progress, setProgress] = useState(0);
  const [hasFinishedLoading, setHasFinishedLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isScrollLocked) {
      if (lenis) lenis.start();
      document.body.style.overflow = "";
      return;
    }

    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";

    return () => {
      if (lenis) lenis.start();
      document.body.style.overflow = "";
    };
  }, [lenis, isScrollLocked]);

  useEffect(() => {
    if (!isVisible) return;

    let frameId: number | null = null;
    const startTime = performance.now();
    const duration = 2600;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const ratio = clamp(elapsed / duration, 0, 1);
      const percent = Math.round(ratio * 100);

      setProgress(percent);

      if (percent >= 100) {
        setHasFinishedLoading(true);
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isVisible]);

  // Animate buttons in when loading completes
  useEffect(() => {
    if (!hasFinishedLoading || !buttonWrapRef.current) return;

    const enterBtn = enterBtnRef.current;

    gsap.set(buttonWrapRef.current, { autoAlpha: 0, y: 20 });
    if (enterBtn) gsap.set(enterBtn, { scale: 0.9, autoAlpha: 0 });

    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(buttonWrapRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out",
    });

    if (enterBtn) {
      tl.to(
        enterBtn,
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
        },
        "-=0.3",
      );
    }
  }, [hasFinishedLoading]);

  const loadingText = useMemo(() => `${progress}%`, [progress]);

  const handleEnterClick = () => {
    if (!hasFinishedLoading || isExiting) return;

    setIsExiting(true);
    setIsScrollLocked(false);
    markPreloaderSeen();

    window.setTimeout(() => {
      setIsVisible(false);
      if (onAnimationComplete) onAnimationComplete();
    }, EXIT_ANIMATION_MS);
  };

  if (!isVisible) return null;

  return (
    <section
      className={`${styles.preloader} ${isExiting ? styles.isExiting : ""}`}
      aria-label="Website preloader"
    >
      <div className={styles.preloaderInner}>
        <div className={styles.titleWrap}>
          <h2 className={`${styles.title} ${styles.titleBase}`}>10coffee</h2>
          <h2
            className={`${styles.title} ${styles.titleFill}`}
            style={{ width: `${progress}%` }}
          >
            10coffee
          </h2>
        </div>

        <div className={styles.actionSlot}>
          <p
            className={`${styles.loading} ${hasFinishedLoading ? styles.loadingHidden : ""}`}
            aria-live="polite"
          >
            {loadingText}
          </p>

          <div className={styles.buttonWrap} ref={buttonWrapRef}>
            <CharButton
              text="Войти на сайт"
              className={styles.storeBtn}
              onClick={handleEnterClick}
              btnRef={enterBtnRef}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
