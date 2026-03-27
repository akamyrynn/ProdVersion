import type { OrderStatus, DeliveryMethod } from "@/types"

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

export function getTagBgClass(color?: string): string {
  if (color === "purple") return "bg-[#faead5] text-[#5b328a]"
  if (color === "green") return "bg-green-100 text-green-700"
  if (color === "red") return "bg-red-100 text-red-700"
  if (color === "blue") return "bg-blue-100 text-blue-700"
  if (color === "yellow") return "bg-yellow-100 text-yellow-800"
  if (color === "pink") return "bg-pink-100 text-pink-700"
  if (color === "gray") return "bg-neutral-100 text-neutral-600"
  return "bg-[#faead5] text-[#e6610d]"
}

export const PRODUCT_TYPE_LABELS = {
  coffee: "Кофе",
  tea: "Чай",
  accessory: "Аксессуары",
} as const

export const GRIND_OPTIONS = ["В зёрнах", "Молотый"] as const

export const SELF_PICKUP_ADDRESS = "г. Москва, ул. Складская, д. 10"

export const TRAINING_URL = "https://www.10coffee.ru/obuchenie"
