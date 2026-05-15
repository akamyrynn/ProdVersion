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
  { name: "Colombia Popayan", image: "/landing/assortment/webp/untitled-2.webp", thumb: "/landing/assortment/thumbs/untitled-2.png" },
  { name: "Ассортимент 2", image: "/landing/assortment/webp/untitled-3.webp", thumb: "/landing/assortment/thumbs/untitled-3.png" },
  { name: "Ассортимент 3", image: "/landing/assortment/webp/untitled-4.webp", thumb: "/landing/assortment/thumbs/untitled-4.png" },
  { name: "Ассортимент 4", image: "/landing/assortment/webp/untitled-5.webp", thumb: "/landing/assortment/thumbs/untitled-5.png" },
  { name: "Акация", image: "/landing/assortment/webp/acacia.webp", thumb: "/landing/assortment/thumbs/acacia.png" },
  { name: "Гондурас", image: "/landing/assortment/webp/honduras.webp", thumb: "/landing/assortment/thumbs/honduras.png" },
  { name: "Новый продукт ББ", image: "/landing/assortment/webp/np-bb.webp", thumb: "/landing/assortment/thumbs/np-bb.png" },
  { name: "Новый продукт", image: "/landing/assortment/webp/np-back.webp", thumb: "/landing/assortment/thumbs/np-back.png" },
  { name: "Иргачиф", image: "/landing/assortment/webp/np-irgacheffe.webp", thumb: "/landing/assortment/thumbs/np-irgacheffe.png" },
  { name: "Чичу", image: "/landing/assortment/webp/np-chichu.webp", thumb: "/landing/assortment/thumbs/np-chichu.png" },
];

export default function ProductImages() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const active = PRODUCTS[activeIndex];
  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === PRODUCTS.length - 1;

  const goToSlide = useCallback((newIndex: number) => {
    setActiveIndex((currentIndex) => {
      const nextIndex = Math.max(0, Math.min(PRODUCTS.length - 1, newIndex));
      return nextIndex === currentIndex ? currentIndex : nextIndex;
    });
  }, []);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    gsap.killTweensOf(img);
    gsap.fromTo(
      img,
      { autoAlpha: 0, scale: 0.97 },
      { autoAlpha: 1, scale: 1, duration: 0.28, ease: "power2.out" }
    );
  }, [activeIndex]);

  useEffect(() => {
    PRODUCTS.forEach((product) => {
      const img = new Image();
      img.src = product.image;
    });
  }, []);

  const handlePrev = () => {
    if (isFirstSlide) return;
    goToSlide(activeIndex - 1);
  };

  const handleNext = () => {
    if (isLastSlide) return;
    goToSlide(activeIndex + 1);
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
            type="button"
          >
            <ArrowLeft className={styles.arrowIcon} />
          </button>

          <div className={styles.mainImage}>
            <img
              key={active.image}
              ref={imageRef}
              src={active.image}
              alt={active.name}
              decoding="async"
            />
          </div>

          <button
            className={`${styles.arrowBtn} ${isLastSlide ? styles.arrowDisabled : ""}`}
            onClick={handleNext}
            aria-label="Следующий"
            disabled={isLastSlide}
            type="button"
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
                goToSlide(i);
              }}
              type="button"
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
