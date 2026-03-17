"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import styles from "./LandingHeader.module.css";

interface LandingHeaderProps {
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  onOpenMap: () => void;
}

export default function LandingHeader({
  onToggleMenu,
  isMenuOpen,
  onOpenMap,
}: LandingHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${styles.navBar} ${hidden && !isMenuOpen ? styles.navHidden : ""}`}>
      <a href="/" className={styles.navLogo}>
        <img src="/Основной (упрощенный).svg" alt="10coffee" className={styles.navLogoImg} />
      </a>

      <div className={styles.navCenter}>
        <button type="button" className={styles.navLink} onClick={onOpenMap}>
          Где попробовать
        </button>
      </div>

      <div className={styles.navActions}>
        {user ? (
          <a href="/dashboard" className={styles.navAvatar}>
            {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
              user.email?.[0]?.toUpperCase() ||
              "U"}
          </a>
        ) : (
          <button
            type="button"
            className={styles.navPillBtn}
            onClick={() => router.push("/?auth=login")}
          >
            Личный кабинет
          </button>
        )}

        <button
          type="button"
          className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ""}`}
          onClick={onToggleMenu}
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
          <span className={styles.burgerLine} />
        </button>
      </div>
    </nav>
  );
}
