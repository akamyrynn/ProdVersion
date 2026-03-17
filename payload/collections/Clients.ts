import type { CollectionConfig } from "payload"

export const Clients: CollectionConfig = {
  slug: "clients",
  admin: {
    useAsTitle: "fullName",
    group: "Клиенты",
    description: "Клиенты платформы",
    listSearchableFields: ["fullName", "email", "phone"],
    defaultColumns: ["fullName", "email", "phone", "createdAt"],
  },
  labels: {
    singular: "Клиент",
    plural: "Клиенты",
  },
  fields: [
    // === Sidebar ===
    {
      name: "supabaseId",
      type: "text",
      label: "Supabase User ID",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "isVerified",
      type: "checkbox",
      label: "Верифицирован",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },

    // === Main content (tabs) ===
    {
      type: "tabs",
      tabs: [
        {
          label: "Контакты",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "fullName",
                  type: "text",
                  label: "ФИО",
                  required: true,
                  admin: { width: "40%" },
                },
                {
                  name: "email",
                  type: "email",
                  label: "Email",
                  required: true,
                  unique: true,
                  admin: { width: "30%" },
                },
                {
                  name: "phone",
                  type: "text",
                  label: "Телефон",
                  admin: { width: "30%" },
                },
              ],
            },
            {
              name: "notes",
              type: "textarea",
              label: "Заметки менеджера",
              admin: {
                description: "Видны только в админ-панели",
              },
            },
          ],
        },
        {
          label: "Компании",
          fields: [
            {
              name: "companies",
              type: "array",
              label: "Компании",
              labels: { singular: "Компания", plural: "Компании" },
              fields: [
                { name: "name", type: "text", label: "Название" },
                {
                  type: "row",
                  fields: [
                    { name: "inn", type: "text", label: "ИНН", admin: { width: "33%" } },
                    { name: "kpp", type: "text", label: "КПП", admin: { width: "33%" } },
                    { name: "ogrn", type: "text", label: "ОГРН", admin: { width: "34%" } },
                  ],
                },
                { name: "legalAddress", type: "text", label: "Юр. адрес" },
                {
                  type: "collapsible",
                  label: "Банковские реквизиты",
                  admin: { initCollapsed: true },
                  fields: [
                    { name: "bankName", type: "text", label: "Банк" },
                    {
                      type: "row",
                      fields: [
                        { name: "bik", type: "text", label: "БИК", admin: { width: "33%" } },
                        { name: "settlementAccount", type: "text", label: "Расч. счёт", admin: { width: "33%" } },
                        { name: "correspondentAccount", type: "text", label: "Корр. счёт", admin: { width: "34%" } },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Заказы",
          fields: [
            {
              name: "orders",
              type: "join",
              collection: "orders",
              on: "client",
              label: "Заказы клиента",
              admin: {
                description: "Все заказы этого клиента",
              },
            },
          ],
        },
        {
          label: "Промокоды",
          fields: [
            {
              name: "issuePromo",
              type: "ui",
              admin: {
                components: {
                  Field: "/payload/components/IssuePromoButton",
                },
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterRead: [
      async ({ doc }) => {
        // Populate companies from Supabase companies table
        if (doc.supabaseId && (!doc.companies || doc.companies.length === 0)) {
          try {
            const { createAdminClient } = await import("@/lib/supabase/admin")
            const admin = createAdminClient()
            const { data } = await admin
              .from("companies")
              .select("*")
              .eq("client_id", doc.supabaseId)
              .order("created_at", { ascending: false })

            if (data && data.length > 0) {
              doc.companies = data.map((c: any) => ({
                name: c.name,
                inn: c.inn,
                kpp: c.kpp,
                ogrn: c.ogrn,
                legalAddress: c.legal_address,
                bankName: c.bank_name,
                bik: c.bik,
                settlementAccount: c.settlement_account,
                correspondentAccount: c.correspondent_account,
              }))
            }
          } catch {
            // Supabase not available
          }
        }
        return doc
      },
    ],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
