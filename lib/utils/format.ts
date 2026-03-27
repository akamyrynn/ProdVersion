/**
 * Format price in Russian rubles
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Format weight from grams
 */
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000
    return `${kg.toFixed(kg % 1 === 0 ? 0 : 1)} кг`
  }
  return `${grams} г`
}

/**
 * Format date in Russian locale
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr))
}

/**
 * Format date with time
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr))
}

/**
 * Format order ID for display
 */
export function formatOrderNumber(orderId: string): string {
  return orderId || "—"
}
