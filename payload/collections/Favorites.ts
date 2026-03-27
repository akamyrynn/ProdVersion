import type { CollectionConfig } from "payload"

export const Favorites: CollectionConfig = {
  slug: "favorites",
  admin: {
    group: "Клиенты",
    description: "Избранные товары клиентов",
    defaultColumns: ["clientId", "product"],
  },
  labels: {
    singular: "Избранное",
    plural: "Избранные",
  },
  fields: [
    {
      name: "clientId",
      type: "text",
      label: "ID клиента (Supabase)",
      required: true,
      index: true,
    },
    {
      name: "product",
      type: "relationship",
      label: "Товар",
      relationTo: "products",
      required: true,
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
}
