"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"
import { getCartItems, clearCart as clearPayloadCart, addToCart } from "@/lib/actions/cart"
import { revalidatePath } from "next/cache"
import type { Order, OrderItem, OrderStatus, DeliveryMethod } from "@/types"

async function getPayloadClient() {
  return getPayload({ config: configPromise })
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

async function getClientDocId(supabaseUserId: string): Promise<number | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "clients",
    where: { supabaseId: { equals: supabaseUserId } },
    limit: 1,
    depth: 0,
  })
  return (docs[0]?.id as number) ?? null
}

// ============================================================
// Transform: Payload doc → frontend Order type
// ============================================================

function transformOrderItem(item: any): OrderItem {
  return {
    id: item.id || "",
    order_id: "",
    product_id: "",
    variant_id: "",
    product_name: item.productName || "",
    variant_name: item.variantName || "",
    grind_option: item.grindOption || null,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unitPrice) || 0,
    total_price: Number(item.totalPrice) || 0,
    weight_grams: null,
  }
}

function transformOrder(doc: any): Order {
  const clientRef = doc.client
  const clientId = typeof clientRef === "object" ? String(clientRef?.id) : String(clientRef ?? "")

  return {
    id: String(doc.id),
    order_id: doc.orderId || "",
    client_id: clientId,
    company_name: doc.companyName || null,
    company_inn: doc.companyInn || null,
    status: doc.status as OrderStatus,
    payment_status: doc.paymentStatus || "pending",
    delivery_method: doc.deliveryMethod as DeliveryMethod,
    delivery_address: doc.deliveryAddress || null,
    subtotal: Number(doc.subtotal) || 0,
    discount_amount: Number(doc.discountAmount) || 0,
    delivery_cost: Number(doc.deliveryCost) || 0,
    total: Number(doc.total) || 0,
    total_weight_grams: Number(doc.totalWeightGrams) || 0,
    promo_code_id: doc.promoCode ? String(typeof doc.promoCode === "object" ? doc.promoCode.id : doc.promoCode) : null,
    comment: doc.comment || null,
    admin_notes: doc.adminNotes || null,
    cdek_tracking_number: doc.cdekTrackingNumber || null,
    cap_2000_tracking_number: doc.cap2000TrackingNumber || null,
    created_at: doc.createdAt || "",
    updated_at: doc.updatedAt || "",
    items: (doc.items || []).map(transformOrderItem),
    client: typeof clientRef === "object" && clientRef ? {
      id: String(clientRef.id),
      email: clientRef.email || "",
      full_name: clientRef.fullName || "",
      phone: clientRef.phone || null,
      created_at: clientRef.createdAt || "",
      updated_at: clientRef.updatedAt || "",
    } : undefined,
  }
}

// ============================================================
// Client-facing actions
// ============================================================

export async function getClientOrders(): Promise<Order[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const clientDocId = await getClientDocId(userId)
  if (!clientDocId) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "orders",
    where: { client: { equals: clientDocId } },
    sort: "-createdAt",
    depth: 1,
    limit: 200,
  })

  return docs.map(transformOrder)
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const payload = await getPayloadClient()

  try {
    const doc = await payload.findByID({
      collection: "orders",
      id: Number(orderId),
      depth: 1,
    })
    return transformOrder(doc)
  } catch {
    return null
  }
}

export async function createOrder(params: {
  companyId?: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  comment?: string
  promoCodeId?: string
  discountAmount?: number
  deliveryCost?: number
}): Promise<{ error?: string; success?: boolean; orderId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Не авторизован" }

  const clientDocId = await getClientDocId(user.id)
  if (!clientDocId) return { error: "Клиент не найден" }

  const cartItems = await getCartItems()
  if (!cartItems || cartItems.length === 0) return { error: "Корзина пуста" }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.price ?? 0) * item.quantity
  }, 0)

  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.weight_grams ?? 0) * item.quantity
  }, 0)

  const discountAmount = params.discountAmount ?? 0
  const deliveryCost = params.deliveryCost ?? 0
  const total = subtotal - discountAmount + deliveryCost

  // Resolve company name/inn from Supabase companies table
  let companyName: string | undefined
  let companyInn: string | undefined
  if (params.companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("name, inn")
      .eq("id", params.companyId)
      .single()

    if (company) {
      companyName = company.name
      companyInn = company.inn
    }
  }

  // Build items array for Payload
  const items = cartItems.map((item) => ({
    productName: item.product?.name || "",
    variantName: item.variant?.name || "",
    grindOption: item.grind_option || "",
    quantity: item.quantity,
    unitPrice: item.variant?.price ?? 0,
    totalPrice: (item.variant?.price ?? 0) * item.quantity,
  }))

  // Resolve promo code Payload ID
  let payloadPromoId: number | undefined
  if (params.promoCodeId) {
    try {
      const payloadClient = await getPayloadClient()
      const { docs } = await payloadClient.find({
        collection: "promo-codes",
        where: { id: { equals: Number(params.promoCodeId) } },
        limit: 1,
        depth: 0,
      })
      if (docs[0]) payloadPromoId = docs[0].id as number
    } catch {
      // Promo code not found in Payload, skip
    }
  }

  // Create order via Payload API
  const payload = await getPayloadClient()
  const orderData: Record<string, any> = {
    client: clientDocId,
    deliveryMethod: params.deliveryMethod,
    deliveryAddress: params.deliveryAddress || "",
    subtotal,
    discountAmount,
    deliveryCost,
    total,
    totalWeightGrams: totalWeight,
    comment: params.comment || "",
    items,
  }

  if (companyName) orderData.companyName = companyName
  if (companyInn) orderData.companyInn = companyInn
  if (payloadPromoId) orderData.promoCode = payloadPromoId

  const doc = await payload.create({
    collection: "orders",
    data: orderData,
  })

  // Clear cart
  await clearPayloadCart()

  // Create notification via Supabase
  await supabase.from("notifications").insert({
    client_id: user.id,
    type: "order_update",
    title: "Заказ создан",
    message: `Ваш заказ ${(doc as any).orderId || doc.id} ожидает обработки`,
    data: { order_id: String(doc.id) },
  })

  // Track promo code usage via Supabase
  if (params.promoCodeId) {
    await supabase.from("promo_code_usages").insert({
      promo_code_id: params.promoCodeId,
      client_id: user.id,
      order_id: String(doc.id),
    })
    await supabase.rpc("increment_promo_uses", { code_id: params.promoCodeId })
  }

  revalidatePath("/dashboard")
  return { success: true, orderId: String(doc.id) }
}

