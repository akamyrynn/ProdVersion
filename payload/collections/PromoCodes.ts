import type { CollectionConfig } from "payload"
import { PROMO_PRESETS } from "../promo-presets"

export const PromoCodes: CollectionConfig = {
  slug: "promo-codes",
  admin: {
    useAsTitle: "code",
    group: "Заказы и продажи",
    description: "Промокоды и скидки",
    defaultColumns: [
      "code",
      "discountType",
      "discountValue",
      "currentUses",
      "isActive",
    ],
  },
  labels: {
    singular: "Промокод",
    plural: "Промокоды",
  },
  endpoints: [
    {
      path: "/issue-preset",
      method: "post",
      handler: async (req) => {
        const body = await req.json?.()
        const { presetId, clientEmail } = body || {}

        if (!req.user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const preset = PROMO_PRESETS.find((p) => p.id === presetId)
        if (!preset) {
          return Response.json({ error: "Preset not found" }, { status: 400 })
        }

        const random = Math.random().toString(36).substring(2, 7).toUpperCase()
        const code = `10C-${preset.id.replace("_", "").toUpperCase().slice(0, 6)}-${random}`

        const startsAt = new Date().toISOString()
        const expiresAt = new Date(
          Date.now() + preset.daysValid * 24 * 60 * 60 * 1000
        ).toISOString()

        const promoCode = await req.payload.create({
          collection: "promo-codes",
          data: {
            code,
            discountType: preset.discountType,
            discountValue: preset.discountValue,
            isSingleUse: preset.isSingleUse,
            maxUses: preset.maxUses,
            minOrderAmount: preset.minOrderAmount || 0,
            restrictedToEmail: clientEmail || undefined,
            startsAt,
            expiresAt,
            isActive: true,
          },
        })

        return Response.json({ success: true, promoCode })
      },
    },
  ],
  fields: [
    // === Sidebar ===
    {
      name: "isActive",
      type: "checkbox",
      label: "Активен",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      name: "currentUses",
      type: "number",
      label: "Использований",
      defaultValue: 0,
      admin: { readOnly: true, position: "sidebar" },
    },

    // === Main fields ===
    {
      name: "code",
      type: "text",
      label: "Код промокода",
      required: true,
      unique: true,
      admin: {
        description: "Заглавные буквы, без пробелов",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Описание (для менеджера)",
    },
    {
      type: "row",
      fields: [
        {
          name: "discountType",
          type: "select",
          label: "Тип скидки",
          required: true,
          options: [
            { label: "Процент (%)", value: "percentage" },
            { label: "Фиксированная сумма (руб)", value: "fixed_amount" },
          ],
          admin: { width: "50%" },
        },
        {
          name: "discountValue",
          type: "number",
          label: "Значение скидки",
          required: true,
          min: 0,
          admin: {
            width: "50%",
            description: "Процент или сумма в рублях",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "isSingleUse",
          type: "checkbox",
          label: "Одноразовый",
          defaultValue: false,
          admin: { width: "33%" },
        },
        {
          name: "maxUses",
          type: "number",
          label: "Макс. использований",
          admin: {
            width: "33%",
            description: "Пусто = без лимита",
          },
        },
        {
          name: "minOrderAmount",
          type: "number",
          label: "Мин. сумма заказа",
          min: 0,
          admin: { width: "34%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "startsAt",
          type: "date",
          label: "Действует с",
          admin: {
            width: "50%",
            date: { pickerAppearance: "dayAndTime" },
          },
        },
        {
          name: "expiresAt",
          type: "date",
          label: "Действует до",
          admin: {
            width: "50%",
            date: { pickerAppearance: "dayAndTime" },
            description: "Пусто = бессрочно",
          },
        },
      ],
    },
    {
      name: "restrictedToEmail",
      type: "email",
      label: "Привязка к email клиента",
      admin: {
        description: "Только этот клиент сможет использовать",
      },
    },
  ],
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === "admin",
  },
}
