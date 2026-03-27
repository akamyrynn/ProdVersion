import { notFound } from "next/navigation"
import { getProductById, getFavoriteProductIds } from "@/lib/actions/products"
import { ProductDetail } from "@/components/dashboard/product-detail"

interface ProductPageProps {
  params: Promise<{ productId: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params
  const [product, favoriteIds] = await Promise.all([
    getProductById(productId),
    getFavoriteProductIds(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <ProductDetail
      product={product}
      isFavorite={favoriteIds.includes(product.id)}
    />
  )
}
