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
    image: "/landing/advantages/author-blends.svg",
  },
  {
    title: "Обучение бариста",
    description:
      "Проводим тренинги и мастер-классы для вашей команды. От базовых навыков до продвинутого латте-арта.",
    image: "/landing/advantages/barista-training.svg",
  },
  {
    title: "Сервис оборудования",
    description:
      "Обслуживаем и ремонтируем кофемашины всех брендов. Выезд мастера в течение 24 часов.",
    image: "/landing/advantages/equipment-service.svg",
  },
  {
    title: "Быстрая доставка",
    description:
      "Доставляем по всей России через СДЭК и собственную логистику. Заказы от 48 часов.",
    image: "/landing/advantages/delivery.svg",
  },
  {
    title: "Контроль качества",
    description:
      "Каждая партия проходит Q-грейд оценку. Работаем только с проверенными фермами и обжарщиками.",
    image: "/landing/advantages/quality-control.svg",
  },
  {
    title: "Индивидуальный подход",
    description:
      "Персональный менеджер, гибкие условия оплаты и программа лояльности для постоянных партнёров.",
    image: "/landing/advantages/individual-approach.svg",
  },
];
