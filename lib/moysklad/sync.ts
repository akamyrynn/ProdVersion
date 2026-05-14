import type { Payload } from "payload"
import { getMoyskladConfig, assertMoyskladReady } from "./config"
import { extractMoyskladId, moyskladGetList, moyskladMeta, moyskladRequest } from "./client"
import { writeMoyskladLog } from "./logs"
import type {
  MoyskladCounterparty,
  MoyskladCustomerOrder,
  MoyskladOrderPositionPayload,
} from "./types"
import type { CartItem, DeliveryMethod } from "@/types"

interface SyncClient {
  id?: string | number
  fullName?: string
  email?: string
  phone?: string | null
  moyskladCounterpartyId?: string | null
}

interface SyncCompany {
  name?: string
  inn?: string
  kpp?: string | null
  legalAddress?: string | null
}

interface SyncOrder {
  id: string | number
  orderId?: string
  subtotal?: number
  discountAmount?: number
  deliveryCost?: number
  total?: number
  deliveryMethod?: DeliveryMethod
  deliveryAddress?: string | null
  comment?: string | null
}

interface SyncOrderParams {
  payload: Payload
  order: SyncOrder
  client: SyncClient
  company?: SyncCompany | null
  cartItems: CartItem[]
}

function rubToKopecks(value: number) {
  return Math.round((Number(value) || 0) * 100)
}

function formatMoment(date = new Date()) {
  const pad = (value: number, size = 2) => String(value).padStart(size, "0")
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
    ".000",
  ].join("")
}

function buildCounterpartyPayload(client: SyncClient, company?: SyncCompany | null) {
  const name = company?.name || client.fullName || client.email || "Клиент 10coffee"
  const result: Record<string, unknown> = {
    name,
    email: client.email || undefined,
    phone: client.phone || undefined,
    description: "Создано автоматически с сайта 10coffee",
  }

  if (company?.inn) result.inn = company.inn
  if (company?.kpp) result.kpp = company.kpp
  if (company?.legalAddress) result.legalAddress = company.legalAddress

  return result
}

async function findCounterpartyByEmail(email: string) {
  const filter = `email=${email}`
  const result = await moyskladGetList<MoyskladCounterparty>("entity/counterparty", {
    filter,
    limit: 1,
  })
  return result.rows[0] || null
}

async function ensureCounterparty(payload: Payload, client: SyncClient, company?: SyncCompany | null) {
  const config = getMoyskladConfig()
  assertMoyskladReady(config)

  if (client.moyskladCounterpartyId) {
    return client.moyskladCounterpartyId
  }

  if (client.email) {
    const existing = await findCounterpartyByEmail(client.email)
    const existingId = extractMoyskladId(existing)
    if (existingId) {
      if (client.id) {
        await payload.update({
          collection: "clients",
          id: client.id,
          data: { moyskladCounterpartyId: existingId },
        })
      }
      return existingId
    }
  }

  if (!config.createCounterparties) {
    throw new Error("Контрагент не найден, а создание контрагентов отключено")
  }

  const created = await moyskladRequest<MoyskladCounterparty>("entity/counterparty", {
    method: "POST",
    body: JSON.stringify(buildCounterpartyPayload(client, company)),
  })
  const createdId = extractMoyskladId(created)
  if (!createdId) throw new Error("МойСклад не вернул id контрагента")

  if (client.id) {
    await payload.update({
      collection: "clients",
      id: client.id,
      data: { moyskladCounterpartyId: createdId },
    })
  }

  return createdId
}

function buildOrderDescription(order: SyncOrder, company?: SyncCompany | null) {
  const rows = [
    `Заказ сайта: ${order.orderId || order.id}`,
    company?.name ? `Компания: ${company.name}` : "",
    company?.inn ? `ИНН: ${company.inn}` : "",
    order.deliveryMethod ? `Доставка: ${order.deliveryMethod}` : "",
    order.deliveryAddress ? `Адрес: ${order.deliveryAddress}` : "",
    order.comment ? `Комментарий: ${order.comment}` : "",
  ].filter(Boolean)

  return rows.join("\n")
}

function resolveAssortment(item: CartItem) {
  const variant = item.variant as (CartItem["variant"] & {
    moysklad_id?: string | null
    moysklad_type?: "product" | "variant" | "service" | null
  }) | undefined
  const product = item.product as (CartItem["product"] & {
    moysklad_id?: string | null
  }) | undefined

  if (variant?.moysklad_id) {
    return {
      id: variant.moysklad_id,
      type: variant.moysklad_type || "variant",
    }
  }

  if (product?.moysklad_id) {
    return {
      id: product.moysklad_id,
      type: "product" as const,
    }
  }

  return null
}

