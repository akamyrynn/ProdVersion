export interface ProductCategory {
  id: string;
  label: string;
  items: ProductItem[];
}

export interface ProductItem {
  name: string;
  description: string;
  image: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "coffee",
    label: "Кофе",
    items: [
      {
        name: "Эспрессо-бленды",
        description: "Авторские смеси для идеального эспрессо",
        image: "/media/Мокап б.п Бленд1-600x400.png",
      },
      {
        name: "Моносорта",
        description: "Кофе одного происхождения для ценителей",
        image: "/media/Мокап б.п Колумбия-600x400.png",
      },
      {
        name: "Эфиопия",
        description: "Яркие цветочно-фруктовые профили",
        image: "/media/Мокап б.п Иргачиф с клапаном-600x400.png",
      },
      {
        name: "Дрип-пакеты",
        description: "Удобный формат для ваших гостей",
        image: "/media/Мокап б.п TUCAN-600x400.png",
      },
    ],
  },
  {
    id: "tea",
    label: "Чай",
    items: [
      {
        name: "Чёрный чай",
        description: "Классические и авторские купажи",
        image: "/media/Ассам OPA пнг пачка-600x400.png",
      },
      {
        name: "Зелёный чай",
        description: "Японские и китайские сорта",
        image: "/media/Сенча пнг пачка-600x400.png",
      },
      {
        name: "Улун",
        description: "Полуферментированные чаи высшего качества",
        image: "/media/Улун пнг пачка-600x400.png",
      },
      {
        name: "Те Гуань Инь",
        description: "Классика китайской чайной традиции",
        image: "/media/ТГ инь пнг пачка-600x400.png",
      },
    ],
  },
  {
    id: "coldbrew",
    label: "Cold Brew",
    items: [
      {
        name: "Cold Brew 18.1",
        description: "Готовый холодный кофе в бутылке",
        image: "/media/18.1 Кол Оз-600x400.jpg",
      },
    ],
  },
];
