"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCartItems, clearCart as clearPayloadCart, addToCart } from "@/lib/actions/cart"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"
import type { Order, OrderItem, OrderStatus, DeliveryMethod } from "@/types"

const smtpTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

function formatPrice(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽"
}

async function sendOrderEmail(email: string, order: any, items: any[], pdfBuffer?: Uint8Array) {
  const itemsHtml = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.productName} ${i.variantName ? `(${i.variantName})` : ""}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.totalPrice)}</td></tr>`
  ).join("")

  const attachments: any[] = []
  if (pdfBuffer) {
    attachments.push({
      filename: `Счёт_${order.orderId || order.id}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    })
  }

  await smtpTransporter.sendMail({
    from: `"10coffee" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: `Заказ ${order.orderId || order.id} оформлен — 10coffee`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 16px">Спасибо за заказ!</h2>
        <p style="color:#666;margin:0 0 24px">Ваш заказ <strong>${order.orderId || order.id}</strong> принят и ожидает обработки.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Товар</th><th style="padding:8px;text-align:center">Кол-во</th><th style="padding:8px;text-align:right">Сумма</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin:0 0 24px">
          <p style="margin:0;font-size:18px;font-weight:bold">Итого: ${formatPrice(order.total)}</p>
        </div>
        <p style="color:#999;font-size:12px;margin:0">Менеджер свяжется с вами для подтверждения заказа.</p>
      </div>
    `,
    attachments,
  })
}

