import { getMoyskladConfig } from "./config"
import { extractMoyskladId, moyskladGetList, moyskladMeta, moyskladRequest } from "./client"
import type { MoyskladEntity, MoyskladProductFolder } from "./types"

const SERVICE_FOLDER_NAME = "Служебное"
const DELIVERY_SERVICE_NAME = "[Служебная] Доставка сайта 10coffee"
const DELIVERY_SERVICE_DESCRIPTION = "Служебная позиция для передачи стоимости доставки из заказов сайта 10coffee. Не является товаром каталога."

interface MoyskladService extends MoyskladEntity {
  description?: string
  productFolder?: MoyskladEntity
}

async function findProductFolderByName(name: string) {
  const result = await moyskladGetList<MoyskladProductFolder>("entity/productfolder", {
    filter: `name=${name}`,
    limit: 100,
  })

  return result.rows.find((folder) => folder.name === name) || null
}

async function ensureServiceFolder() {
  const existing = await findProductFolderByName(SERVICE_FOLDER_NAME)
  const existingId = extractMoyskladId(existing)
  if (existing && existingId) {
    return { id: existingId, created: false }
  }

  const created = await moyskladRequest<MoyskladProductFolder>("entity/productfolder", {
    method: "POST",
    body: JSON.stringify({
      name: SERVICE_FOLDER_NAME,
      description: "Служебные позиции сайта 10coffee",
    }),
  })

  const createdId = extractMoyskladId(created)
  if (!createdId) throw new Error("МойСклад не вернул id служебной группы")

  return { id: createdId, created: true }
}

export async function setupMoyskladDeliveryService() {
  const config = getMoyskladConfig()
  if (!config.enabled) {
    return { ok: false as const, error: "MOYSKLAD_ENABLED не включен" }
  }

  if (!config.deliveryServiceId) {
    return { ok: false as const, error: "MOYSKLAD_DELIVERY_SERVICE_ID не заполнен" }
  }

  const folder = await ensureServiceFolder()
  const current = await moyskladRequest<MoyskladService>(`entity/service/${config.deliveryServiceId}`)
  const currentId = extractMoyskladId(current)
  if (!currentId) throw new Error("Не удалось получить службу доставки в МойСклад")

  try {
    const updated = await moyskladRequest<MoyskladService>(`entity/service/${currentId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: DELIVERY_SERVICE_NAME,
        description: DELIVERY_SERVICE_DESCRIPTION,
        productFolder: {
          meta: moyskladMeta("productfolder", folder.id),
        },
      }),
    })

    return {
      ok: true as const,
      serviceId: currentId,
      serviceName: updated.name,
      folderId: folder.id,
      folderCreated: folder.created,
      folderAssigned: true,
    }
  } catch (error) {
    const updated = await moyskladRequest<MoyskladService>(`entity/service/${currentId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: DELIVERY_SERVICE_NAME,
        description: DELIVERY_SERVICE_DESCRIPTION,
      }),
    })

    return {
      ok: true as const,
      serviceId: currentId,
      serviceName: updated.name,
      folderId: folder.id,
      folderCreated: folder.created,
      folderAssigned: false,
      warning: error instanceof Error ? error.message : "МойСклад не принял productFolder у услуги",
    }
  }
}
