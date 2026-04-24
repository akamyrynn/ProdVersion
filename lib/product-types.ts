import type { ProductDetailsSchema } from "@/types"

export const PRODUCT_DETAILS_SCHEMA_OPTIONS = [
  { label: "Обычный товар", value: "generic" },
  { label: "Кофейные характеристики", value: "coffee" },
  { label: "Чайные характеристики", value: "tea" },
] as const

export function normalizeProductDetailsSchema(value: unknown): ProductDetailsSchema {
  return value === "coffee" || value === "tea" ? value : "generic"
}

export function getRelationshipId(value: unknown): number | string | null {
  if (typeof value === "number" || typeof value === "string") return value

  if (!value || typeof value !== "object") return null

  const record = value as { id?: unknown; value?: unknown }

  if (typeof record.id === "number" || typeof record.id === "string") return record.id
  if (typeof record.value === "number" || typeof record.value === "string") return record.value

  return null
}
