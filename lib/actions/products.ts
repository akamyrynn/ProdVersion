"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"
import type { Product, ProductVariant, ProductType, AttachedFile } from "@/types"

async function getPayloadClient() {
  return getPayload({ config: configPromise })
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

// ============================================================
// Transform helpers: Payload → Frontend types
// ============================================================

const GRIND_MAP: Record<string, string> = {
  beans: "В зёрнах",
  ground: "Молотый",
}

function extractImageUrls(images: any[] | undefined | null): string[] {
  if (!images || !Array.isArray(images)) return []
  return images
    .map((entry) => {
      const img = entry?.image
      if (!img) return null
      if (typeof img === "string") return null // just an ID, no URL
      return img.url || img.sizes?.card?.url || img.sizes?.full?.url || null
    })
    .filter(Boolean) as string[]
}

function transformVariant(v: any, productId: string): ProductVariant {
  return {
    id: v.id || "",
    product_id: productId,
    name: v.name || "",
    sku: v.sku || null,
    price: v.price || 0,
    weight_grams: v.weightGrams ?? null,
    is_available: v.isAvailable ?? true,
    sort_order: 0,
    grind_options: (v.grindOptions || []).map((g: string) => GRIND_MAP[g] || g),
    created_at: "",
    updated_at: "",
  }
}

function extractMediaUrl(media: any): string | null {
  if (!media || typeof media === "string" || typeof media === "number") return null
  return media.url || media.sizes?.card?.url || media.sizes?.full?.url || null
}

function serializeLexical(node: any): string {
  if (!node) return ""
  if (typeof node === "string") return node
  if (node.root) return serializeLexical(node.root)

  const children = node.children || []
  let html = ""

  for (const child of children) {
    if (child.type === "paragraph") {
      const inner = serializeLexicalInline(child.children || [])
      if (inner) html += `<p>${inner}</p>`
    } else if (child.type === "heading") {
      const tag = child.tag || "h3"
      const inner = serializeLexicalInline(child.children || [])
      html += `<${tag}>${inner}</${tag}>`
    } else if (child.type === "list") {
      const tag = child.listType === "number" ? "ol" : "ul"
      html += `<${tag}>`
      for (const item of child.children || []) {
        const inner = serializeLexicalInline(item.children || [])
        html += `<li>${inner}</li>`
      }
      html += `</${tag}>`
    } else if (child.type === "upload") {
      const url = extractMediaUrl(child.value)
      if (url) html += `<img src="${url}" alt="" class="rounded-lg" />`
    } else {
      html += serializeLexicalInline(child.children || [])
    }
  }

  return html
}

function serializeLexicalInline(children: any[]): string {
  let result = ""
  for (const child of children) {
    if (child.type === "text") {
      let text = child.text || ""
      const fmt = child.format || 0
      if (fmt & 1) text = `<strong>${text}</strong>`
      if (fmt & 2) text = `<em>${text}</em>`
      result += text
    } else if (child.type === "linebreak") {
      result += "<br/>"
    } else if (child.type === "link") {
      const inner = serializeLexicalInline(child.children || [])
      const url = child.fields?.url || "#"
      result += `<a href="${url}">${inner}</a>`
    } else if (child.children) {
      result += serializeLexicalInline(child.children)
    }
  }
  return result
}

function transformAttachedFiles(files: any[] | undefined | null): AttachedFile[] {
  if (!files || !Array.isArray(files)) return []
  return files
    .map((entry) => {
      const file = entry?.file
      if (!file || typeof file === "string" || typeof file === "number") return null
      return {
        name: entry.label || file.filename || "File",
        url: file.url || "",
        size: file.filesize || 0,
      }
    })
    .filter(Boolean) as AttachedFile[]
}

function transformProduct(doc: any): Product {
  const productId = String(doc.id)
  const coffee = doc.coffeeDetails || {}
  const tea = doc.teaDetails || {}

  const descriptionHtml = doc.description ? serializeLexical(doc.description) : null

  return {
    id: productId,
    category_id: String(typeof doc.category === "object" ? doc.category?.id : doc.category),
    product_type: doc.productType as ProductType,
    name: doc.name || "",
    slug: doc.slug || "",
    description: descriptionHtml || null,
    description_images: [],
    sort_order: doc.sortOrder || 0,
    is_visible: doc.isVisible ?? true,
    stickers: (doc.stickers || []).map((tag: any) =>
      tag && typeof tag === "object"
        ? { id: String(tag.id), name: tag.name || "", slug: tag.slug || "", color: tag.color }
        : null
    ).filter(Boolean),

    // Coffee details (flattened from coffeeDetails group)
    roaster: coffee.roaster || null,
    roast_level: coffee.roastLevel || null,
    region: coffee.region || null,
    processing_method: coffee.processingMethod || null,
    growing_height: coffee.growingHeight || null,
    q_grader_rating: coffee.qGraderRating || null,

    // Coffee brewing methods
    brewing_methods: (coffee.brewingMethods || []).map((m: any) => ({
      method: m.method,
      description: m.description || "",
      image_url: extractMediaUrl(m.image) || undefined,
    })),

    // Tea brewing instructions
    brewing_instructions: (tea.brewingInstructions || []).map((i: any) => ({
      title: i.title,
      text: i.text,
      image_url: extractMediaUrl(i.image) || undefined,
    })),

    // Files
    attached_files: transformAttachedFiles(doc.attachedFiles),

    // Media
    images: extractImageUrls(doc.images),
    video_urls: (doc.videoUrls || []).map((v: any) => v.url).filter(Boolean),

    created_at: doc.createdAt || "",
    updated_at: doc.updatedAt || "",

    // Relations
    variants: (doc.variants || []).map((v: any) => transformVariant(v, productId)),
  }
}

// ============================================================
// Public API
// ============================================================

export async function getCategories(productType?: ProductType) {
  const payload = await getPayloadClient()

  const where: any = { isVisible: { equals: true } }
  if (productType) {
    where.productType = { equals: productType }
  }

  const { docs } = await payload.find({
    collection: "categories",
    where,
    sort: "sortOrder",
    limit: 200,
    depth: 1,
  })

  const all = docs as any[]
  const roots = all.filter((c) => !c.parent)
  const childMap = new Map<number, any[]>()

  all.forEach((c) => {
    if (c.parent) {
      const parentId = typeof c.parent === "object" ? c.parent.id : c.parent
      const existing = childMap.get(parentId) || []
      existing.push(c)
      childMap.set(parentId, existing)
    }
  })

  roots.forEach((root) => {
    root.children = childMap.get(root.id) || []
  })

  return roots
}

export async function getProductsByCategory(categoryId: number | string): Promise<Product[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: "products",
    where: {
      category: { equals: categoryId },
      isVisible: { equals: true },
    },
    sort: "sortOrder",
    limit: 100,
    depth: 2,
  })

  return docs.map(transformProduct)
}

