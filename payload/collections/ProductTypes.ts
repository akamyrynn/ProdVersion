import type { CollectionConfig, Where } from "payload"

export const ProductTypes: CollectionConfig = {
  slug: "product-types",
  admin: {
    useAsTitle: "name",
    group: "Каталог",
    description: "Управляемые типы товаров для вкладок каталога",
    defaultColumns: ["name", "slug", "sortOrder", "isVisible"],
  },
  labels: {
    singular: "Тип товара",
    plural: "Типы товаров",
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
      label: "Slug",
      required: true,
      unique: true,
      admin: {
        description: "Латиница без пробелов, например coffee, tea, syrups",
      },
    },
    {
      name: "icon",
      type: "upload",
      label: "SVG-иконка",
      relationTo: "media",
      admin: {
        description: "На фронте иконка выводится размером 14x14 px",
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
      label: "Показывать на фронте",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const typeDoc = await req.payload.findByID({
          collection: "product-types",
          id,
          depth: 0,
        })

        const slug = typeof typeDoc.slug === "string" ? typeDoc.slug : ""
        const usageClauses: Where[] = [{ productTypeRef: { equals: id } }]
        if (slug) {
          usageClauses.push({ productType: { equals: slug } })
        }
        const usageWhere: Where = { or: usageClauses }

        const [products, categories] = await Promise.all([
          req.payload.find({
            collection: "products",
            where: usageWhere,
            limit: 1,
            depth: 0,
          }),
          req.payload.find({
            collection: "categories",
            where: usageWhere,
            limit: 1,
            depth: 0,
          }),
        ])

        if (products.totalDocs > 0 || categories.totalDocs > 0) {
          throw new Error("Нельзя удалить тип товара, пока к нему привязаны товары или категории.")
        }
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
}
