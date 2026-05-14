import type { Payload } from "payload"
import { getMoyskladConfig } from "./config"
import { moyskladRequest } from "./client"
import { writeMoyskladLog } from "./logs"
import type { MoyskladCustomerOrder } from "./types"
import type { OrderStatus } from "@/types"

type PaymentStatus = "pending" | "invoiced" | "partial" | "paid" | "refunded"

interface PayloadOrderForStatus {
  id: string | number
  orderId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  moyskladCustomerOrderId?: string | null
}

interface SyncOrderStatusOptions {
  limit?: number
}

interface SyncedOrderStatus {
  id: string | number
  orderId?: string
  moyskladCustomerOrderId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  moyskladState?: string | null
}

function normalizeStateName(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/ё/g, "е")
}

export function mapMoyskladStateToOrderStatus(stateName?: string | null): OrderStatus {
  const state = normalizeStateName(stateName)

  if (!state) return "new"
  if (state.includes("отмен")) return "cancelled"
  if (state.includes("достав")) return "delivered"
  if (state.includes("отгруж")) return "shipped"
  if (state.includes("готов")) return "ready"
  if (state.includes("производ")) return "in_production"
  if (state.includes("оплачен")) return "paid"
  if (state.includes("счет") || state.includes("счёт")) return "invoiced"
  if (state.includes("подтверж")) return "confirmed"

  return "new"
}

function mapMoyskladPaymentStatus(order: MoyskladCustomerOrder, status: OrderStatus): PaymentStatus {
  const sum = Number(order.sum) || 0
  const payedSum = Number(order.payedSum) || 0

  if (sum > 0 && payedSum >= sum) return "paid"
  if (payedSum > 0) return "partial"
  if (status === "invoiced") return "invoiced"

  return "pending"
}

async function fetchMoyskladOrder(id: string) {
  return moyskladRequest<MoyskladCustomerOrder>(`entity/customerorder/${id}?expand=state`)
}

export async function syncMoyskladOrderStatuses(
  payload: Payload,
  options: SyncOrderStatusOptions = {}
) {
  const config = getMoyskladConfig()
  if (!config.enabled) {
    return { ok: false as const, error: "MOYSKLAD_ENABLED не включен" }
  }

  const limit = options.limit || 200
  const result = await payload.find({
    collection: "orders",
    sort: "-createdAt",
    limit,
    depth: 0,
  })

  const orders = (result.docs as PayloadOrderForStatus[])
    .filter((order) => Boolean(order.moyskladCustomerOrderId))

  const synced: SyncedOrderStatus[] = []
  const errors: { id: string | number; orderId?: string; error: string }[] = []

  for (const order of orders) {
    const moyskladCustomerOrderId = order.moyskladCustomerOrderId
    if (!moyskladCustomerOrderId) continue

    try {
      const moyskladOrder = await fetchMoyskladOrder(moyskladCustomerOrderId)
      const nextStatus = mapMoyskladStateToOrderStatus(moyskladOrder.state?.name)
      const nextPaymentStatus = mapMoyskladPaymentStatus(moyskladOrder, nextStatus)

      await payload.update({
        collection: "orders",
        id: order.id,
        data: {
          status: nextStatus,
          paymentStatus: nextPaymentStatus,
          moyskladSyncStatus: "synced",
          moyskladSyncError: "",
          moyskladSyncedAt: new Date().toISOString(),
        },
      })

      synced.push({
        id: order.id,
        orderId: order.orderId,
        moyskladCustomerOrderId,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        moyskladState: moyskladOrder.state?.name || null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось синхронизировать статус заказа"
      errors.push({ id: order.id, orderId: order.orderId, error: message })

      await payload.update({
        collection: "orders",
        id: order.id,
        data: {
          moyskladSyncStatus: "error",
          moyskladSyncError: message,
        },
      })

      await writeMoyskladLog({
        entityType: "order_status",
        localId: order.id,
        moyskladId: moyskladCustomerOrderId,
        direction: "moysklad_to_site",
        status: "error",
        message,
      })
    }
  }

  if (synced.length > 0) {
    await writeMoyskladLog({
      entityType: "order_status",
      direction: "moysklad_to_site",
      status: "success",
      message: `Синхронизировано статусов заказов: ${synced.length}`,
      response: synced,
    })
  }

  return {
    ok: errors.length === 0,
    checked: orders.length,
    synced: synced.length,
    errors,
    orders: synced,
  }
}
