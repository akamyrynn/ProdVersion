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
  { name: "Colombia Popayan", image: "/landing/assortment/untitled-2.png", thumb: "/landing/assortment/thumbs/untitled-2.png" },
  { name: "Ассортимент 2", image: "/landing/assortment/untitled-3.png", thumb: "/landing/assortment/thumbs/untitled-3.png" },
  { name: "Ассортимент 3", image: "/landing/assortment/untitled-4.png", thumb: "/landing/assortment/thumbs/untitled-4.png" },
  { name: "Ассортимент 4", image: "/landing/assortment/untitled-5.png", thumb: "/landing/assortment/thumbs/untitled-5.png" },
  { name: "Акация", image: "/landing/assortment/acacia.png", thumb: "/landing/assortment/thumbs/acacia.png" },
  { name: "Гондурас", image: "/landing/assortment/honduras.png", thumb: "/landing/assortment/thumbs/honduras.png" },
  { name: "Новый продукт ББ", image: "/landing/assortment/np-bb.png", thumb: "/landing/assortment/thumbs/np-bb.png" },
  { name: "Новый продукт", image: "/landing/assortment/np-back.png", thumb: "/landing/assortment/thumbs/np-back.png" },
  { name: "Иргачиф", image: "/landing/assortment/np-irgacheffe.png", thumb: "/landing/assortment/thumbs/np-irgacheffe.png" },
  { name: "Чичу", image: "/landing/assortment/np-chichu.png", thumb: "/landing/assortment/thumbs/np-chichu.png" },
];

export default function ProductImages() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const active = PRODUCTS[activeIndex];
  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === PRODUCTS.length - 1;

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
    if (isFirstSlide) return;
    animateTransition(activeIndex - 1);
  };

  const handleNext = () => {
    if (isLastSlide) return;
    animateTransition(activeIndex + 1);
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
            className={`${styles.arrowBtn} ${isFirstSlide ? styles.arrowDisabled : ""}`}
            onClick={handlePrev}
            aria-label="Предыдущий"
            disabled={isFirstSlide}
          >
            <ArrowLeft className={styles.arrowIcon} />
          </button>

          <div className={styles.mainImage}>
            <img ref={imageRef} src={active.image} alt={active.name} />
          </div>

          <button
            className={`${styles.arrowBtn} ${isLastSlide ? styles.arrowDisabled : ""}`}
            onClick={handleNext}
            aria-label="Следующий"
            disabled={isLastSlide}
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
          <AnimatedButton href="#" onClick={(e) => { e.preventDefault(); setShowPriceModal(true); }}>
            Получить прайс-лист
          </AnimatedButton>
        </div>
      </section>

      <PriceListFormModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} />
    </div>
  );
}
