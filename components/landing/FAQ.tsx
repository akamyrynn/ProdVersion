"use client";

import { useState } from "react";
import Copy from "./_shared/Copy";
import { FAQ_ITEMS } from "./data/faq-data";
import styles from "./FAQ.module.css";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Copy type="words" animateOnScroll>
            <h3>FAQ</h3>
          </Copy>

          <div>
            {FAQ_ITEMS.map((item, index) => (
              <div className={styles.accordionItem} key={index}>
                <button
                  type="button"
                  className={styles.accordionTrigger}
                  onClick={() => toggle(index)}
                >
                  <span>{item.question}</span>
                  <span
                    className={`${styles.accordionIcon} ${openIndex === index ? styles.accordionIconOpen : ""}`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`${styles.accordionContent} ${openIndex === index ? styles.accordionContentOpen : ""}`}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <Copy type="lines" animateOnScroll>
            <h4>Покупайте онлайн</h4>
          </Copy>
          <Copy type="lines" animateOnScroll>
            <p>Наш кофе и чай также доступны на маркетплейсах</p>
          </Copy>
          <a
            href="https://10cofshop.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ozonBtn}
          >
            Купить на Ozon
          </a>
        </div>
      </div>
    </section>
  );
}
