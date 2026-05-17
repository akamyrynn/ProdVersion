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
  categoriesHidden: number
  productsCreated: number
  productsUpdated: number
  productsHidden: number
  variantsImported: number
  variantsHidden: number
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

function getFolderDepth(folder: MoyskladProductFolder) {
  const fullName = getFolderFullName(folder)
  if (!fullName) return 0
  return fullName.split(/\s*\/\s*|\s*>\s*/).filter(Boolean).length - 1
}

function getFolderId(folder?: MoyskladProductFolder | null) {
  return folder?.id || extractMoyskladId(folder)
}

function getEntityId(entity?: MoyskladAssortment | MoyskladProduct | MoyskladVariant | null) {
  return entity?.id || extractMoyskladId(entity)
}

function getAssortmentStock(item?: MoyskladAssortment | MoyskladProduct | MoyskladVariant | null) {
  const stock = Number(item?.stock ?? 0)
  return Number.isFinite(stock) ? stock : 0
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

async function hideObsoleteCategories(
  payload: Payload,
  activeCategoryFolderIds: Set<string>,
  stats: ImportStats
) {
  const result = await payload.find({
    collection: "categories",
    where: { isVisible: { equals: true } },
    limit: 500,
    depth: 0,
  })

  for (const category of result.docs as PayloadCategoryDoc[]) {
    if (!category.moyskladId) continue
    if (activeCategoryFolderIds.has(category.moyskladId)) continue

    await payload.update({
      collection: "categories",
      id: category.id,
      data: { isVisible: false },
    })
    stats.categoriesHidden += 1
  }
}

async function hideEmptyCategories(payload: Payload, stats: ImportStats) {
  const [categoryResult, productResult] = await Promise.all([
    payload.find({
      collection: "categories",
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: "products",
      where: { isVisible: { equals: true } },
      limit: 1000,
      depth: 0,
    }),
  ])

  const categories = categoryResult.docs as (PayloadCategoryDoc & {
    parent?: PayloadCategoryDoc | string | number | null
  })[]
  const products = productResult.docs as { category?: PayloadCategoryDoc | string | number | null }[]
  const directProductCounts = new Map<string, number>()
  const childIdsByParent = new Map<string, string[]>()

  for (const product of products) {
    const categoryId = typeof product.category === "object" && product.category !== null
      ? product.category.id
      : product.category
    if (categoryId === undefined || categoryId === null) continue
    const key = String(categoryId)
    directProductCounts.set(key, (directProductCounts.get(key) || 0) + 1)
  }

  for (const category of categories) {
    const parentId = typeof category.parent === "object" && category.parent !== null
      ? category.parent.id
      : category.parent
    if (parentId === undefined || parentId === null) continue
    const key = String(parentId)
    const rows = childIdsByParent.get(key) || []
    rows.push(String(category.id))
    childIdsByParent.set(key, rows)
  }

  const hasVisibleProducts = new Map<string, boolean>()
  const resolveHasProducts = (categoryId: string): boolean => {
    if (hasVisibleProducts.has(categoryId)) return hasVisibleProducts.get(categoryId) || false

    const hasDirectProducts = (directProductCounts.get(categoryId) || 0) > 0
    const hasChildProducts = (childIdsByParent.get(categoryId) || []).some(resolveHasProducts)
    const value = hasDirectProducts || hasChildProducts
    hasVisibleProducts.set(categoryId, value)
    return value
  }

  for (const category of categories) {
    if (!category.moyskladId) continue
    if (resolveHasProducts(String(category.id))) continue

    await payload.update({
      collection: "categories",
      id: category.id,
      data: { isVisible: false },
    })
    stats.categoriesHidden += 1
  }
}

async function hideObsoleteProducts(payload: Payload, activeProductIds: Set<string>, stats: ImportStats) {
  const result = await payload.find({
    collection: "products",
    where: { isVisible: { equals: true } },
    limit: 1000,
    depth: 0,
  })

  for (const product of result.docs as PayloadProductDoc[]) {
    if (!product.moyskladId) continue
    if (activeProductIds.has(product.moyskladId)) continue

    await payload.update({
      collection: "products",
      id: product.id,
      data: { isVisible: false },
    })
    stats.productsHidden += 1
  }
}

function variantPayloadFromMoysklad(item: MoyskladVariant | MoyskladProduct, productName: string) {
  const moyskladId = getEntityId(item)
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
    isAvailable: getAssortmentStock(item) > 0,
    grindOptions: inferGrindOptions(item.name || ""),
  }
}

