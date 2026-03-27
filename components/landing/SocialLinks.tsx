"use client";

import { FaTelegram, FaInstagram, FaVk } from "react-icons/fa";
import Copy from "./_shared/Copy";
import styles from "./SocialLinks.module.css";

const SOCIALS = [
  { label: "Telegram", href: "https://t.me/local10coffee", icon: FaTelegram },
  { label: "Instagram", href: "https://www.instagram.com/10coffee.ru?igsh=NmMzbDN2OW5xaXVp", icon: FaInstagram },
  { label: "ВКонтакте", href: "https://vk.com/10coffee", icon: FaVk },
];

export default function SocialLinks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Copy type="words" animateOnScroll>
          <h5 className={styles.heading}>Мы в соцсетях</h5>
        </Copy>
        <div className={styles.links}>
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <span className={styles.iconWrap}>
                <social.icon />
              </span>
              <span className={styles.label}>{social.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
