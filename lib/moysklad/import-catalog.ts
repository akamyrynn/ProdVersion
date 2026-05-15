import type { Payload } from "payload"
import { extractMoyskladId } from "./client"
import { getMoyskladConfig } from "./config"
import {
  fetchMoyskladAssortment,
  fetchMoyskladProductFolders,
  fetchMoyskladProducts,
  fetchMoyskladVariants,
  getPrimarySalePrice,
} from "./products"
import type {
  MoyskladAssortment,
  MoyskladProduct,
  MoyskladProductFolder,
  MoyskladVariant,
} from "./types"
import type { ProductDetailsSchema } from "@/types"

type Id = string | number

interface PayloadProductTypeDoc {
  id: Id
  name?: string
  slug?: string
  moyskladId?: string | null
  sortOrder?: number | null
}

interface PayloadCategoryDoc {
  id: Id
  name?: string
  slug?: string
  moyskladId?: string | null
  sortOrder?: number | null
}

interface PayloadProductDoc {
  id: Id
  name?: string
  slug?: string
  moyskladId?: string | null
  detailsSchema?: ProductDetailsSchema
  sortOrder?: number | null
}

interface ImportStats {
  productTypesCreated: number
  productTypesUpdated: number
  categoriesCreated: number
  categoriesUpdated: number
  productsCreated: number
  productsUpdated: number
  variantsImported: number
  skippedProducts: string[]
}

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
 ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
}

function slugify(value: string, fallback = "item") {
  const transliterated = value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join("")

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || fallback
}

function shortId(id?: string | null) {
  return id ? id.split("-")[0] : Math.random().toString(36).slice(2, 8)
}

function schemaForName(name: string): ProductDetailsSchema {
  const lower = name.toLowerCase()
  if (lower.includes("кофе") || lower.includes("эспрессо") || lower.includes("дрип")) return "coffee"
  if (lower.includes("чай")) return "tea"
  return "generic"
}

function getPinnedProductTypeSortOrder(name: string, slug: string) {
  const normalized = `${name} ${slug}`.toLowerCase()
  if (normalized.includes("кофе") || normalized.includes("coffee")) return 1
  if (normalized.includes("чай") || normalized.includes("tea")) return 2
  if (
    normalized.includes("аксессуар") ||
    normalized.includes("аксесуар") ||
    normalized.includes("accessor")
  ) {
    return 3
  }
  return null
}

function getFolderRootName(folder: MoyskladProductFolder) {
  const pathName = folder.pathName?.trim()
  if (!pathName) return folder.name || "Каталог"
  return pathName.split(/\s*\/\s*|\s*>\s*/)[0] || folder.name || "Каталог"
}

function getFolderFullName(folder: MoyskladProductFolder) {
  return folder.pathName ? `${folder.pathName}/${folder.name}` : folder.name || ""
}

function inferWeightGrams(name: string) {
  const kg = name.match(/(\d+(?:[.,]\d+)?)\s*кг/i)
  if (kg) return Math.round(Number(kg[1].replace(",", ".")) * 1000)

  const grams = name.match(/(\d+(?:[.,]\d+)?)\s*(?:г|гр|g)\b/i)
  if (grams) return Math.round(Number(grams[1].replace(",", ".")))

  return null
}

function inferGrindOptions(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("молот")) return ["ground"]
  if (lower.includes("зерн")) return ["beans"]
  return []
}

function cleanVariantName(productName: string, variantName: string) {
  return variantName
    .replace(productName, "")
    .replace(/[()]/g, "")
    .replace(/^\s*[-–—,:]\s*/, "")
    .trim() || variantName
}

async function fetchAll<T>(
  fetcher: (limit: number, offset: number) => Promise<{ rows: T[]; meta: { size: number } }>,
  maxItems = 5000
) {
  const limit = 100
  const rows: T[] = []

  for (let offset = 0; offset < maxItems; offset += limit) {
    const batch = await fetcher(limit, offset)
    rows.push(...batch.rows)
    if (batch.rows.length < limit || rows.length >= batch.meta.size) break
  }

  return rows
}

async function findByMoyskladId<T extends { id: Id }>(
  payload: Payload,
  collection: "product-types" | "categories" | "products",
  moyskladId: string
) {
  const result = await payload.find({
    collection,
    where: { moyskladId: { equals: moyskladId } },
    limit: 1,
    depth: 0,
  })
  return (result.docs[0] as T | undefined) || null
}

async function findBySlug<T extends { id: Id }>(
  payload: Payload,
  collection: "product-types" | "categories" | "products",
  slug: string
) {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return (result.docs[0] as T | undefined) || null
}

async function getNextProductTypeSortOrder(payload: Payload) {
  const result = await payload.find({
    collection: "product-types",
    limit: 200,
    depth: 0,
  })
  const used = new Set(
    (result.docs as PayloadProductTypeDoc[])
      .map((doc) => Number(doc.sortOrder))
      .filter((value) => Number.isFinite(value) && value >= 4)
  )

  for (let order = 4; order < 1000; order += 1) {
    if (!used.has(order)) return order
  }

  return used.size + 4
}

