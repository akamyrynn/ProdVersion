"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./Marquee.module.css";

const MARQUEE_TEXT = "10 КОФЕ";
const MARQUEE_REPEAT = 12;

export default function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const items = track.querySelectorAll(`.${styles.item}`);
    if (!items.length) return;

    const itemWidth = (items[0] as HTMLElement).offsetWidth;
    const halfLoopWidth = itemWidth * (MARQUEE_REPEAT / 2);

    const scrollTween = gsap.to(track, {
      x: -halfLoopWidth,
      duration: 30,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x: string) => parseFloat(x) % halfLoopWidth),
      },
    });

    const pill = track.parentElement!;

    const handleMouseEnter = () =>
      gsap.to(scrollTween, { timeScale: 0, duration: 0.5 });
    const handleMouseLeave = () =>
      gsap.to(scrollTween, { timeScale: 1, duration: 0.5 });

    pill.addEventListener("mouseenter", handleMouseEnter);
    pill.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      pill.removeEventListener("mouseenter", handleMouseEnter);
      pill.removeEventListener("mouseleave", handleMouseLeave);
      scrollTween.kill();
    };
  }, []);

  return (
    <section className={styles.marquee}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>Кофе</h1>
          <h3>для бизнеса</h3>
        </div>

        <div className={styles.pill}>
          <div className={styles.track} ref={trackRef}>
            {Array.from({ length: MARQUEE_REPEAT }, (_, index) => (
              <span className={styles.item} key={index}>
                {MARQUEE_TEXT}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
