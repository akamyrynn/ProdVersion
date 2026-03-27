import type { CollectionConfig } from "payload"
import { notifyProductRestock } from "../hooks/productRestock"

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    group: "Каталог",
    description: "Товары: кофе, чай, аксессуары",
    defaultColumns: ["name", "productType", "category", "isVisible", "stickers"],
  },
  labels: {
    singular: "Товар",
    plural: "Товары",
  },
  fields: [
    // === ОСНОВНОЕ ===
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
      name: "category",
      type: "relationship",
      label: "Категория",
      relationTo: "categories",
      required: true,
    },
    {
      name: "description",
      type: "richText",
      label: "Описание",
    },
    {
      name: "images",
      type: "array",
      label: "Фото галерея",
      fields: [
        {
          name: "image",
          type: "upload",
          label: "Изображение",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "videoUrls",
      type: "array",
      label: "Видео",
      fields: [
        {
          name: "url",
          type: "text",
          label: "URL видео",
        },
      ],
    },

    // === ТЕГИ ===
    {
      name: "stickers",
      type: "relationship",
      label: "Теги",
      relationTo: "tags",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Выберите теги из списка или создайте новые в разделе «Теги»",
      },
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
      label: "Видим в каталоге",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },

    // === ВАРИАНТЫ ФАСОВКИ ===
    {
      name: "variants",
      type: "array",
      label: "Варианты фасовки",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "name",
          type: "text",
          label: "Название (напр. 250 г, 1 кг)",
          required: true,
        },
        {
          name: "sku",
          type: "text",
          label: "Артикул (SKU)",
        },
        {
          name: "price",
          type: "number",
          label: "Цена (руб)",
          required: true,
          min: 0,
        },
        {
          name: "weightGrams",
          type: "number",
          label: "Вес (грамм)",
        },
        {
          name: "isAvailable",
          type: "checkbox",
          label: "В наличии",
          defaultValue: true,
        },
        {
          name: "grindOptions",
          type: "select",
          label: "Опции помола",
          hasMany: true,
          options: [
            { label: "В зёрнах", value: "beans" },
            { label: "Молотый", value: "ground" },
          ],
        },
      ],
    },

    // === ХАРАКТЕРИСТИКИ КОФЕ ===
    {
      name: "coffeeDetails",
      type: "group",
      label: "Характеристики кофе",
      admin: {
        condition: (data) => data?.productType === "coffee",
      },
      fields: [
        {
          name: "roaster",
          type: "text",
          label: "Обжарщик",
        },
        {
          name: "roastLevel",
          type: "text",
          label: "Уровень обжарки",
        },
        {
          name: "region",
          type: "text",
          label: "Регион произрастания",
        },
        {
          name: "processingMethod",
          type: "text",
          label: "Способ обработки",
        },
        {
          name: "growingHeight",
          type: "text",
          label: "Высота произрастания",
          admin: {
            description: "Например: 1200-1500 м",
          },
        },
        {
          name: "qGraderRating",
          type: "number",
          label: "Q-грейд рейтинг",
          min: 0,
          max: 100,
        },
        {
          name: "brewingMethods",
          type: "array",
          label: "Методы заваривания",
          fields: [
            {
              name: "method",
              type: "text",
              label: "Метод",
              required: true,
            },
            {
              name: "description",
              type: "textarea",
              label: "Описание",
            },
            {
              name: "image",
              type: "upload",
              label: "Изображение",
              relationTo: "media",
            },
          ],
        },
      ],
    },

    // === ХАРАКТЕРИСТИКИ ЧАЯ ===
    {
      name: "teaDetails",
      type: "group",
      label: "Характеристики чая",
      admin: {
        condition: (data) => data?.productType === "tea",
      },
      fields: [
        {
          name: "brewingInstructions",
          type: "array",
          label: "Как заваривать",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Заголовок",
              required: true,
            },
            {
              name: "text",
              type: "textarea",
              label: "Описание",
              required: true,
            },
            {
              name: "image",
              type: "upload",
              label: "Изображение",
              relationTo: "media",
            },
          ],
        },
      ],
    },

    // === ПРИКРЕПЛЁННЫЕ ФАЙЛЫ ===
    {
      name: "attachedFiles",
      type: "array",
      label: "Прикреплённые файлы",
      fields: [
        {
          name: "file",
          type: "upload",
          label: "Файл",
          relationTo: "media",
          required: true,
        },
        {
          name: "label",
          type: "text",
          label: "Подпись",
        },
      ],
    },
  ],
  hooks: {
    afterChange: [notifyProductRestock],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
