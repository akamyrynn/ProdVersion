import type { CollectionConfig } from "payload"

export const MapLocations: CollectionConfig = {
  slug: "map-locations",
  admin: {
    useAsTitle: "name",
    group: "Контент",
    description: "Точки на карте — кофейни где можно попробовать наш кофе",
    defaultColumns: ["name", "address", "isActive"],
  },
  labels: {
    singular: "Точка на карте",
    plural: "Точки на карте",
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Название",
      required: true,
    },
    {
      name: "address",
      type: "text",
      label: "Адрес",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
      admin: {
        description: "Например: +7 (910) 145-72-78",
      },
    },
    {
      name: "yandexMapsUrl",
      type: "text",
      label: "Ссылка на Яндекс.Карты",
      required: true,
      admin: {
        description:
          "Скопируйте ссылку из Яндекс.Карт, например: https://yandex.com/maps/-/CPulnF33",
      },
    },
    {
      name: "latitude",
      type: "number",
      label: "Широта",
      required: true,
      admin: {
        step: 0.000001,
        description: "Для пина на карте. Например: 43.585472",
      },
    },
    {
      name: "longitude",
      type: "number",
      label: "Долгота",
      required: true,
      admin: {
        step: 0.000001,
        description: "Для пина на карте. Например: 39.723098",
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      label: "Активна",
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
    delete: ({ req }) => !!req.user,
  },
}
