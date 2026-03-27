import type { CollectionConfig } from "payload"

export const PriceListRequests: CollectionConfig = {
  slug: "price-list-requests",
  admin: {
    useAsTitle: "name",
    group: "Маркетинг",
    description: "Заявки на прайс-лист с лендинга",
    defaultColumns: ["name", "email", "phone", "company", "createdAt"],
  },
  labels: {
    singular: "Заявка на прайс-лист",
    plural: "Получатели прайс-листа",
  },
  access: {
    create: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Имя",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      label: "Телефон",
      required: true,
    },
    {
      name: "company",
      type: "text",
      label: "Компания",
    },
    {
      name: "emailSent",
      type: "checkbox",
      label: "Письмо отправлено",
      defaultValue: false,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
