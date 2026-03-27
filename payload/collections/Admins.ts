import type { CollectionConfig } from "payload"

export const Admins: CollectionConfig = {
  slug: "admins",
  auth: true,
  admin: {
    useAsTitle: "fullName",
    group: "Администрирование",
    description: "Администраторы и менеджеры платформы",
  },
  labels: {
    singular: "Администратор",
    plural: "Администраторы",
  },
  fields: [
    {
      name: "fullName",
      type: "text",
      label: "ФИО",
      required: true,
    },
    {
      name: "role",
      type: "select",
      label: "Роль",
      required: true,
      defaultValue: "manager",
      options: [
        { label: "Администратор", value: "admin" },
        { label: "Менеджер", value: "manager" },
      ],
      access: {
        update: ({ req }) => {
          // Only admins can change roles
          return req.user?.role === "admin"
        },
      },
    },
  ],
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
