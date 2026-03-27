export interface Advantage {
  title: string;
  description: string;
  image: string;
}

export const ADVANTAGES: Advantage[] = [
  {
    title: "Авторские бленды",
    description:
      "Создаём уникальные смеси под ваше заведение. Профиль вкуса, обжарка и помол — всё подбирается индивидуально.",
    image: "/landing/advantages/blends.jpg",
  },
  {
    title: "Обучение бариста",
    description:
      "Проводим тренинги и мастер-классы для вашей команды. От базовых навыков до продвинутого латте-арта.",
    image: "/landing/advantages/training.jpg",
  },
  {
    title: "Сервис оборудования",
    description:
      "Обслуживаем и ремонтируем кофемашины всех брендов. Выезд мастера в течение 24 часов.",
    image: "/landing/advantages/service.jpg",
  },
  {
    title: "Быстрая доставка",
    description:
      "Доставляем по всей России через СДЭК и собственную логистику. Заказы от 48 часов.",
    image: "/landing/advantages/delivery.jpg",
  },
  {
    title: "Контроль качества",
    description:
      "Каждая партия проходит Q-грейд оценку. Работаем только с проверенными фермами и обжарщиками.",
    image: "/landing/advantages/quality.jpg",
  },
  {
    title: "Индивидуальный подход",
    description:
      "Персональный менеджер, гибкие условия оплаты и программа лояльности для постоянных партнёров.",
    image: "/landing/advantages/approach.jpg",
  },
];
