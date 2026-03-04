import type { OrderStatus, DeliveryMethod, StickerType } from "@/types"

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Ожидает обработки",
  confirmed: "Подтверждён",
  invoiced: "Счёт выставлен",
  paid: "Оплачен",
  in_production: "В производстве",
  ready: "Готов",
  shipped: "Отгружен",
  delivered: "Доставлен",
  cancelled: "Отменён",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  paid: "bg-green-100 text-green-800",
  in_production: "bg-orange-100 text-orange-800",
  ready: "bg-emerald-100 text-emerald-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-200 text-green-900",
  cancelled: "bg-red-100 text-red-800",
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  self_pickup: "Самовывоз",
  cdek: "СДЭК",
  cap_2000: "ЦАП 2000",
}

export const STICKER_LABELS: Record<StickerType, string> = {
  new: "Новинка",
  month_discount: "Скидка месяца",
  popular: "Популярное",
}

export const STICKER_COLORS: Record<StickerType, string> = {
  new: "bg-green-500 text-white",
  month_discount: "bg-red-500 text-white",
  popular: "bg-amber-500 text-white",
}

export const PRODUCT_TYPE_LABELS = {
  coffee: "Кофе",
  tea: "Чай",
  accessory: "Аксессуары",
} as const

export const GRIND_OPTIONS = ["В зёрнах", "Молотый"] as const

export const SELF_PICKUP_ADDRESS = "г. Москва, ул. Складская, д. 10" // TODO: update with real address

export const TRAINING_URL = "https://www.10coffee.ru/obuchenie"