function buildPositions(
  cartItems: CartItem[],
  discountAmount: number,
  subtotal: number,
  deliveryCost: number
) {
  const config = getMoyskladConfig()
  const discount = subtotal > 0 && discountAmount > 0
    ? Math.min(100, Math.round((discountAmount / subtotal) * 10000) / 100)
    : 0

  const skipped: CartItem[] = []
  const positions: MoyskladOrderPositionPayload[] = []

  for (const item of cartItems) {
    const assortment = resolveAssortment(item)
    if (!assortment) {
      skipped.push(item)
      continue
    }

    const position: MoyskladOrderPositionPayload = {
      quantity: item.quantity,
      price: rubToKopecks(item.variant?.price ?? 0),
      assortment: {
        meta: moyskladMeta(assortment.type, assortment.id),
      },
    }

    if (discount > 0) position.discount = discount
    if (config.defaultVat > 0) position.vat = config.defaultVat

    positions.push(position)
  }

  if (deliveryCost > 0) {
    if (!config.deliveryServiceId) {
      throw new Error("Для передачи доставки в МойСклад нужен MOYSKLAD_DELIVERY_SERVICE_ID")
    }

    const deliveryPosition: MoyskladOrderPositionPayload = {
      quantity: 1,
      price: rubToKopecks(deliveryCost),
      assortment: {
        meta: moyskladMeta("service", config.deliveryServiceId),
      },
    }

    if (config.defaultVat > 0) deliveryPosition.vat = config.defaultVat
    positions.push(deliveryPosition)
  }

  return { positions, skipped }
}

export async function syncOrderToMoysklad(params: SyncOrderParams) {
  const config = getMoyskladConfig()
  if (!config.enabled || !config.syncOrdersOnCreate) {
    return { skipped: true as const }
  }

  const orderId = params.order.id

  try {
    assertMoyskladReady(config)

    await params.payload.update({
      collection: "orders",
      id: orderId,
      data: {
        moyskladSyncStatus: "pending",
        moyskladSyncError: "",
      },
    })

    const counterpartyId = await ensureCounterparty(params.payload, params.client, params.company)
    const { positions, skipped } = buildPositions(
      params.cartItems,
      Number(params.order.discountAmount) || 0,
      Number(params.order.subtotal) || 0,
      Number(params.order.deliveryCost) || 0
    )

    if (skipped.length > 0) {
      const names = skipped.map((item) => `${item.product?.name || item.product_id} / ${item.variant?.name || item.variant_id}`)
      throw new Error(`Не заполнен moyskladId у позиций: ${names.join(", ")}`)
    }

    if (positions.length === 0) {
      throw new Error("Нет позиций для отправки в МойСклад")
    }

    const body: Record<string, unknown> = {
      name: params.order.orderId || String(orderId),
      externalCode: String(orderId),
      moment: formatMoment(),
      applicable: true,
      vatEnabled: config.vatEnabled,
      vatIncluded: config.vatIncluded,
      organization: {
        meta: moyskladMeta("organization", config.organizationId!),
      },
      agent: {
        meta: moyskladMeta("counterparty", counterpartyId),
      },
      positions,
      description: buildOrderDescription(params.order, params.company),
    }

    if (config.storeId) {
      body.store = { meta: moyskladMeta("store", config.storeId) }
    }

    if (config.defaultOrderStateId) {
      body.state = { meta: moyskladMeta("state", config.defaultOrderStateId) }
    }

    const created = await moyskladRequest<MoyskladCustomerOrder>("entity/customerorder", {
      method: "POST",
      body: JSON.stringify(body),
    })
    const moyskladOrderId = extractMoyskladId(created)

    await params.payload.update({
      collection: "orders",
      id: orderId,
      data: {
        moyskladCustomerOrderId: moyskladOrderId,
        moyskladSyncStatus: "synced",
        moyskladSyncError: "",
        moyskladSyncedAt: new Date().toISOString(),
      },
    })

    await writeMoyskladLog({
      entityType: "order",
      localId: orderId,
      moyskladId: moyskladOrderId,
      direction: "site_to_moysklad",
      status: "success",
      payload: body,
      response: created,
    })

    return { success: true as const, moyskladOrderId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка синхронизации с МойСклад"

    await params.payload.update({
      collection: "orders",
      id: orderId,
      data: {
        moyskladSyncStatus: "error",
        moyskladSyncError: message,
      },
    })

    await writeMoyskladLog({
      entityType: "order",
      localId: orderId,
      direction: "site_to_moysklad",
      status: "error",
      message,
    })

    console.error("[MoySklad] order sync failed:", message)
    return { error: message }
  }
}
