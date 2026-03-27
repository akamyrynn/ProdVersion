"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"

export type PromoValidationResult =
  | {
      valid: true
      promoCodeId: string
      discountType: "percentage" | "fixed_amount"
      discountValue: number
      calculatedDiscount: number
    }
  | {
      valid: false
      error: string
    }

export async function validatePromoCode(
  code: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const payload = await getPayload({ config: configPromise })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { valid: false, error: "Необходима авторизация" }

  const { docs } = await payload.find({
    collection: "promo-codes",
    where: { code: { equals: code.trim().toUpperCase() } },
    limit: 1,
  })

  if (!docs.length) return { valid: false, error: "Промокод не найден" }

  const promo = docs[0] as Record<string, unknown>

  if (!promo.isActive) return { valid: false, error: "Промокод неактивен" }

  if (promo.startsAt && new Date(promo.startsAt as string) > new Date()) {
    return { valid: false, error: "Промокод ещё не активен" }
  }

  if (promo.expiresAt && new Date(promo.expiresAt as string) < new Date()) {
    return { valid: false, error: "Промокод истёк" }
  }

  if (
    promo.maxUses !== null &&
    promo.maxUses !== undefined &&
    ((promo.currentUses as number) || 0) >= (promo.maxUses as number)
  ) {
    return { valid: false, error: "Промокод исчерпан" }
  }

  if (promo.restrictedToEmail && user.email !== promo.restrictedToEmail) {
    return {
      valid: false,
      error: "Промокод недоступен для вашего аккаунта",
    }
  }

  if (
    promo.minOrderAmount &&
    subtotal < (promo.minOrderAmount as number)
  ) {
    return {
      valid: false,
      error: `Минимальная сумма заказа: ${(promo.minOrderAmount as number).toLocaleString("ru-RU")} ₽`,
    }
  }

  if (promo.isSingleUse) {
    const { data: usages } = await supabase
      .from("promo_code_usages")
      .select("id")
      .eq("promo_code_id", String(promo.id))
      .eq("client_id", user.id)
      .limit(1)

    if (usages && usages.length > 0) {
      return { valid: false, error: "Вы уже использовали этот промокод" }
    }
  }

  const discountType = promo.discountType as "percentage" | "fixed_amount"
  const discountValue = promo.discountValue as number
  let calculatedDiscount = 0

  if (discountType === "percentage") {
    calculatedDiscount = Math.round((subtotal * discountValue) / 100)
  } else {
    calculatedDiscount = Math.min(discountValue, subtotal)
  }

  return {
    valid: true,
    promoCodeId: String(promo.id),
    discountType,
    discountValue,
    calculatedDiscount,
  }
}
