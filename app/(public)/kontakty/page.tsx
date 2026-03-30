import SiteHeader from "@/components/landing/SiteHeader"
import LandingFooter from "@/components/landing/LandingFooter"
import styles from "./kontakty.module.css"

export const metadata = {
  title: "Контакты | 10кофе",
  description: "Адрес, телефоны и часы работы компании 10кофе. Сочи, ул. Пластунская 79/1.",
}

export default function KontaktyPage() {
  return (
    <>
      <SiteHeader />
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Связаться с нами</p>
          <h1 className={styles.heroTitle}>Контакты</h1>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.inner}>
          {/* Left: info */}
          <div className={styles.infoGroup}>
            <div className={styles.infoBlock}>
              <p className={styles.infoLabel}>Адрес</p>
              <p className={styles.infoItem}>
                г. Сочи, ул. Пластунская 79/1, пом. 1
              </p>
            </div>

            <div className={styles.infoBlock}>
              <p className={styles.infoLabel}>График работы</p>
              <p className={styles.infoItem}>
                Пн–Пт: 9:00 – 18:00<br />
                Сб–Вс: Выходные
              </p>
            </div>

            <div className={styles.infoBlock}>
              <p className={styles.infoLabel}>Телефоны</p>
              <p className={styles.infoItem}>
                <a href="tel:+79384537060">+7 (938) 453-70-60</a><br />
                <a href="tel:+79184017060">+7 (918) 401-70-60</a>
              </p>
              <p className={styles.messengerNote}>
                Звонки, WhatsApp, Telegram — поможем с выбором!
              </p>
            </div>

            <div className={styles.infoBlock}>
              <p className={styles.infoLabel}>Почта</p>
              <p className={styles.infoItem}>
                <a href="mailto:10coffee@mail.ru">10coffee@mail.ru</a>
              </p>
            </div>
          </div>

          {/* Right: map */}
          <div className={styles.mapBlock}>
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=39.735351%2C43.603466&z=17&pt=39.735351,43.603466,pm2rdm"
              title="10кофе на карте"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <LandingFooter />
    </>
  )
}
