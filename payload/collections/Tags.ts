import type { CollectionConfig } from "payload"

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    group: "Каталог",
    description: "Теги товаров — создавайте и применяйте к товарам",
    defaultColumns: ["name", "slug", "color"],
  },
  labels: {
    singular: "Тег",
    plural: "Теги",
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Название тега",
      required: true,
      admin: {
        description: "Например: Новинка, Хит продаж, Скидка месяца",
      },
    },
    {
      name: "slug",
      type: "text",
      label: "Идентификатор (slug)",
      required: true,
      unique: true,
      admin: {
        description: "Только латиница, цифры, дефис. Например: new, popular, sale",
      },
    },
    {
      name: "color",
      type: "select",
      label: "Цвет",
      defaultValue: "orange",
      options: [
        { label: "Оранжевый", value: "orange" },
        { label: "Фиолетовый", value: "purple" },
        { label: "Зелёный", value: "green" },
        { label: "Красный", value: "red" },
        { label: "Синий", value: "blue" },
        { label: "Жёлтый", value: "yellow" },
        { label: "Розовый", value: "pink" },
        { label: "Серый", value: "gray" },
      ],
      admin: {
        position: "sidebar",
      },
    },
  ],
}
