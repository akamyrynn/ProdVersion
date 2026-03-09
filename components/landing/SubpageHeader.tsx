"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import styles from "./SubpageHeader.module.css";

const NAV_LINKS = [
  { label: "Блог", href: "/blog" },
  { label: "Обучение", href: "/obuchenie" },
  { label: "Сервис", href: "/b2b-servis" },
];

export default function SubpageHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <a href="/" className={styles.logo}>
        <img src="/logo.svg" alt="10coffee" className={styles.logoImg} />
      </a>

      <div className={styles.links}>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`${styles.link} ${pathname.startsWith(link.href) ? styles.linkActive : ""}`}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className={styles.actions}>
        {user ? (
          <a href="/dashboard" className={styles.avatar}>
            {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </a>
        ) : (
          <button
            type="button"
            className={styles.pillBtn}
            onClick={() => router.push("/?auth=login")}
          >
            Личный кабинет
          </button>
        )}
      </div>
    </nav>
  );
}
