"use client";

import { useState } from "react";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import { PRODUCT_CATEGORIES } from "./data/products-data";
import styles from "./ProductShowcase.module.css";

export default function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = PRODUCT_CATEGORIES[activeCategory];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Copy type="words" animateOnScroll>
          <h3>Наша продукция</h3>
        </Copy>

        <div className={styles.tabs}>
          {PRODUCT_CATEGORIES.map((cat, index) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.tab} ${index === activeCategory ? styles.tabActive : ""}`}
              onClick={() => setActiveCategory(index)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {category.items.map((item, index) => (
            <div className={styles.card} key={`${category.id}-${index}`}>
              <div className={styles.cardImg}>
                <img src={item.image} alt={item.name} />
              </div>
              <div className={styles.cardBody}>
                <h6>{item.name}</h6>
                <p className="sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.ctaWrap}>
          <AnimatedButton href="#price-list-form">
            Получить прайс-лист
          </AnimatedButton>
        </div>
      </div>
    </section>
  );
}
