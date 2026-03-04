"use server"

import { createClient } from "@/lib/supabase/server"
import { getCartItems, clearCart as clearPayloadCart } from "@/lib/actions/cart"
import { revalidatePath } from "next/cache"
import type { Order, OrderStatus, DeliveryMethod } from "@/types"

export async function getClientOrders(filters?: {
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase
    .from("orders")
    .select("*")
    .eq("client_user_id", user.id)
    .order("created_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data, error } = await query
  if (error) {
    console.error("getClientOrders error:", error.message)
    return []
  }

  // Fetch items for each order separately
  const orders = (data || []) as Order[]
  for (const order of orders) {
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
    order.items = items || []
  }

  return orders
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()

  if (error || !data) return null

  const order = data as Order

  // Fetch related data separately
  const [itemsRes, companyRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id),
    order.company_id
      ? supabase.from("companies").select("*").eq("id", order.company_id).single()
      : Promise.resolve({ data: null }),
  ])

  order.items = itemsRes.data || []
  if (companyRes.data) order.company = companyRes.data

  return order
}

export async function createOrder(params: {
  companyId: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  comment?: string
  promoCodeId?: string
  discountAmount?: number
  deliveryCost?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Не авторизован" }

  // Get cart items from Payload
  const cartItems = await getCartItems()

  if (!cartItems || cartItems.length === 0) {
    return { error: "Корзина пуста" }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.price || 0) * item.quantity
  }, 0)

  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.weight_grams || 0) * item.quantity
  }, 0)

  const discountAmount = params.discountAmount || 0
  const deliveryCost = params.deliveryCost || 0
  const total = subtotal - discountAmount + deliveryCost

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      client_user_id: user.id,
      company_id: params.companyId,
      delivery_method: params.deliveryMethod,
      delivery_address: params.deliveryAddress,
      subtotal,
      discount_amount: discountAmount,
      delivery_cost: deliveryCost,
      total,
      total_weight_grams: totalWeight,
      promo_code_id: params.promoCodeId,
      comment: params.comment,
    })
    .select()
    .single()

  if (orderError || !order) {
    return { error: orderError?.message || "Ошибка при создании заказа" }
  }

  // Create order items (snapshot)
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product?.name || "",
    variant_name: item.variant?.name || "",
    grind_option: item.grind_option,
    quantity: item.quantity,
    unit_price: item.variant?.price || 0,
    total_price: (item.variant?.price || 0) * item.quantity,
    weight_grams: item.variant?.weight_grams,
  }))

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
  if (itemsError) {
    console.error("order_items insert error:", itemsError.message)
  }

  // Clear cart in Payload
  await clearPayloadCart()

  // Create notification for client
  await supabase.from("notifications").insert({
    client_id: user.id,
    type: "order_update",
    title: "Заказ создан",
    message: `Ваш заказ #${order.order_number || order.id} ожидает обработки`,
    data: { order_id: order.id },
  })

  // Update promo code usage if applicable
  if (params.promoCodeId) {
    await supabase.from("promo_code_usages").insert({
      promo_code_id: params.promoCodeId,
      client_id: user.id,
      order_id: order.id,
    })

    await supabase.rpc("increment_promo_uses", {
      code_id: params.promoCodeId,
    })
  }

  revalidatePath("/dashboard")
  return { success: true, orderId: order.id }
}

export async function repeatOrder(orderId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Не авторизован" }

  // Get order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)

  if (!orderItems || orderItems.length === 0) {
    return { error: "Заказ не найден" }
  }

  // Add items back to cart
  for (const item of orderItems) {
    await supabase.from("cart_items").upsert(
      {
        client_id: user.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        grind_option: item.grind_option,
      },
      {
        onConflict: "client_id,variant_id,grind_option",
      }
    )
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function setTrackingNumber(
  orderId: string,
  trackingNumber: string,
  carrier: "cdek" | "cap_2000"
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Не авторизован" }

  const field =
    carrier === "cdek" ? "cdek_tracking_number" : "cap_2000_tracking_number"

  const { error } = await supabase
    .from("orders")
    .update({ [field]: trackingNumber })
    .eq("id", orderId)

  if (error) return { error: error.message }

  const { data: order } = await supabase
    .from("orders")
    .select("client_user_id, order_number")
    .eq("id", orderId)
    .single()

  if (order?.client_user_id) {
    const carrierName = carrier === "cdek" ? "СДЭК" : "ЦАП-2000"
    await supabase.from("notifications").insert({
      client_id: order.client_user_id,
      type: "order_update",
      title: "Трек-номер присвоен",
      message: `Заказ #${order.order_number} отправлен через ${carrierName}. Трек: ${trackingNumber}`,
      data: { order_id: orderId },
    })
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Admin actions
export async function getAllOrders(filters?: {
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  const { data, error } = await query
  if (error) {
    console.error("getAllOrders error:", error.message)
    return []
  }

  const orders = (data || []) as Order[]
  for (const order of orders) {
    const [itemsRes, clientRes] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", order.id),
      order.client_user_id
        ? supabase.from("client_profiles").select("*").eq("id", order.client_user_id).single()
        : Promise.resolve({ data: null }),
    ])
    order.items = itemsRes.data || []
    if (clientRes.data) order.client = clientRes.data
  }

  return orders
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Не авторизован" }

  // Get current status
  const { data: order } = await supabase
    .from("orders")
    .select("status, client_user_id")
    .eq("id", orderId)
    .single()

  if (!order) return { error: "Заказ не найден" }

  // Update status
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId)

  if (error) return { error: error.message }

  // Log status change
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by: user.id,
    note,
  })

  // Create notification for client
  const statusLabels: Record<string, string> = {
    confirmed: "подтверждён",
    invoice_sent: "счёт отправлен",
    paid: "оплачен",
    in_production: "в производстве",
    ready: "готов",
    shipped: "отгружен",
    delivered: "доставлен",
    cancelled: "отменён",
  }

  if (!order.client_user_id) {
    revalidatePath("/admin/orders")
    return { success: true }
  }

  await supabase.from("notifications").insert({
    client_id: order.client_user_id,
    type: "order_update",
    title: "Обновление заказа",
    message: `Статус вашего заказа изменён: ${statusLabels[newStatus] || newStatus}`,
    data: { order_id: orderId },
  })

  revalidatePath("/admin/orders")
  return { success: true }
}
