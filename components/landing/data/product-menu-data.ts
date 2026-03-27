export interface ProductMenuItem {
  name: string;
  weight?: string;
  price: string;
  description?: string;
}

export interface ProductMenuGroup {
  title: string;
  items: ProductMenuItem[];
}

export interface ProductMenuCategory {
  category: string;
  image: string;
  items?: ProductMenuItem[];
  groups?: ProductMenuGroup[];
}

export const productMenu: ProductMenuCategory[] = [
  {
    category: "Моносорта",
    image: "/media/Мокап б.п Колумбия-600x400.png",
    items: [
      {
        name: "Бразилия Серрадо",
        weight: "250 г / 1 кг",
        price: "от ₽680",
        description: "Шоколад, орех, карамель. Средняя обжарка, плотное тело",
      },
      {
        name: "Колумбия Супремо",
        weight: "250 г / 1 кг",
        price: "от ₽750",
        description: "Цитрус, красное яблоко, мёд. Сбалансированная кислотность",
      },
      {
        name: "Эфиопия Иргачиф",
        weight: "250 г / 1 кг",
        price: "от ₽820",
        description: "Жасмин, бергамот, персик. Светлая обжарка, яркий букет",
      },
      {
        name: "Эфиопия Джимма",
        weight: "250 г / 1 кг",
        price: "от ₽790",
        description: "Какао, специи, тёмные ягоды. Насыщенный, глубокий вкус",
      },
      {
        name: "Уганда Бугису",
        weight: "250 г / 1 кг",
        price: "от ₽720",
        description: "Табак, чернослив, горький шоколад. Тёмная обжарка",
      },
    ],
  },
  {
    category: "Бленды",
    image: "/media/Мокап б.п Бленд1-600x400.png",
    items: [
      {
        name: "Бленд №1",
        weight: "250 г / 1 кг",
        price: "от ₽620",
        description: "Классический эспрессо-бленд. Шоколад, орех, сливки",
      },
      {
        name: "Свитер",
        weight: "250 г / 1 кг",
        price: "от ₽650",
        description: "Молочный шоколад, ваниль, сладость. Для молочных напитков",
      },
      {
        name: "Эмигрант",
        weight: "250 г / 1 кг",
        price: "от ₽600",
        description: "Крепкий, насыщенный. Тёмный шоколад, жжёный сахар",
      },
      {
        name: "TUCAN",
        weight: "250 г / 1 кг",
        price: "от ₽700",
        description: "Тропические фрукты, карамель. Яркий, фруктовый профиль",
      },
      {
        name: "Ликемпти",
        weight: "250 г / 1 кг",
        price: "от ₽780",
        description: "Черника, цветы, цедра. Комплексный, элегантный бленд",
      },
    ],
  },
  {
    category: "Чай",
    image: "/media/Ассам OPA пнг пачка-600x400.png",
    groups: [
      {
        title: "Чёрный чай",
        items: [
          { name: "Ассам OPA", price: "от ₽450", weight: "100 г" },
          { name: "Те Гуань Инь", price: "от ₽580", weight: "100 г" },
        ],
      },
      {
        title: "Зелёный чай",
        items: [
          { name: "Сенча", price: "от ₽520", weight: "100 г" },
          { name: "Улун", price: "от ₽560", weight: "100 г" },
        ],
      },
    ],
  },
  {
    category: "Cold Brew",
    image: "/media/18.1 Кол Оз-600x400.jpg",
    items: [
      {
        name: "Cold Brew 18.1",
        weight: "330 мл",
        price: "от ₽180",
        description: "Готовый холодный кофе. Шоколад, орех, мягкая сладость",
      },
      {
        name: "Cold Brew Цитрус",
        weight: "330 мл",
        price: "от ₽200",
        description: "С нотами апельсина и грейпфрута. Освежающий, яркий",
      },
      {
        name: "Cold Brew Карамель",
        weight: "330 мл",
        price: "от ₽200",
        description: "Карамель, ваниль, сливки. Десертный, нежный профиль",
      },
    ],
  },
];
