"use client";

import Copy from "./_shared/Copy";
import styles from "./Mission.module.css";

export default function Mission() {
  return (
    <section className={styles.section} id="mission">
      <div className={styles.container}>
        <Copy>
          <p className="mono">Наша миссия</p>
          <h3>
            Мы верим, что кофе — это не просто напиток, а инструмент, который
            помогает бизнесу расти, создавая уникальный опыт для каждого гостя.
          </h3>
          <h3>
            Наша задача — стать надёжным партнёром, который обеспечивает
            стабильное качество, поддержку и развитие кофейной культуры.
          </h3>
        </Copy>
      </div>
    </section>
  );
}
