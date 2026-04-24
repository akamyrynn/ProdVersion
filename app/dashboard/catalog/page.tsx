import { getCategories, getFavoriteProductIds, getProductTypes, getTags } from "@/lib/actions/products"
import { CatalogBento } from "@/components/dashboard/catalog-bento"
import type { ProductType } from "@/types"

interface CatalogPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const requestedType = params.type as ProductType | undefined

  const [productTypes, favoriteIds, tags] = await Promise.all([
    getProductTypes(),
    getFavoriteProductIds(),
    getTags(),
  ])

  const productType =
    productTypes.find((type) => type.slug === requestedType)?.slug ||
    productTypes[0]?.slug

  const categories = productType ? await getCategories(productType) : []

  return (
    <CatalogBento
      categories={categories}
      favoriteIds={favoriteIds}
      activeType={productType || (requestedType || "")}
      productTypes={productTypes}
      tags={tags}
    />
  )
}
