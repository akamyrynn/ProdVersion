"use server"

import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CartItem, Product, ProductVariant } from "@/types"

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
// Transform helpers
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
      if (!img || typeof img === "string" || typeof img === "number") return null
      return img.url || img.sizes?.card?.url || img.sizes?.full?.url || null
    })
    .filter(Boolean) as string[]
}

function transformVariantFromPayload(v: any, productId: string): ProductVariant {
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

function transformProductFromPayload(doc: any): Product {
  const productId = String(doc.id)
  const coffee = doc.coffeeDetails || {}
  const tea = doc.teaDetails || {}

  return {
    id: productId,
    category_id: String(typeof doc.category === "object" ? doc.category?.id : doc.category),
    product_type: doc.productType,
    name: doc.name || "",
    slug: doc.slug || "",
    description: null,
    description_images: [],
    sort_order: doc.sortOrder || 0,
    is_visible: doc.isVisible ?? true,
    stickers: (doc.stickers || []).map((tag: any) =>
      tag && typeof tag === "object"
        ? { id: String(tag.id), name: tag.name || "", slug: tag.slug || "", color: tag.color }
        : null
    ).filter(Boolean),
    roaster: coffee.roaster || null,
    roast_level: coffee.roastLevel || null,
    region: coffee.region || null,
    processing_method: coffee.processingMethod || null,
    growing_height: coffee.growingHeight || null,
    q_grader_rating: coffee.qGraderRating || null,
    brewing_methods: (coffee.brewingMethods || []).map((m: any) => ({
      method: m.method,
      description: m.description || "",
    })),
    brewing_instructions: (tea.brewingInstructions || []).map((i: any) => ({
      title: i.title,
      text: i.text,
    })),
    attached_files: null,
    images: extractImageUrls(doc.images),
    video_urls: (doc.videoUrls || []).map((v: any) => v.url).filter(Boolean),
    created_at: doc.createdAt || "",
    updated_at: doc.updatedAt || "",
    variants: (doc.variants || []).map((v: any) => transformVariantFromPayload(v, productId)),
  }
}

function transformCartItem(doc: any): CartItem {
  const rawProduct = typeof doc.product === "object" ? doc.product : null
  const product = rawProduct ? transformProductFromPayload(rawProduct) : undefined
  const variant = product?.variants?.find((v) => v.id === doc.variantId) || undefined

  return {
    id: String(doc.id),
    client_id: doc.clientId,
    product_id: String(rawProduct?.id || doc.product),
    variant_id: doc.variantId,
    quantity: doc.quantity,
    grind_option: doc.grindOption || null,
    created_at: doc.createdAt || "",
    updated_at: doc.updatedAt || "",
    product,
    variant,
  }
}

// ============================================================
// Cart CRUD — reads via Payload (needs JOINs), mutations via Supabase
// ============================================================

export async function getCartItems(): Promise<CartItem[]> {
  const clientId = await getCurrentUserId()
  if (!clientId) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: "cart-items",
    where: { clientId: { equals: clientId } },
    depth: 2,
    limit: 100,
    sort: "createdAt",
  })

  return docs.map(transformCartItem)
}

export async function addToCart(params: {
  productId: string
  variantId: string
  quantity: number
  grindOption?: string
}): Promise<{ success: boolean }> {
  const clientId = await getCurrentUserId()
  if (!clientId) return { success: false }

  const db = createAdminClient()
  const grindOption = params.grindOption || ""

  // Check if same item already in cart
  const { data: existing } = await db
    .from("cart_items")
    .select("id, quantity")
    .eq("client_id", clientId)
    .eq("product_id", params.productId)
    .eq("variant_id", params.variantId)
    .eq("grind_option", grindOption)
    .limit(1)
    .single()

  if (existing) {
    const { error } = await db
      .from("cart_items")
      .update({ quantity: existing.quantity + params.quantity })
      .eq("id", existing.id)
    if (error) {
      console.error("addToCart update error:", error.message)
      return { success: false }
    }
  } else {
    const { error } = await db.from("cart_items").insert({
      client_id: clientId,
      product_id: params.productId,
      variant_id: params.variantId,
      quantity: params.quantity,
      grind_option: grindOption,
    })
    if (error) {
      console.error("addToCart insert error:", error.message)
      return { success: false }
    }
  }

  return { success: true }
}

export async function updateCartQuantity(
  cartItemId: string,
  quantity: number
): Promise<{ success: boolean }> {
  if (quantity < 1) return { success: false }

  const db = createAdminClient()
  const { error } = await db
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)

  if (error) {
    console.error("updateCartQuantity error:", error.message)
    throw new Error(error.message)
  }

  return { success: true }
}

export async function removeCartItem(cartItemId: string): Promise<{ success: boolean }> {
  const db = createAdminClient()
  const { error } = await db
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)

  if (error) {
    console.error("removeCartItem error:", error.message)
    throw new Error(error.message)
  }

  return { success: true }
}

export async function clearCart(): Promise<{ success: boolean }> {
  const clientId = await getCurrentUserId()
  if (!clientId) return { success: false }

  const db = createAdminClient()
  await db
    .from("cart_items")
    .delete()
    .eq("client_id", clientId)

  return { success: true }
}