function getVariantGrindSortOrder(variant: ReturnType<typeof variantPayloadFromMoysklad>) {
  const grind = variant.grindOptions[0] || ""
  if (grind === "beans") return 0
  if (grind === "ground") return 1
  return 99
}

function compareImportedVariants(
  a: ReturnType<typeof variantPayloadFromMoysklad>,
  b: ReturnType<typeof variantPayloadFromMoysklad>
) {
  const aWeight = a.weightGrams ?? -1
  const bWeight = b.weightGrams ?? -1

  if (aWeight !== bWeight) return bWeight - aWeight

  const grindOrder = getVariantGrindSortOrder(a) - getVariantGrindSortOrder(b)
  if (grindOrder !== 0) return grindOrder

  return a.name.localeCompare(b.name, "ru")
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

  const variants = variantItems
    .map((item) => variantPayloadFromMoysklad(item, params.product.name || "Товар"))
    .sort(compareImportedVariants)
  const hasAvailableStock = variants.some((variant) => variant.isAvailable)
  const slug = slugify(params.product.name || "product", `product-${shortId(productId)}`)
  const detailsSchema = schemaForName(`${params.productType.name || ""} ${params.product.name || ""}`)
  const accountingData = {
    name: params.product.name || "Товар",
    slug,
    moyskladId: productId,
    productTypeRef: params.productType.id,
    category: params.category.id,
    isVisible: !params.product.archived && hasAvailableStock,
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
    if (!hasAvailableStock) params.stats.productsHidden += 1
    params.stats.variantsHidden += variants.filter((variant) => !variant.isAvailable).length
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
    if (!hasAvailableStock) params.stats.productsHidden += 1
    params.stats.variantsHidden += variants.filter((variant) => !variant.isAvailable).length
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
  if (!hasAvailableStock) params.stats.productsHidden += 1
  params.stats.variantsHidden += variants.filter((variant) => !variant.isAvailable).length
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
    categoriesHidden: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsHidden: 0,
    variantsImported: 0,
    variantsHidden: 0,
    skippedProducts: [],
  }

  const [folders, products, variants, assortment] = await Promise.all([
    fetchAll(fetchMoyskladProductFolders),
    fetchAll(fetchMoyskladProducts),
    fetchAll(fetchMoyskladVariants),
    fetchAll(fetchMoyskladAssortment),
  ])

  const activeFolders = folders.filter((folder) => !folder.archived && folder.name)
  const sortedFolders = [...activeFolders].sort((a, b) => {
    return getFolderDepth(a) - getFolderDepth(b) || getFolderFullName(a).localeCompare(getFolderFullName(b), "ru")
  })
  const folderById = new Map(activeFolders.map((folder) => [getFolderId(folder), folder]))
  const folderByFullName = new Map(activeFolders.map((folder) => [getFolderFullName(folder), folder]))
  const rootFolders = activeFolders.filter((folder) => !folder.pathName)
  const rootFolderIds = new Set(rootFolders.map(getFolderId).filter(Boolean) as string[])
  const activeProductIds = new Set(
    products
      .filter((item) => !item.archived)
      .map((product) => getEntityId(product))
      .filter(Boolean) as string[]
  )
  const activeCategoryFolderIds = new Set(
    activeFolders
      .map((folder) => getFolderId(folder))
      .filter((folderId): folderId is string => {
        if (!folderId) return false
        return !rootFolderIds.has(folderId)
      })
  )
  const rootTypeByName = new Map<string, PayloadProductTypeDoc>()
  const categoryByFolderId = new Map<string, PayloadCategoryDoc>()

  for (const root of rootFolders) {
    const rootName = root.name || "Каталог"
    const type = await upsertProductType(payload, root, rootName, stats)
    rootTypeByName.set(rootName, type)
  }

  for (const folder of sortedFolders) {
    const folderId = getFolderId(folder)
    if (!folderId) continue
    if (!activeCategoryFolderIds.has(folderId)) continue

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
      const parentId = getFolderId(parentFolder)
      if (parentId && !rootFolderIds.has(parentId)) parent = categoryByFolderId.get(parentId) || null
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

  await hideObsoleteCategories(payload, activeCategoryFolderIds, stats)
  await hideObsoleteProducts(payload, activeProductIds, stats)

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
      stats.skippedProducts.push(`${product.name || product.id}: нет подгруппы МойСклад`)
      continue
    }

    await upsertProduct({
      payload,
      product,
      variants: variantsByProductId.get(product.id || "") || [],
      assortmentById,
      productType,
      category,
      stats,
    })
  }

  await hideEmptyCategories(payload, stats)

  return {
    ok: true as const,
    stats,
  }
}
