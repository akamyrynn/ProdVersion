import type { Payload } from "payload"
import { dbQuery } from "@/lib/db"
import { getMoyskladConfig, assertMoyskladReady } from "./config"
import { extractMoyskladId, moyskladGetList, moyskladMeta, moyskladRequest } from "./client"
import { writeMoyskladLog } from "./logs"
import type {
  MoyskladCounterparty,
  MoyskladCustomerOrder,
  MoyskladInvoiceOut,
  MoyskladOrderPositionPayload,
  MoyskladSalesChannel,
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
  id?: string
  name?: string
  inn?: string
  kpp?: string | null
  ogrn?: string | null
  legalAddress?: string | null
  actualAddress?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  moyskladCounterpartyId?: string | null
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
  discountLines?: MoyskladDiscountLine[]
}

interface MoyskladDiscountLine {
  cartItemId: string
  discountPercent: number
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

async function ensureB2bMoyskladSchema() {
  await dbQuery(`
    alter table public.companies
      add column if not exists moysklad_counterparty_id text;
    create index if not exists companies_moysklad_counterparty_id_idx
      on public.companies(moysklad_counterparty_id);
    alter table public.orders
      add column if not exists moysklad_counterparty_id varchar,
      add column if not exists moysklad_invoice_out_id varchar;
    create index if not exists orders_moysklad_counterparty_id_idx
      on public.orders(moysklad_counterparty_id);
    create index if not exists orders_moysklad_invoice_out_id_idx
      on public.orders(moysklad_invoice_out_id);
  `)
}

function buildCounterpartyPayload(client: SyncClient, company?: SyncCompany | null) {
  const name = company?.name || client.fullName || client.email || "Клиент 10coffee"
  const result: Record<string, unknown> = {
    name,
    email: company?.contactEmail || client.email || undefined,
    phone: company?.contactPhone || client.phone || undefined,
    description: "Создано автоматически с сайта 10coffee",
  }

  if (company?.inn) result.inn = company.inn
  if (company?.kpp) result.kpp = company.kpp
  if (company?.ogrn) result.ogrn = company.ogrn
  if (company?.legalAddress) result.legalAddress = company.legalAddress
  if (company?.actualAddress) result.actualAddress = company.actualAddress
  if (company?.name) result.legalTitle = company.name

  return result
}

async function updateCompanyCounterpartyId(companyId: string | undefined, counterpartyId: string) {
  if (!companyId) return
  await ensureB2bMoyskladSchema()
  await dbQuery(
    "update public.companies set moysklad_counterparty_id = $1, updated_at = now() where id = $2",
    [counterpartyId, companyId]
  )
}

async function clearCompanyCounterpartyId(companyId: string | undefined) {
  if (!companyId) return
  await ensureB2bMoyskladSchema()
  await dbQuery(
    "update public.companies set moysklad_counterparty_id = null, updated_at = now() where id = $1",
    [companyId]
  )
}

function normalizeInn(value?: string | null) {
  return (value || "").trim()
}

async function findCounterpartyByEmail(email: string) {
  const filter = `email=${email}`
  const result = await moyskladGetList<MoyskladCounterparty>("entity/counterparty", {
    filter,
    limit: 1,
  })
  return result.rows[0] || null
}

async function findCounterpartyByInn(inn: string) {
  const filter = `inn=${inn}`
  const result = await moyskladGetList<MoyskladCounterparty>("entity/counterparty", {
    filter,
    limit: 1,
  })
  return result.rows[0] || null
}

async function findCounterpartyById(id: string) {
  return moyskladRequest<MoyskladCounterparty>(`entity/counterparty/${id}`)
}

async function ensureCounterparty(payload: Payload, client: SyncClient, company?: SyncCompany | null) {
  const config = getMoyskladConfig()
  assertMoyskladReady(config)

  if (company) {
    if (company.moyskladCounterpartyId) {
      const linkedCounterparty = await findCounterpartyById(company.moyskladCounterpartyId).catch(() => null)
      const linkedInn = normalizeInn(linkedCounterparty?.inn)
      const companyInn = normalizeInn(company.inn)

      if (!companyInn || linkedInn === companyInn) {
        return company.moyskladCounterpartyId
      }

      await clearCompanyCounterpartyId(company.id)
    }

    if (company.inn) {
      const existing = await findCounterpartyByInn(company.inn)
      const existingId = extractMoyskladId(existing)
      if (existingId) {
        await updateCompanyCounterpartyId(company.id, existingId)
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

    await updateCompanyCounterpartyId(company.id, createdId)
    return createdId
  }

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

async function findSalesChannelByName(name: string) {
  const result = await moyskladGetList<MoyskladSalesChannel>("entity/saleschannel", {
    filter: `name=${name}`,
    limit: 1,
  })
  return result.rows[0] || null
}

async function ensureSalesChannel() {
  const config = getMoyskladConfig()
  if (config.salesChannelId) return config.salesChannelId
  if (!config.salesChannelName) return null

  const existing = await findSalesChannelByName(config.salesChannelName)
  const existingId = extractMoyskladId(existing)
  if (existingId) return existingId

  if (!config.createSalesChannel) return null

  const created = await moyskladRequest<MoyskladSalesChannel>("entity/saleschannel", {
    method: "POST",
    body: JSON.stringify({
      name: config.salesChannelName,
      type: "ECOMMERCE",
      description: "Автоматически создано для заказов сайта 10coffee",
    }),
  })

  return extractMoyskladId(created)
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
  deliveryCost: number,
  discountLines: MoyskladDiscountLine[] = []
) {
  const config = getMoyskladConfig()
  const discountByItem = new Map(
    discountLines.map((line) => [
      line.cartItemId,
      Math.max(0, Math.min(100, Math.round(line.discountPercent))),
    ])
  )

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

    const discount = discountByItem.get(item.id) || 0
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

function buildDocumentRefs(params: {
  counterpartyId: string
  positions: MoyskladOrderPositionPayload[]
  description: string
  shipmentAddress?: string | null
  salesChannelId?: string | null
}) {
  const config = getMoyskladConfig()
  const body: Record<string, unknown> = {
    moment: formatMoment(),
    applicable: true,
    vatEnabled: config.vatEnabled,
    vatIncluded: config.vatIncluded,
    organization: {
      meta: moyskladMeta("organization", config.organizationId!),
    },
    agent: {
      meta: moyskladMeta("counterparty", params.counterpartyId),
    },
    positions: params.positions,
    description: params.description,
  }

  if (config.storeId) body.store = { meta: moyskladMeta("store", config.storeId) }
  if (config.projectId) body.project = { meta: moyskladMeta("project", config.projectId) }
  if (config.contractId) body.contract = { meta: moyskladMeta("contract", config.contractId) }
  if (params.salesChannelId) body.salesChannel = { meta: moyskladMeta("saleschannel", params.salesChannelId) }
  if (params.shipmentAddress) body.shipmentAddress = params.shipmentAddress

  return body
}

async function createInvoiceOut(params: {
  order: SyncOrder
  counterpartyId: string
  moyskladOrderId: string
  positions: MoyskladOrderPositionPayload[]
  description: string
  shipmentAddress?: string | null
  salesChannelId?: string | null
}) {
  const invoiceBody = {
    ...buildDocumentRefs({
      counterpartyId: params.counterpartyId,
      positions: params.positions,
      description: params.description,
      shipmentAddress: params.shipmentAddress,
      salesChannelId: params.salesChannelId,
    }),
    externalCode: `${params.order.orderId || params.order.id}-invoice`,
    customerOrder: {
      meta: moyskladMeta("customerorder", params.moyskladOrderId),
    },
  }

  const created = await moyskladRequest<MoyskladInvoiceOut>("entity/invoiceout", {
    method: "POST",
    body: JSON.stringify(invoiceBody),
  })

  return {
    invoice: created,
    invoiceId: extractMoyskladId(created),
    payload: invoiceBody,
  }
}

export async function syncOrderToMoysklad(params: SyncOrderParams) {
  const config = getMoyskladConfig()
  if (!config.enabled || !config.syncOrdersOnCreate) {
    return { skipped: true as const }
  }

  const orderId = params.order.id
  let counterpartyIdForUpdate: string | null = null
  let moyskladOrderIdForUpdate: string | null = null
  let moyskladInvoiceOutIdForUpdate: string | null = null

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

    await ensureB2bMoyskladSchema()

    const counterpartyId = await ensureCounterparty(params.payload, params.client, params.company)
    counterpartyIdForUpdate = counterpartyId
    const salesChannelId = await ensureSalesChannel()
    const { positions, skipped } = buildPositions(
      params.cartItems,
      Number(params.order.deliveryCost) || 0,
      params.discountLines || []
    )

    if (skipped.length > 0) {
      const names = skipped.map((item) => `${item.product?.name || item.product_id} / ${item.variant?.name || item.variant_id}`)
      throw new Error(`Не заполнен moyskladId у позиций: ${names.join(", ")}`)
    }

    if (positions.length === 0) {
      throw new Error("Нет позиций для отправки в МойСклад")
    }

    const description = buildOrderDescription(params.order, params.company)
    const body: Record<string, unknown> = {
      ...buildDocumentRefs({
        counterpartyId,
        positions,
        description,
        shipmentAddress: params.order.deliveryAddress,
        salesChannelId,
      }),
      name: params.order.orderId || String(orderId),
      externalCode: String(orderId),
    }

    if (config.defaultOrderStateId) {
      body.state = { meta: moyskladMeta("state", config.defaultOrderStateId) }
    }

    const created = await moyskladRequest<MoyskladCustomerOrder>("entity/customerorder", {
      method: "POST",
      body: JSON.stringify(body),
    })
    const moyskladOrderId = extractMoyskladId(created)
    moyskladOrderIdForUpdate = moyskladOrderId

    await writeMoyskladLog({
      entityType: "order",
      localId: orderId,
      moyskladId: moyskladOrderId,
      direction: "site_to_moysklad",
      status: "success",
      payload: body,
      response: created,
    })

    let moyskladInvoiceOutId: string | null = null
    let invoiceResponse: MoyskladInvoiceOut | null = null
    let invoicePayload: Record<string, unknown> | null = null

    if (config.createInvoiceOnOrder && moyskladOrderId) {
      const invoiceResult = await createInvoiceOut({
        order: params.order,
        counterpartyId,
        moyskladOrderId,
        positions,
        description,
        shipmentAddress: params.order.deliveryAddress,
        salesChannelId,
      })
      moyskladInvoiceOutId = invoiceResult.invoiceId
      moyskladInvoiceOutIdForUpdate = moyskladInvoiceOutId
      invoiceResponse = invoiceResult.invoice
      invoicePayload = invoiceResult.payload
    }

    const updateData: Record<string, unknown> = {
      moyskladCounterpartyId: counterpartyId,
      moyskladCustomerOrderId: moyskladOrderId,
      moyskladInvoiceOutId,
      moyskladSyncStatus: "synced",
      moyskladSyncError: "",
      moyskladSyncedAt: new Date().toISOString(),
    }
    if (moyskladInvoiceOutId) {
      updateData.paymentStatus = "invoiced"
    }

    await params.payload.update({
      collection: "orders",
      id: orderId,
      data: updateData,
    })

    if (moyskladInvoiceOutId) {
      await writeMoyskladLog({
        entityType: "invoice",
        localId: orderId,
        moyskladId: moyskladInvoiceOutId,
        direction: "site_to_moysklad",
        status: "success",
        payload: invoicePayload || undefined,
        response: invoiceResponse || undefined,
      })
    }

    return { success: true as const, moyskladOrderId, moyskladInvoiceOutId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка синхронизации с МойСклад"

    const errorData: Record<string, unknown> = {
      moyskladSyncStatus: "error",
      moyskladSyncError: message,
    }
    if (counterpartyIdForUpdate) errorData.moyskladCounterpartyId = counterpartyIdForUpdate
    if (moyskladOrderIdForUpdate) errorData.moyskladCustomerOrderId = moyskladOrderIdForUpdate
    if (moyskladInvoiceOutIdForUpdate) errorData.moyskladInvoiceOutId = moyskladInvoiceOutIdForUpdate

    await params.payload.update({
      collection: "orders",
      id: orderId,
      data: errorData,
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
