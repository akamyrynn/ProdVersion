"use client";

import Copy from "./_shared/Copy";
import styles from "./MapPlaceholder.module.css";

export default function MapPlaceholder() {
  return (
    <section className={styles.mapSection} id="where-to-try">
      <div className={styles.mapInner}>
        <Copy type="words" animateOnScroll>
          <h3>Где попробовать</h3>
        </Copy>
        <Copy type="lines" animateOnScroll>
          <p className="md">
            Интерактивная карта с точками продаж появится здесь совсем скоро
          </p>
        </Copy>
      </div>
    </section>
  );
}
