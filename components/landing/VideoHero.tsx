"use client";

import Copy from "./_shared/Copy";
import styles from "./VideoHero.module.css";

export default function VideoHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroMedia}>
        <video
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/10coffee-hero.mp4" type="video/mp4" />
        </video>
      </div>

      <div className={styles.heroOverlay} />

      <div className={styles.heroContainer}>
        <Copy type="words" animateOnScroll={false} delay={0.85}>
          <h2>Мы не делаем шаблонов</h2>
        </Copy>
        <Copy type="words" animateOnScroll={false} delay={1.1}>
          <p className={styles.heroSub}>Мы создаем уникальный продукт</p>
        </Copy>
      </div>
    </section>
  );
}