export async function getProductById(id: number | string): Promise<Product | null> {
  const payload = await getPayloadClient()

  try {
    const doc = await payload.findByID({
      collection: "products",
      id: id,
      depth: 2,
    })
    return transformProduct(doc)
  } catch {
    return null
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: "products",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  if (!docs[0]) return null
  return transformProduct(docs[0])
}

export async function searchProducts(query: string): Promise<Product[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: "products",
    where: {
      name: { contains: query },
      isVisible: { equals: true },
    },
    sort: "sortOrder",
    limit: 20,
    depth: 2,
  })

  return docs.map(transformProduct)
}

// ============================================================
// Client discount
// ============================================================

export async function getClientDiscount(): Promise<number> {
  const userId = await getCurrentUserId()
  if (!userId) return 0

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: "clients",
      where: { supabaseId: { equals: userId } },
      limit: 1,
      depth: 0,
    })
    return (docs[0]?.discountPercent as number) || 0
  } catch {
    return 0
  }
}

// ============================================================
// Favorites (Payload-based)
// ============================================================

export async function getFavoriteProductIds(): Promise<string[]> {
  const clientId = await getCurrentUserId()
  if (!clientId) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "favorites",
    where: { clientId: { equals: clientId } },
    limit: 500,
    depth: 0,
  })

  return docs.map((d: any) => String(typeof d.product === "object" ? d.product.id : d.product))
}

export async function getFavoriteProducts(): Promise<Product[]> {
  const clientId = await getCurrentUserId()
  if (!clientId) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "favorites",
    where: { clientId: { equals: clientId } },
    limit: 200,
    depth: 2,
  })

  return docs
    .map((d: any) => {
      const raw = typeof d.product === "object" ? d.product : null
      return raw ? transformProduct(raw) : null
    })
    .filter(Boolean) as Product[]
}

export async function toggleFavorite(productId: string): Promise<{ isFavorite: boolean }> {
  const clientId = await getCurrentUserId()
  if (!clientId) return { isFavorite: false }

  const payload = await getPayloadClient()
  // Check if already favorited
  const { docs } = await payload.find({
    collection: "favorites",
    where: {
      and: [
        { clientId: { equals: clientId } },
        { product: { equals: productId } },
      ],
    },
    limit: 1,
  })

  if (docs.length > 0) {
    // Remove favorite
    await payload.delete({ collection: "favorites", id: docs[0].id })
    return { isFavorite: false }
  } else {
    // Add favorite
    await payload.create({
      collection: "favorites",
      data: { clientId, product: productId },
    })
    return { isFavorite: true }
  }
}

export async function getTags() {
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: "tags",
      limit: 100,
      sort: "name",
    })
    return docs.map((tag: any) => ({
      id: String(tag.id),
      name: tag.name || "",
      slug: tag.slug || "",
      color: tag.color as string | undefined,
    }))
  } catch {
    return []
  }
}
