"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import PriceListFormModal from "./PriceListFormModal";
import styles from "./ProductImages.module.css";

gsap.registerPlugin(ScrollTrigger);

const PRODUCTS = [
  { name: "Гондурас", image: "/Ассортимент/Мокап Гондурас.png", thumb: "/Ассортимент/Мокап Гондурас.png" },
  { name: "Колумбия 036", image: "/Ассортимент/Мокап Колумбия 036.png", thumb: "/Ассортимент/Мокап Колумбия 036.png" },
  { name: "Колумбия Декаф", image: "/Ассортимент/Мокап Колумбия Декаф.png", thumb: "/Ассортимент/Мокап Колумбия Декаф.png" },
];

export default function ProductImages() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const active = PRODUCTS[activeIndex];

  const animateTransition = useCallback((newIndex: number) => {
    const img = imageRef.current;
    if (!img) {
      setActiveIndex(newIndex);
      return;
    }
    gsap.to(img, {
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      onComplete: () => {
        setActiveIndex(newIndex);
        gsap.fromTo(
          img,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
        );
      },
    });
  }, []);

  const handlePrev = () => {
    const idx = activeIndex === 0 ? PRODUCTS.length - 1 : activeIndex - 1;
    animateTransition(idx);
  };

  const handleNext = () => {
    const idx = activeIndex === PRODUCTS.length - 1 ? 0 : activeIndex + 1;
    animateTransition(idx);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const fadeElements = section.querySelectorAll(`.${styles.fadeIn}`);
    gsap.set(fadeElements, { autoAlpha: 0, y: 40 });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      once: true,
      onEnter: () => {
        gsap.to(fadeElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div className={styles.wrapper}>
      <section className={styles.section} ref={sectionRef}>
        <div className={styles.header}>
          <Copy type="words" animateOnScroll>
            <h3>Ассортимент</h3>
          </Copy>
        </div>

        <div className={`${styles.slider} ${styles.fadeIn}`}>
          <button
            className={`${styles.arrowBtn} ${styles.arrowPrev}`}
            onClick={handlePrev}
            aria-label="Предыдущий"
          >
            <ArrowLeft className={styles.arrowIcon} />
          </button>

          <div className={styles.mainImage}>
            <img ref={imageRef} src={active.image} alt={active.name} />
          </div>

          <button
            className={`${styles.arrowBtn} ${styles.arrowNext}`}
            onClick={handleNext}
            aria-label="Следующий"
          >
            <ArrowRight className={styles.arrowIcon} />
          </button>
        </div>

        <div className={`${styles.thumbnails} ${styles.fadeIn}`}>
          {PRODUCTS.map((product, i) => (
            <button
              key={i}
              className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ""}`}
              onClick={() => {
                if (i !== activeIndex) animateTransition(i);
              }}
            >
              <img src={product.thumb} alt={product.name} />
            </button>
          ))}
        </div>

        <div className={`${styles.bottomRow} ${styles.fadeIn}`}>
          <p className={styles.productName}>{active.name}</p>
          <AnimatedButton href="#" onClick={(e) => { e.preventDefault(); setShowPriceModal(true); }}>
            Получить прайс-лист
          </AnimatedButton>
        </div>
      </section>

      <PriceListFormModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} />
    </div>
  );
}
