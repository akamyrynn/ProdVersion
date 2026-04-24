import type { CollectionBeforeChangeHook } from "payload"
import { getRelationshipId, normalizeProductDetailsSchema } from "@/lib/product-types"

export const syncProductTypeConfig: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const productTypeRef = data.productTypeRef ?? originalDoc?.productTypeRef
  const category = data.category ?? originalDoc?.category

  const productTypeId = getRelationshipId(productTypeRef)
  const categoryId = getRelationshipId(category)

  if (!productTypeId) {
    data.detailsSchema = "generic"
    data.coffeeDetails = undefined
    data.teaDetails = undefined
    return data
  }

  const typeDoc = await req.payload.findByID({
    collection: "product-types",
    id: productTypeId,
    depth: 0,
  })

  const detailsSchema = normalizeProductDetailsSchema(typeDoc.detailsSchema)
  data.detailsSchema = detailsSchema

  if (detailsSchema !== "coffee") {
    data.coffeeDetails = undefined
  }

  if (detailsSchema !== "tea") {
    data.teaDetails = undefined
  }

  if (!categoryId) {
    return data
  }

  const categoryDoc = await req.payload.findByID({
    collection: "categories",
    id: categoryId,
    depth: 0,
  })

  const categoryTypeId = getRelationshipId(categoryDoc.productTypeRef)
  if (!categoryTypeId || String(categoryTypeId) !== String(productTypeId)) {
    throw new Error("Категория должна принадлежать тому же типу товара, что и сам товар.")
  }

  return data
}