async function upsertProductType(
  payload: Payload,
  folder: MoyskladProductFolder,
  rootName: string,
  stats: ImportStats
) {
  const moyskladId = folder.id || extractMoyskladId(folder)
  const slug = slugify(rootName, `type-${shortId(moyskladId)}`)
  const data = {
    name: rootName,
    slug,
    moyskladId,
    detailsSchema: schemaForName(rootName),
    isVisible: true,
  }

  const existing = moyskladId
    ? await findByMoyskladId<PayloadProductTypeDoc>(payload, "product-types", moyskladId)
    : await findBySlug<PayloadProductTypeDoc>(payload, "product-types", slug)

  if (existing) {
    const updated = await payload.update({
      collection: "product-types",
      id: existing.id,
      data,
    })
    stats.productTypesUpdated += 1
    return updated as PayloadProductTypeDoc
  }

  const pinnedSortOrder = getPinnedProductTypeSortOrder(rootName, slug)
  const created = await payload.create({
    collection: "product-types",
    data: {
      ...data,
      sortOrder: pinnedSortOrder ?? (await getNextProductTypeSortOrder(payload)),
    },
  })
  stats.productTypesCreated += 1
  return created as PayloadProductTypeDoc
}

async function upsertCategory(params: {
  payload: Payload
  folder: MoyskladProductFolder
  productType: PayloadProductTypeDoc
  parent?: PayloadCategoryDoc | null
  stats: ImportStats
}) {
  const moyskladId = params.folder.id || extractMoyskladId(params.folder)
  const baseSlug = slugify(
    `${params.productType.slug || params.productType.name}-${params.folder.name}`,
    `category-${shortId(moyskladId)}`
  )
  const data = {
    name: params.folder.name || "Категория",
    slug: baseSlug,
    moyskladId,
    productTypeRef: params.productType.id,
    parent: params.parent?.id || null,
    isVisible: true,
  }

  const existing = moyskladId
    ? await findByMoyskladId<PayloadCategoryDoc>(params.payload, "categories", moyskladId)
    : await findBySlug<PayloadCategoryDoc>(params.payload, "categories", baseSlug)

  if (existing) {
    const updated = await params.payload.update({
      collection: "categories",
      id: existing.id,
      data,
    })
    params.stats.categoriesUpdated += 1
    return updated as PayloadCategoryDoc
  }

  const created = await params.payload.create({
    collection: "categories",
    data: {
      ...data,
      sortOrder: 0,
    },
  })
  params.stats.categoriesCreated += 1
  return created as PayloadCategoryDoc
}

function variantPayloadFromMoysklad(item: MoyskladVariant | MoyskladProduct, productName: string) {
  const moyskladId = item.id || extractMoyskladId(item)
  const name = item.meta?.type === "variant"
    ? cleanVariantName(productName, item.name || "Вариант")
    : "1 шт"

  return {
    name,
    sku: item.article || item.code || null,
    moyskladId,
    moyskladType: item.meta?.type === "variant" ? "variant" : "product",
    price: getPrimarySalePrice(item),
    weightGrams: inferWeightGrams(item.name || name),
    isAvailable: typeof item.stock === "number" ? item.stock > 0 : true,
    grindOptions: inferGrindOptions(item.name || ""),
  }
}

async function upsertProduct(params: {
  payload: Payload
  product: MoyskladProduct
  variants: MoyskladVariant[]
  assortmentById: Map<string, MoyskladAssortment>
  category: PayloadCategoryDoc
  productType: PayloadProductTypeDoc
  stats: ImportStats
}) {
  const productId = params.product.id || extractMoyskladId(params.product)
  if (!productId) {
    params.stats.skippedProducts.push(params.product.name || "Товар без id")
    return null
  }

  const assortmentProduct = params.assortmentById.get(productId) || params.product
  const variantItems = params.variants.length > 0
    ? params.variants.map((variant) => params.assortmentById.get(variant.id || "") || variant)
    : [assortmentProduct]

  const variants = variantItems.map((item) => variantPayloadFromMoysklad(item, params.product.name || "Товар"))
  const slug = slugify(params.product.name || "product", `product-${shortId(productId)}`)
  const detailsSchema = schemaForName(`${params.productType.name || ""} ${params.product.name || ""}`)
  const accountingData = {
    name: params.product.name || "Товар",
    slug,
    moyskladId: productId,
    productTypeRef: params.productType.id,
    category: params.category.id,
    isVisible: !params.product.archived,
    variants,
  }

  const existing = await findByMoyskladId<PayloadProductDoc>(params.payload, "products", productId)
  if (existing) {
    const updated = await params.payload.update({
      collection: "products",
      id: existing.id,
      data: accountingData,
    })
    params.stats.productsUpdated += 1
    params.stats.variantsImported += variants.length
    return updated
  }

  const bySlug = await findBySlug<PayloadProductDoc>(params.payload, "products", slug)
  if (bySlug) {
    const updated = await params.payload.update({
      collection: "products",
      id: bySlug.id,
      data: {
        ...accountingData,
        moyskladId: productId,
      },
    })
    params.stats.productsUpdated += 1
    params.stats.variantsImported += variants.length
    return updated
  }

  const created = await params.payload.create({
    collection: "products",
    data: {
      ...accountingData,
      detailsSchema,
      sortOrder: 0,
    },
  })
  params.stats.productsCreated += 1
  params.stats.variantsImported += variants.length
  return created
}

