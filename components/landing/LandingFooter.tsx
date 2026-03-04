"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import styles from "./LandingFooter.module.css";

gsap.registerPlugin(ScrollTrigger);

const MOBILE_BREAKPOINT = 1000;

const POSTCARDS = [
  { image: "/landing/footer/footer-1.jpg", rotation: -8, x: "-25%" },
  { image: "/landing/footer/footer-2.jpg", rotation: 6, x: "20%" },
  { image: "/landing/footer/footer-3.jpg", rotation: -4, x: "-15%" },
  { image: "/landing/footer/footer-4.jpg", rotation: 10, x: "25%" },
  { image: "/landing/footer/footer-5.jpg", rotation: -12, x: "-10%" },
];

const FOOTER_LINKS = [
  { label: "Кофе для бизнеса", href: "#" },
  { label: "Обучение бариста", href: "https://www.10coffee.ru/obuchenie" },
  { label: "Сервис", href: "#" },
  { label: "Блог", href: "#" },
];

export default function LandingFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heading = sectionRef.current?.querySelector(`.${styles.heading}`);
    const buttonContainer = buttonContainerRef.current;
    if (!heading || !buttonContainer) return;

    gsap.set(buttonContainer, { autoAlpha: 0, y: 40 });

    const scrollTrigger = ScrollTrigger.create({
      trigger: heading,
      start: "top 50%",
      once: true,
      onEnter: () => {
        gsap.to(buttonContainer, {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out",
        });
      },
    });

    return () => scrollTrigger.kill();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const button = buttonRef.current;
    if (!section || !button) return;

    const cards = gsap.utils.toArray(`.${styles.postcard}`) as HTMLElement[];
    const postcardsContainer = section.querySelector(`.${styles.postcards}`) as HTMLElement;
    if (!cards.length || !postcardsContainer) return;

    const postcardTimeline = gsap.timeline({ paused: true });

    cards.forEach((card, index) => {
      const cardData = POSTCARDS[index];
      postcardTimeline.fromTo(
        card,
        { yPercent: 250, xPercent: 0, rotation: 0 },
        {
          yPercent: 55,
          xPercent: parseFloat(cardData.x),
          rotation: cardData.rotation,
          duration: 0.8,
          ease: "power3.out",
        },
        index * 0.07,
      );
    });

    const handleMouseEnter = () => postcardTimeline.play();
    const handleMouseLeave = () => postcardTimeline.reverse();

    let isHoverActive = false;

    const enableHover = () => {
      if (isHoverActive) return;
      button.addEventListener("mouseenter", handleMouseEnter);
      button.addEventListener("mouseleave", handleMouseLeave);
      postcardsContainer.style.display = "";
      isHoverActive = true;
    };

    const disableHover = () => {
      if (!isHoverActive) return;
      button.removeEventListener("mouseenter", handleMouseEnter);
      button.removeEventListener("mouseleave", handleMouseLeave);
      postcardTimeline.pause(0);
      postcardsContainer.style.display = "none";
      isHoverActive = false;
    };

    const handleResize = () => {
      window.innerWidth < MOBILE_BREAKPOINT ? disableHover() : enableHover();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      disableHover();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <footer className={styles.footer} ref={sectionRef}>
      <div className={styles.content}>
        <div className={styles.heading}>
          <Copy type="lines" animateOnScroll>
            <h2>Начнём сотрудничество</h2>
          </Copy>
        </div>

        <div className={styles.buttonContainer} ref={buttonContainerRef} style={{ ["--btn-bg" as string]: "#ffffff", ["--btn-fg" as string]: "#1d1d1b" }}>
          <AnimatedButton href="#price-list-form" ref={buttonRef}>
            Получить прайс-лист
          </AnimatedButton>
        </div>
      </div>

      <div className={styles.postcards}>
        {POSTCARDS.map((card, index) => (
          <div className={styles.postcard} key={index}>
            <img src={card.image} alt="10coffee" />
          </div>
        ))}
      </div>

      <div className={styles.bar}>
        <div className={styles.barLeft}>
          <Copy type="lines" animateOnScroll>
            <p className="sm">&copy;2026 10coffee. Все права защищены</p>
          </Copy>
        </div>
        <div className={styles.barLinks}>
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
