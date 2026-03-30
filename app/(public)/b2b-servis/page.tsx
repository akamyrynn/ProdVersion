import SiteHeader from "@/components/landing/SiteHeader"
import LandingFooter from "@/components/landing/LandingFooter"
import ServiceForm from "@/components/landing/ServiceForm"
import styles from "./service.module.css"

export const metadata = {
  title: "Сервисное обслуживание кофейного оборудования | 10coffee",
  description:
    "Сервисное обслуживание и ремонт кофейного оборудования любой сложности. Быстрая диагностика, монтаж, ремонт.",
}

const SERVICES = [
  {
    title: "Диагностика",
    description:
      "Быстрая диагностика неполадок с использованием профессионального оборудования",
  },
  {
    title: "Плановое ТО",
    description:
      "Регулярное техническое обслуживание для долгой и стабильной работы оборудования",
  },
  {
    title: "Ремонт",
    description:
      "Устранение неисправностей кофемашин, кофемолок и другого оборудования любой сложности",
  },
  {
    title: "Монтаж",
    description:
      "Профессиональная установка и настройка нового кофейного оборудования",
  },
  {
    title: "Запчасти",
    description:
      "Оригинальные запчасти и расходные материалы для всех популярных моделей кофемашин",
  },
  {
    title: "Консультация",
    description:
      "Подбор оптимального оборудования и рекомендации по эксплуатации",
  },
]

const ADVANTAGES = [
  {
    value: "24ч",
    label: "Среднее время реакции на заявку",
  },
  {
    value: "500+",
    label: "Обслуженных машин",
  },
  {
    value: "12 мес",
    label: "Гарантия на работы",
  },
]

export default function ServicePage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>B2B сервис</p>
          <h1 className={styles.heroTitle}>
            Сервисное обслуживание
            <br />и ремонт
          </h1>
          <p className={styles.heroSubtitle}>
            Одним из направлений нашей компании является сервисное обслуживание и
            ремонт кофейного оборудования. Наши специалисты имеют богатый опыт
            монтажа и ремонта кофейного оборудования разной сложности. Благодаря
            этому мы в короткие сроки сможем диагностировать и устранить
            неполадку, не нарушая процесс работы вашего заведения.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {ADVANTAGES.map((a) => (
            <div key={a.label} className={styles.stat}>
              <span className={styles.statValue}>{a.value}</span>
              <span className={styles.statLabel}>{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services grid */}
      <section className={styles.services}>
        <h2 className={styles.sectionTitle}>Наши услуги</h2>
        <p className={styles.sectionSubtitle}>
          Благодаря опыту мы в короткие сроки сможем диагностировать и устранить
          неполадку, не нарушая процесс работы вашего заведения
        </p>
        <div className={styles.grid}>
          {SERVICES.map((s) => (
            <div key={s.title} className={styles.serviceCard}>
              <h3 className={styles.serviceTitle}>{s.title}</h3>
              <p className={styles.serviceDesc}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className={styles.contact}>
        <div className={styles.contactInner}>
          <div className={styles.contactText}>
            <h2 className={styles.contactTitle}>Требуется ремонт?</h2>
            <p className={styles.contactDesc}>
              Оставьте свои контакты и мы свяжемся с вами для уточнения деталей
            </p>
          </div>
          <ServiceForm
            className={styles.contactForm}
            inputClassName={styles.contactInput}
            buttonClassName={styles.contactButton}
            disclaimerClassName={styles.contactDisclaimer}
          />
        </div>
      </section>

      <LandingFooter />
    </>
  )
}
