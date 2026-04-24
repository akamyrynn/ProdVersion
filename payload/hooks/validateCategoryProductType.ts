import type { CollectionBeforeChangeHook } from "payload"
import { getRelationshipId } from "@/lib/product-types"

export const validateCategoryProductType: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data) return data

  const productTypeRef = data.productTypeRef ?? originalDoc?.productTypeRef
  const parent = data.parent ?? originalDoc?.parent
  const currentCategoryId = originalDoc?.id

  const productTypeId = getRelationshipId(productTypeRef)
  const parentId = getRelationshipId(parent)

  if (!parentId) return data

  if (currentCategoryId !== undefined && String(parentId) === String(currentCategoryId)) {
    throw new Error("Категория не может быть родительской сама для себя.")
  }

  const parentCategory = await req.payload.findByID({
    collection: "categories",
    id: parentId,
    depth: 0,
  })

  const parentTypeId = getRelationshipId(parentCategory.productTypeRef)
  if (productTypeId && parentTypeId && String(productTypeId) !== String(parentTypeId)) {
    throw new Error("Родительская категория должна относиться к тому же типу товара.")
  }

  return data
}
