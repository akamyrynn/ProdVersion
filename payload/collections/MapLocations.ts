import type { CollectionConfig } from "payload"

export const MapLocations: CollectionConfig = {
  slug: "map-locations",
  admin: {
    useAsTitle: "name",
    group: "Контент",
    description: "Точки на карте — вставьте ссылку на Яндекс.Карты",
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
