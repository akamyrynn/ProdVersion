import { getCategories, getFavoriteProductIds, getTags } from "@/lib/actions/products"
import { CatalogBento } from "@/components/dashboard/catalog-bento"
import type { ProductType } from "@/types"

interface CatalogPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams
  const productType = (params.type as ProductType) || "coffee"

  const [categories, favoriteIds, tags] = await Promise.all([
    getCategories(productType),
    getFavoriteProductIds(),
    getTags(),
  ])

  return (
    <CatalogBento
      categories={categories}
      favoriteIds={favoriteIds}
      activeType={productType}
      tags={tags}
    />
  )
}