export async function importMoyskladCatalog(payload: Payload) {
  const config = getMoyskladConfig()
  if (!config.enabled) {
    return { ok: false as const, error: "MOYSKLAD_ENABLED не включен" }
  }

  const stats: ImportStats = {
    productTypesCreated: 0,
    productTypesUpdated: 0,
    categoriesCreated: 0,
    categoriesUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    variantsImported: 0,
    skippedProducts: [],
  }

  const [folders, products, variants, assortment] = await Promise.all([
    fetchAll(fetchMoyskladProductFolders),
    fetchAll(fetchMoyskladProducts),
    fetchAll(fetchMoyskladVariants),
    fetchAll(fetchMoyskladAssortment),
  ])

  const activeFolders = folders.filter((folder) => !folder.archived && folder.name)
  const folderById = new Map(activeFolders.map((folder) => [folder.id || extractMoyskladId(folder), folder]))
  const folderByFullName = new Map(activeFolders.map((folder) => [getFolderFullName(folder), folder]))
  const rootFolders = activeFolders.filter((folder) => !folder.pathName)
  const rootTypeByName = new Map<string, PayloadProductTypeDoc>()
  const categoryByFolderId = new Map<string, PayloadCategoryDoc>()

  for (const root of rootFolders) {
    const rootName = root.name || "Каталог"
    const type = await upsertProductType(payload, root, rootName, stats)
    rootTypeByName.set(rootName, type)
  }

  for (const folder of activeFolders) {
    const folderId = folder.id || extractMoyskladId(folder)
    if (!folderId) continue

    const rootName = getFolderRootName(folder)
    let productType = rootTypeByName.get(rootName)
    if (!productType) {
      productType = await upsertProductType(payload, folder, rootName, stats)
      rootTypeByName.set(rootName, productType)
    }

    let parent: PayloadCategoryDoc | null = null
    if (folder.pathName) {
      const parentPath = folder.pathName
      const parentFolder = folderByFullName.get(parentPath)
      const parentId = parentFolder?.id || extractMoyskladId(parentFolder)
      if (parentId) parent = categoryByFolderId.get(parentId) || null
    }

    const category = await upsertCategory({
      payload,
      folder,
      productType,
      parent,
      stats,
    })
    categoryByFolderId.set(folderId, category)
  }

  const assortmentById = new Map(
    assortment
      .map((item) => [item.id || extractMoyskladId(item), item] as const)
      .filter(([id]) => Boolean(id))
  ) as Map<string, MoyskladAssortment>

  const variantsByProductId = new Map<string, MoyskladVariant[]>()
  for (const variant of variants.filter((item) => !item.archived)) {
    const productId = extractMoyskladId(variant.product)
    if (!productId) continue
    const rows = variantsByProductId.get(productId) || []
    rows.push(variant)
    variantsByProductId.set(productId, rows)
  }

  const fallbackRoot = rootFolders[0]
  let fallbackType: PayloadProductTypeDoc | undefined
  let fallbackCategory: PayloadCategoryDoc | undefined

  for (const product of products.filter((item) => !item.archived)) {
    const productFolderId = extractMoyskladId(product.productFolder)
    const folder = productFolderId ? folderById.get(productFolderId) : null

    let productType: PayloadProductTypeDoc | undefined
    let category: PayloadCategoryDoc | undefined

    if (folder) {
      productType = rootTypeByName.get(getFolderRootName(folder))
      category = productFolderId ? categoryByFolderId.get(productFolderId) : undefined
    }

    if (!productType || !category) {
      if (!fallbackRoot) {
        stats.skippedProducts.push(`${product.name || product.id}: нет категории`)
        continue
      }

      fallbackType ||= rootTypeByName.get(fallbackRoot.name || "Каталог")
      const fallbackRootId = fallbackRoot.id || extractMoyskladId(fallbackRoot)
      fallbackCategory ||= fallbackRootId ? categoryByFolderId.get(fallbackRootId) : undefined
    }

    await upsertProduct({
      payload,
      product,
      variants: variantsByProductId.get(product.id || "") || [],
      assortmentById,
      productType: productType || fallbackType!,
      category: category || fallbackCategory!,
      stats,
    })
  }

  return {
    ok: true as const,
    stats,
  }
}