async function sendStatusEmail(email: string, orderId: string, status: string, statusLabel: string) {
  await smtpTransporter.sendMail({
    from: `"10coffee" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: `Заказ ${orderId} — ${statusLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="margin:0 0 16px">Обновление заказа</h2>
        <p style="color:#666;margin:0 0 24px">Статус вашего заказа <strong>${orderId}</strong> изменён:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:0 0 24px">
          <p style="margin:0;font-size:18px;font-weight:bold">${statusLabel}</p>
        </div>
        <p style="color:#999;font-size:12px;margin:0">Подробности в личном кабинете.</p>
      </div>
    `,
  })
}

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

async function getClientDoc(supabaseUserId: string): Promise<{ id: number; discountPercent: number } | null> {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: "clients",
      where: { supabaseId: { equals: supabaseUserId } },
      limit: 1,
      depth: 0,
    })
    if (!docs[0]) return null
    return {
      id: docs[0].id as number,
      discountPercent: Number((docs[0] as any).discountPercent) || 0,
    }
  } catch {
    return null
  }
}

async function getClientDocId(supabaseUserId: string): Promise<number | null> {
  const doc = await getClientDoc(supabaseUserId)
  return doc?.id ?? null
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
      id: orderId,
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

  const clientDoc = await getClientDoc(user.id)
  if (!clientDoc) return { error: "Клиент не найден" }
  const clientDocId = clientDoc.id

  const cartItems = await getCartItems()
  if (!cartItems || cartItems.length === 0) return { error: "Корзина пуста" }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.price ?? 0) * item.quantity
  }, 0)

  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + (item.variant?.weight_grams ?? 0) * item.quantity
  }, 0)

  // Apply personal client discount if no promo (or promo is smaller)
  const clientDiscountPercent = clientDoc.discountPercent
  const clientDiscountAmount = clientDiscountPercent > 0
    ? Math.round(subtotal * clientDiscountPercent / 100)
    : 0
  const promoDiscountAmount = params.discountAmount ?? 0
  const discountAmount = Math.max(clientDiscountAmount, promoDiscountAmount)
  const appliedDiscountPercent = discountAmount === clientDiscountAmount && clientDiscountPercent > 0
    ? clientDiscountPercent
    : 0

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
  let payloadPromoId: string | number | undefined
  if (params.promoCodeId) {
    try {
      const payloadClient = await getPayloadClient()
      const { docs } = await payloadClient.find({
        collection: "promo-codes",
        where: { id: { equals: params.promoCodeId } },
        limit: 1,
        depth: 0,
      })
      if (docs[0]) payloadPromoId = docs[0].id
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

  if (appliedDiscountPercent > 0) orderData.discountPercent = appliedDiscountPercent
  if (companyName) orderData.companyName = companyName
  if (companyInn) orderData.companyInn = companyInn
  if (payloadPromoId) orderData.promoCode = payloadPromoId

  const doc = await payload.create({
    collection: "orders",
    data: orderData,
  })

  // Also populate order_items Supabase table (reliable source for repeat orders)
  const adminDb = createAdminClient()
  const orderItemsRows = cartItems.map((item) => ({
    order_id: String(doc.id),
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product?.name || "",
    variant_name: item.variant?.name || "",
    grind_option: item.grind_option || null,
    quantity: item.quantity,
    unit_price: item.variant?.price ?? 0,
    total_price: (item.variant?.price ?? 0) * item.quantity,
    weight_grams: item.variant?.weight_grams ?? null,
  }))

  await adminDb.from("order_items").insert(orderItemsRows)

  // Clear cart (now uses direct Supabase queries, no Payload transaction issues)
  await clearPayloadCart()

  // Send order confirmation email with invoice PDF
  try {
    const { generateInvoicePDF } = await import("@/lib/generate-invoice")
    const orderForInvoice = {
      id: doc.id,
      orderId: (doc as any).orderId,
      items,
      subtotal,
      discountAmount,
      deliveryCost,
      total,
      companyName,
      companyInn,
    }
    let pdfBuffer: Uint8Array | undefined
    try {
      pdfBuffer = await generateInvoicePDF(orderForInvoice as any)
    } catch (pdfErr) {
      console.error("Failed to generate invoice PDF:", pdfErr)
    }
    await sendOrderEmail(user.email!, orderForInvoice, items, pdfBuffer)
  } catch (emailErr) {
    console.error("Failed to send order email:", emailErr)
  }

  // Create notification via admin client (RLS requires admin for INSERT)
  await adminDb.from("notifications").insert({
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
  const db = createAdminClient()

  try {
    // ===== Step 1: Try order_items Supabase table first (has product_id/variant_id) =====
    const { data: dbItems, error: dbErr } = await db
      .from("order_items")
      .select("product_id, variant_id, product_name, variant_name, grind_option, quantity")
      .eq("order_id", orderId)

    console.log("[repeatOrder] order_items query:", { orderId, dbItems: dbItems?.length, dbErr: dbErr?.message })

    if (dbItems && dbItems.length > 0) {
      // Check if product_ids are old UUIDs (contain hyphens) vs new integer IDs
      const hasIntegerIds = dbItems.every((r) => /^\d+$/.test(String(r.product_id)))

      if (hasIntegerIds) {
        let addedCount = 0
        for (const row of dbItems) {
          const grindOption = row.grind_option || ""
          const qty = row.quantity || 1

          const { data: existing } = await db
            .from("cart_items")
            .select("id, quantity")
            .eq("client_id", userId)
            .eq("product_id", row.product_id)
            .eq("variant_id", row.variant_id)
            .eq("grind_option", grindOption)
            .limit(1)
            .single()

          if (existing) {
            const { error } = await db
              .from("cart_items")
              .update({ quantity: existing.quantity + qty })
              .eq("id", existing.id)
            if (!error) addedCount++
          } else {
            const { error } = await db.from("cart_items").insert({
              client_id: userId,
              product_id: row.product_id,
              variant_id: row.variant_id,
              quantity: qty,
              grind_option: grindOption,
            })
            if (!error) addedCount++
          }
        }

        if (addedCount > 0) {
          revalidatePath("/dashboard")
          return { success: true }
        }
      }
      // If UUIDs (old orders) — fall through to Step 2 (name-based search)
    }

    // ===== Step 2: Try Payload items =====
    let items: { productName: string; variantName: string; grindOption: string; quantity: number }[] = []

    try {
      const doc = await payload.findByID({
        collection: "orders",
        id: orderId,
        depth: 0,
      })
      const rawDoc = doc as any
      console.log("[repeatOrder] Payload doc keys:", Object.keys(rawDoc))
      console.log("[repeatOrder] Payload doc.items:", JSON.stringify(rawDoc.items)?.slice(0, 500))

      const payloadItems = rawDoc.items as any[] || []
      items = payloadItems.map((i: any) => ({
        productName: i.productName || i.product_name || "",
        variantName: i.variantName || i.variant_name || "",
        grindOption: i.grindOption || i.grind_option || "",
        quantity: Number(i.quantity) || 1,
      }))
    } catch (e: any) {
      console.log("[repeatOrder] Payload findByID error:", e?.message)
    }

    console.log("[repeatOrder] parsed items:", JSON.stringify(items))

    if (items.length === 0) return { error: "В заказе нет позиций" }

    // ===== Step 3: Search products by name via Supabase =====
    let addedCount = 0

    for (const item of items) {
      // Find product by name (without is_visible filter for robustness)
      const { data: products, error: pErr } = await db
        .from("products")
        .select("id, name")
        .eq("name", item.productName)
        .limit(1)

      console.log("[repeatOrder] product search:", { name: item.productName, found: products?.length, error: pErr?.message })

      if (!products?.[0]) continue

      const productId = products[0].id

      // Find variant by name (Payload table: products_variants, with _parent_id)
      const { data: variants, error: vErr } = await db
        .from("products_variants")
        .select("id, name")
        .eq("_parent_id", productId)
        .eq("name", item.variantName)
        .limit(1)

      console.log("[repeatOrder] variant search:", { variantName: item.variantName, found: variants?.length, error: vErr?.message })

      if (!variants?.[0]) continue

      const variantId = variants[0].id
      const grindOption = item.grindOption || ""
      const qty = item.quantity || 1

      const { data: existing } = await db
        .from("cart_items")
        .select("id, quantity")
        .eq("client_id", userId)
        .eq("product_id", productId)
        .eq("variant_id", variantId)
        .eq("grind_option", grindOption)
        .limit(1)
        .single()

      if (existing) {
        const { error } = await db
          .from("cart_items")
          .update({ quantity: existing.quantity + qty })
          .eq("id", existing.id)
        if (!error) addedCount++
      } else {
        const { error } = await db.from("cart_items").insert({
          client_id: userId,
          product_id: productId,
          variant_id: variantId,
          quantity: qty,
          grind_option: grindOption,
        })
        if (!error) addedCount++
      }
    }

    if (addedCount === 0) return { error: "Товары из заказа не найдены в каталоге" }

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
    id: orderId,
    data: { [field]: trackingNumber },
  })

  // Notification via Supabase
  try {
    const doc = await payload.findByID({
      collection: "orders",
      id: orderId,
      depth: 1,
    })

    const clientRef = (doc as any).client
    const supabaseId = typeof clientRef === "object" ? clientRef?.supabaseId : null

    if (supabaseId) {
      const adminDb = createAdminClient()
      const carrierName = carrier === "cdek" ? "СДЭК" : "ЦАП-2000"
      await adminDb.from("notifications").insert({
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

export async function deleteOrder(orderId: string): Promise<{ success?: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { error: "Не авторизован" }

  const clientDocId = await getClientDocId(userId)
  if (!clientDocId) return { error: "Клиент не найден" }

  const payload = await getPayloadClient()

  try {
    const doc = await payload.findByID({
      collection: "orders",
      id: orderId,
      depth: 0,
    })

    const docClient = typeof (doc as any).client === "object"
      ? (doc as any).client?.id
      : (doc as any).client
    if (String(docClient) !== String(clientDocId)) {
      return { error: "Нет доступа" }
    }

    await payload.delete({
      collection: "orders",
      id: orderId,
    })

    revalidatePath("/dashboard/orders")
    return { success: true }
  } catch {
    return { error: "Заказ не найден" }
  }
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
    id: orderId,
    depth: 1,
  })

  const oldStatus = (doc as any).status

  // Update via Payload
  await payload.update({
    collection: "orders",
    id: orderId,
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
    const adminDb = createAdminClient()
    await adminDb.from("notifications").insert({
      client_id: supabaseId,
      type: "order_update",
      title: "Обновление заказа",
      message: `Статус вашего заказа изменён: ${statusLabels[newStatus] || newStatus}`,
      data: { order_id: orderId },
    })

    // Send email notification about status change
    try {
      const { data: userData } = await adminDb.auth.admin.getUserById(supabaseId)
      if (userData?.user?.email) {
        const orderDisplayId = (doc as any).orderId || orderId
        await sendStatusEmail(
          userData.user.email,
          orderDisplayId,
          newStatus,
          statusLabels[newStatus] || newStatus
        )
      }
    } catch (emailErr) {
      console.error("Failed to send status email:", emailErr)
    }
  }

  revalidatePath("/admin/orders")
  return { success: true }
}

export async function sendPromoCodeEmail(email: string, code: string, discount: string, description?: string) {
  try {
    await smtpTransporter.sendMail({
      from: `"10coffee" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Промокод от 10coffee — скидка ${discount}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 16px">У вас промокод!</h2>
          <p style="color:#666;margin:0 0 24px">${description || "Используйте промокод при оформлении заказа в личном кабинете."}</p>
          <div style="background:#f5f5f5;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
            <p style="margin:0 0 8px;color:#999;font-size:13px">Ваш промокод</p>
            <p style="margin:0;font-weight:bold;font-size:28px;letter-spacing:3px;color:#5b328a">${code}</p>
            <p style="margin:8px 0 0;font-size:14px;font-weight:bold">Скидка ${discount}</p>
          </div>
          <p style="color:#999;font-size:12px;margin:0">Введите промокод при оформлении заказа на сайте.</p>
        </div>
      `,
    })
    return { success: true }
  } catch (err) {
    console.error("Failed to send promo email:", err)
    return { error: "Не удалось отправить письмо" }
  }
}
