"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaVk } from "react-icons/fa";
import Copy from "./_shared/Copy";
import AnimatedButton from "./_shared/AnimatedButton";
import PriceListFormModal from "./PriceListFormModal";
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
  { label: "О нас", href: "/o-nas" },
  { label: "Контакты", href: "/kontakty" },
  { label: "Обучение бариста", href: "/obuchenie" },
  { label: "Сервис", href: "/b2b-servis" },
  { label: "Блог", href: "/blog" },
  { label: "Оптовые поставки", href: "/?auth=login" },
];

const SOCIALS = [
  { label: "ВКонтакте", href: "https://vk.com/10coffee", icon: FaVk },
];

export default function LandingFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const circleButtonRef = useRef<HTMLDivElement>(null);
  const circlePathRef = useRef<SVGPathElement>(null);

  // CTA button entrance
  useEffect(() => {
    const heading = sectionRef.current?.querySelector(`.${styles.heading}`);
    const buttonContainer = buttonContainerRef.current;
    if (!heading || !buttonContainer) return;

    gsap.set(buttonContainer, { autoAlpha: 0, y: 40 });

    const st = ScrollTrigger.create({
      trigger: heading,
      start: "top 50%",
      once: true,
      onEnter: () => {
        gsap.to(buttonContainer, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" });
      },
    });

    return () => st.kill();
  }, []);

  // Postcard hover
  useEffect(() => {
    const section = sectionRef.current;
    const button = buttonRef.current;
    if (!section || !button) return;

    const cards = gsap.utils.toArray(`.${styles.postcard}`) as HTMLElement[];
    const postcardsContainer = section.querySelector(`.${styles.postcards}`) as HTMLElement;
    if (!cards.length || !postcardsContainer) return;

    const tl = gsap.timeline({ paused: true });
    cards.forEach((card, i) => {
      const d = POSTCARDS[i];
      tl.fromTo(card,
        { yPercent: 250, xPercent: 0, rotation: 0 },
        { yPercent: 55, xPercent: parseFloat(d.x), rotation: d.rotation, duration: 0.8, ease: "power3.out" },
        i * 0.07,
      );
    });

    const enter = () => tl.play();
    const leave = () => tl.reverse();
    let active = false;

    const enable = () => { if (active) return; button.addEventListener("mouseenter", enter); button.addEventListener("mouseleave", leave); postcardsContainer.style.display = ""; active = true; };
    const disable = () => { if (!active) return; button.removeEventListener("mouseenter", enter); button.removeEventListener("mouseleave", leave); tl.pause(0); postcardsContainer.style.display = "none"; active = false; };
    const resize = () => { window.innerWidth < MOBILE_BREAKPOINT ? disable() : enable(); };

    resize();
    window.addEventListener("resize", resize);
    return () => { disable(); window.removeEventListener("resize", resize); };
  }, []);

  // Circle button scroll + hover
  useEffect(() => {
    const path = circlePathRef.current;
    const contactEl = document.getElementById("lets-connect");
    if (!path || !contactEl) return;

    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, rotation: -90, transformOrigin: "center center" });

    const st = ScrollTrigger.create({
      trigger: contactEl,
      start: "top 75%",
      once: true,
      onEnter: () => { gsap.to(path, { strokeDashoffset: 0, duration: 1.2, delay: 0.6, ease: "power2.inOut" }); },
    });

    return () => st.kill();
  }, []);

  useEffect(() => {
    const btn = circleButtonRef.current;
    const path = circlePathRef.current;
    if (!btn || !path) return;

    const len = path.getTotalLength();
    let tl: gsap.core.Timeline | null = null;

    const enter = () => {
      if (tl) tl.kill();
      tl = gsap.timeline();
      tl.set(path, { strokeDashoffset: 0, strokeDasharray: len, scale: 1 })
        .to(path, { strokeDashoffset: -len, duration: 0.75, ease: "power2.inOut" })
        .set(path, { strokeDashoffset: len })
        .to(path, { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" });
    };

    btn.addEventListener("mouseenter", enter);
    return () => { btn.removeEventListener("mouseenter", enter); if (tl) tl.kill(); };
  }, []);

  return (
    <footer className={styles.footer} ref={sectionRef}>
      {/* Contact */}
      <section className={styles.contactSection} id="lets-connect">
        <div className={styles.contactContainer}>
          <div className={styles.contactContent}>
            <Copy type="lines" animateOnScroll start="top 80%">
              <h6>Давайте знакомиться</h6>
            </Copy>
            <Copy type="lines" animateOnScroll start="top 80%">
              <h5>
                Мы всегда рады новым партнёрам. Расскажем о продукции, подберём
                оптимальное решение для вашего бизнеса.
              </h5>
            </Copy>
            <div className={styles.contactDetails}>
              <div>
                <Copy type="lines" animateOnScroll start="top 80%" delay={0.3}>
                  <p className="mono">10coffee@mail.ru</p>
                  <p className="mono">+7 (938) 453-70-60</p>
                  <p className="mono">+7 (918) 401-70-60</p>
                </Copy>
              </div>
              <div>
                <Copy type="lines" animateOnScroll start="top 80%" delay={0.3}>
                  <p className="mono">ПН--ПТ 09:00--18:00</p>
                  <p className="mono">СБ--ВС Выходные</p>
                </Copy>
              </div>
            </div>
          </div>
          <AnimatedButton href="mailto:10coffee@mail.ru">
            Написать нам
          </AnimatedButton>
        </div>
      </section>

      {/* Social */}
      <section className={styles.socialSection}>
        <div className={styles.socialContainer}>
          <Copy type="words" animateOnScroll>
            <h5 className={styles.socialHeading}>Мы в соцсетях</h5>
          </Copy>
          <div className={styles.socialLinks}>
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <span className={styles.socialIcon}><s.icon /></span>
                <span className={styles.socialLabel}>{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <div className={styles.heading}>
            <Copy type="lines" animateOnScroll>
              <h2>Начнём сотрудничество</h2>
            </Copy>
          </div>
          <div className={styles.buttonContainer} ref={buttonContainerRef} style={{ ["--btn-bg" as string]: "#ffffff", ["--btn-fg" as string]: "#1d1d1b" }}>
            <AnimatedButton href="#price-list-form" ref={buttonRef} onClick={(e) => {
              if (!document.getElementById("price-list-form")) {
                e.preventDefault();
                setShowPriceModal(true);
              }
            }}>
              Получить прайс-лист
            </AnimatedButton>
          </div>
        </div>
        <div className={styles.postcards}>
          {POSTCARDS.map((card, i) => (
            <div className={styles.postcard} key={i}>
              <img src={card.image} alt="10coffee" />
            </div>
          ))}
        </div>
      </section>

      {/* Bottom bar */}
      <div className={styles.bar}>
        <div className={styles.barLeft}>
          <Copy type="lines" animateOnScroll>
            <p className="sm">&copy;2026 10coffee. Все права защищены</p>
          </Copy>
        </div>
        <div className={styles.barLinks}>
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href}>{link.label}</a>
          ))}
          <a href="/Политика конфиденциальности.pdf" target="_blank" rel="noopener noreferrer">Конфиденциальность</a>
          <a href="/Политика обработки персональных данных пользователей сайта.pdf" target="_blank" rel="noopener noreferrer">Обработка данных</a>
        </div>
      </div>
      <PriceListFormModal isOpen={showPriceModal} onClose={() => setShowPriceModal(false)} />
    </footer>
  );
}