export async function repeatOrder(orderId: string): Promise<{ success?: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Не авторизован" }

  const payload = await getPayloadClient()

  try {
    const doc = await payload.findByID({
      collection: "orders",
      id: Number(orderId),
      depth: 0,
    })

    const items = (doc as any).items as any[] || []
    if (items.length === 0) return { error: "В заказе нет позиций" }

    // Search for products by name and add them to cart
    for (const item of items) {
      const { docs: products } = await payload.find({
        collection: "products",
        where: { name: { equals: item.productName } },
        limit: 1,
        depth: 1,
      })

      if (products[0]) {
        const product = products[0] as any
        const variant = (product.variants || []).find((v: any) => v.name === item.variantName)
        if (variant) {
          await addToCart({
            productId: String(product.id),
            variantId: variant.id,
            quantity: item.quantity || 1,
            grindOption: item.grindOption || undefined,
          })
        }
      }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch {
    return { error: "Заказ не найден" }
  }
}

export async function setTrackingNumber(
  orderId: string,
  trackingNumber: string,
  carrier: "cdek" | "cap_2000"
): Promise<{ success?: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Не авторизован" }

  const payload = await getPayloadClient()
  const field = carrier === "cdek" ? "cdekTrackingNumber" : "cap2000TrackingNumber"

  await payload.update({
    collection: "orders",
    id: Number(orderId),
    data: { [field]: trackingNumber },
  })

  // Notification via Supabase
  try {
    const doc = await payload.findByID({
      collection: "orders",
      id: Number(orderId),
      depth: 1,
    })

    const clientRef = (doc as any).client
    const supabaseId = typeof clientRef === "object" ? clientRef?.supabaseId : null

    if (supabaseId) {
      const supabase = await createClient()
      const carrierName = carrier === "cdek" ? "СДЭК" : "ЦАП-2000"
      await supabase.from("notifications").insert({
        client_id: supabaseId,
        type: "order_update",
        title: "Трек-номер присвоен",
        message: `Заказ ${(doc as any).orderId} отправлен через ${carrierName}. Трек: ${trackingNumber}`,
        data: { order_id: String(doc.id) },
      })
    }
  } catch {
    // notification failed, non-critical
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// ============================================================
// Admin actions
// ============================================================

export async function getAllOrders(): Promise<Order[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: "orders",
    sort: "-createdAt",
    depth: 1,
    limit: 500,
  })

  return docs.map(transformOrder)
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success?: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Не авторизован" }

  const payload = await getPayloadClient()

  // Get current order
  const doc = await payload.findByID({
    collection: "orders",
    id: Number(orderId),
    depth: 1,
  })

  const oldStatus = (doc as any).status

  // Update via Payload
  await payload.update({
    collection: "orders",
    id: Number(orderId),
    data: { status: newStatus },
  })

  // Log status change via Supabase
  const supabase = await createClient()
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: userId,
    note,
  })

  // Notify client
  const statusLabels: Record<string, string> = {
    confirmed: "подтверждён",
    invoiced: "счёт выставлен",
    paid: "оплачен",
    in_production: "в производстве",
    ready: "готов",
    shipped: "отгружен",
    delivered: "доставлен",
    cancelled: "отменён",
  }

  const clientRef = (doc as any).client
  const supabaseId = typeof clientRef === "object" ? clientRef?.supabaseId : null

  if (supabaseId) {
    await supabase.from("notifications").insert({
      client_id: supabaseId,
      type: "order_update",
      title: "Обновление заказа",
      message: `Статус вашего заказа изменён: ${statusLabels[newStatus] || newStatus}`,
      data: { order_id: orderId },
    })
  }

  revalidatePath("/admin/orders")
  return { success: true }
}
