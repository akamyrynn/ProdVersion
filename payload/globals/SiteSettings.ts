import type { GlobalConfig } from "payload"

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Настройки сайта",
  admin: {
    group: "Система",
  },
  fields: [
    {
      name: "loginAnnouncement",
      type: "textarea",
      label: "Объявление в модале входа",
      admin: {
        description: "Текст, который будет показан в модале авторизации на главной странице",
      },
    },
    {
      name: "loginAnnouncementEnabled",
      type: "checkbox",
      label: "Показывать объявление",
      defaultValue: false,
    },
    {
      name: "vatRate",
      type: "select",
      label: "Ставка НДС",
      defaultValue: "22",
      options: [
        { label: "Без НДС", value: "none" },
        { label: "0%", value: "0" },
        { label: "5%", value: "5" },
        { label: "10%", value: "10" },
        { label: "20%", value: "20" },
        { label: "22%", value: "22" },
        { label: "Своё значение", value: "custom" },
      ],
      admin: {
        description: "Глобальная ставка НДС, применяется ко всем новым заказам и счетам",
      },
    },
    {
      name: "vatCustomRate",
      type: "number",
      label: "НДС (%)",
      min: 0,
      max: 100,
      admin: {
        condition: (data) => data?.vatRate === "custom",
        description: "Укажите свою ставку НДС",
      },
    },
  ],
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
}
