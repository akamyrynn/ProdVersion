import type { CollectionAfterChangeHook } from "payload"
import { createAdminClient } from "@/lib/supabase/admin"

interface Variant {
  id?: string
  name?: string
  isAvailable?: boolean
}

export const notifyProductRestock: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
}) => {
  if (operation !== "update") return doc

  const prevVariants: Variant[] = previousDoc?.variants || []
  const newVariants: Variant[] = doc?.variants || []

  // Find variants that changed from unavailable to available
  const restocked = newVariants.filter((nv) => {
    const pv = prevVariants.find((p) => p.id === nv.id)
    return pv && !pv.isAvailable && nv.isAvailable
  })

  if (restocked.length === 0) return doc

  try {
    const db = createAdminClient()
    const productName = doc.name as string
    const productId = String(doc.id)

    // Get all clients who have this product in favorites
    const { data: favorites } = await db
      .from("favorites")
      .select("client_id")
      .eq("product_id", productId)

    if (!favorites || favorites.length === 0) return doc

    // Insert notifications for each client
    const notifications = favorites.map((fav: { client_id: string }) => ({
      client_id: fav.client_id,
      type: "product_restock" as const,
      title: "Товар снова в наличии",
      message: `${productName} теперь доступен для заказа`,
      data: { product_id: productId },
    }))

    await db.from("notifications").insert(notifications)
  } catch (err) {
    console.error("[productRestock] Error sending notifications:", err)
  }

  return doc
}
