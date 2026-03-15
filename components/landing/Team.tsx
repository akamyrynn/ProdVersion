"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TEAM_MEMBERS } from "./data/team-data";
import styles from "./Team.module.css";

gsap.registerPlugin(ScrollTrigger);

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardsRef.current;
    if (!section || !cards) return;

    const cardElements = cards.querySelectorAll(`.${styles.card}`);

    gsap.set(cardElements, { autoAlpha: 0, y: 40 });

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top 60%",
      once: true,
      onEnter: () => {
        gsap.to(cardElements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.heading}>
        <h3>Команда</h3>
      </div>

      <div className={styles.grid} ref={cardsRef}>
        {TEAM_MEMBERS.map((member, index) => (
          <div className={styles.card} key={index}>
            <div className={styles.photoWrap}>
              <img src={member.image} alt={member.name} />
            </div>
            <p className={styles.memberName}>{member.name}</p>
            <p className={styles.memberRole}>{member.role}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className="sm">Наши специалисты</p>
        <p className="sm">Опыт и мастерство</p>
      </div>
    </section>
  );
}
