"use client";

import { ExternalLink, ShoppingBag, Store, Truck, MessageCircle } from "lucide-react";
import Copy from "./_shared/Copy";
import styles from "./WhereToBuy.module.css";

const MARKETPLACES = [
  {
    name: "Ozon",
    text: "Кофе в зернах, чай и товары для ежедневных заказов",
    href: "https://www.ozon.ru/category/kofe-v-zernah-31009/10coffee-100159106/",
    icon: ShoppingBag,
    tone: "orange",
  },
  {
    name: "Яндекс Маркет",
    text: "Быстрый поиск 10coffee на маркетплейсе",
    href: "https://market.yandex.ru/search?text=10coffee",
    icon: Store,
    tone: "yellow",
  },
  {
    name: "Wildberries",
    text: "Площадка для розничной покупки и доставки",
    href: "https://www.wildberries.ru/catalog/0/search.aspx?search=10coffee",
    icon: Truck,
    tone: "purple",
  },
  {
    name: "Менеджер 10coffee",
    text: "Для оптовых заявок, консультаций и подбора ассортимента",
    href: "https://t.me/Tencoffeesochi",
    icon: MessageCircle,
    tone: "dark",
  },
] as const;

export default function WhereToBuy() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Copy type="lines" animateOnScroll>
            <p className="mono">Где купить</p>
          </Copy>
          <Copy type="lines" animateOnScroll>
            <h3>10coffee на популярных площадках</h3>
          </Copy>
        </div>

        <div className={styles.grid}>
          {MARKETPLACES.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.card}
                data-tone={item.tone}
              >
                <span className={styles.iconWrap}>
                  <Icon className={styles.icon} />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{item.name}</span>
                  <span className={styles.cardText}>{item.text}</span>
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  <ExternalLink className={styles.arrowIcon} />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
