"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Copy from "./_shared/Copy";
import styles from "./Production.module.css";

gsap.registerPlugin(ScrollTrigger);

const IMAGE_COUNT = 5;

export default function Production() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const imgs = gsap.utils.toArray(`.${styles.aboutImg}`) as HTMLElement[];

      imgs.forEach((image) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: image,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });

        tl.fromTo(image, { scale: 0.5 }, { scale: 1.25, ease: "none" }).to(
          image,
          { scale: 0.5, ease: "none" },
        );
      });

      const heading = sectionRef.current?.querySelector(
        `.${styles.headerContainer} h3`,
      );
      if (heading) {
        gsap.to(heading, {
          opacity: 0,
          ease: "power1.out",
          scrollTrigger: {
            trigger: `.${styles.aboutImgs}`,
            start: "bottom bottom",
            end: "bottom 30%",
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.about} ref={sectionRef}>
      <div className={styles.aboutHeader}>
        <div className={styles.headerContainer}>
          <Copy type="lines">
            <h3>
              От зелёного зерна до готовой чашки — контролируем каждый этап
              производства.
            </h3>
          </Copy>

          <div className={styles.footer}>
            <Copy type="lines" start="top 50%" delay={0.5}>
              <p className="sm">Производство</p>
            </Copy>
            <Copy type="lines" start="top 50%" delay={0.6}>
              <p className="sm">Контроль качества</p>
            </Copy>
          </div>
        </div>
      </div>

      <div className={styles.aboutImgs}>
        <div className={styles.imgsContainer}>
          {Array.from({ length: IMAGE_COUNT }, (_, index) => (
            <div key={index + 1} className={styles.aboutImg}>
              <img
                src={`/landing/production/production-${index + 1}.png`}
                alt=""
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
