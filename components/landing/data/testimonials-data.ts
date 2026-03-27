export interface Testimonial {
  name: string;
  role: string;
  company: string;
  text: string;
  image: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Алексей Петров",
    role: "Владелец",
    company: "Кофейня «Март»",
    text: "С 10coffee мы забыли о проблемах с поставками. Качество стабильное, а персональный менеджер всегда на связи.",
    image: "/landing/testimonials/person-1.jpg",
  },
  {
    name: "Мария Соколова",
    role: "Шеф-бариста",
    company: "Сеть «Brew Bar»",
    text: "Эспрессо-бленды от 10coffee — лучшее, что мы пробовали за последние годы. Гости возвращаются именно за вкусом.",
    image: "/landing/testimonials/person-2.jpg",
  },
  {
    name: "Дмитрий Волков",
    role: "Управляющий",
    company: "Ресторан «Терраса»",
    text: "Удобный личный кабинет, быстрая доставка и честные оптовые цены. Работаем уже третий год без нареканий.",
    image: "/landing/testimonials/person-3.jpg",
  },
  {
    name: "Анна Кузнецова",
    role: "Закупщик",
    company: "Отель «Гранд Палас»",
    text: "Широкий ассортимент чая поразил. Нашли всё — от классических купажей до редких улунов для VIP-гостей.",
    image: "/landing/testimonials/person-4.jpg",
  },
  {
    name: "Игорь Семёнов",
    role: "Основатель",
    company: "Обжарщики «Восход»",
    text: "Обучение бариста от 10coffee подняло уровень нашей команды. Теперь каждая чашка — произведение искусства.",
    image: "/landing/testimonials/person-5.jpg",
  },
];
