import type { CollectionConfig } from "payload"

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
    group: "Каталог",
    description: "Категории товаров",
    defaultColumns: ["name", "productType", "parent", "sortOrder", "isVisible"],
  },
  labels: {
    singular: "Категория",
    plural: "Категории",
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Название",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      label: "Slug (URL)",
      required: true,
      unique: true,
      admin: {
        description: "URL-имя категории (латиница, дефисы)",
      },
    },
    {
      name: "productType",
      type: "select",
      label: "Тип товара",
      required: true,
      options: [
        { label: "Кофе", value: "coffee" },
        { label: "Чай", value: "tea" },
        { label: "Аксессуар", value: "accessory" },
      ],
    },
    {
      name: "image",
      type: "upload",
      label: "Изображение категории",
      relationTo: "media",
      admin: {
        description: "Фото для отображения в каталоге",
      },
    },
    {
      name: "parent",
      type: "relationship",
      label: "Родительская категория",
      relationTo: "categories",
      admin: {
        description: "Оставьте пустым для корневой категории",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Описание",
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Порядок сортировки",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isVisible",
      type: "checkbox",
      label: "Видима в каталоге",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
