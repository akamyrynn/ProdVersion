"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "@/components/dashboard/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/types"

interface CategoryProductListProps {
  categoryId: string
  favoriteIds: string[]
}

export function CategoryProductList({
  categoryId,
  favoriteIds,
}: CategoryProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("category_id", categoryId)
        .eq("is_visible", true)
        .order("sort_order")

      if (data) {
        setProducts(data as Product[])
      }
      setLoading(false)
    }

    load()
  }, [categoryId, supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <Skeleton className="h-44 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-[#2d1b11]/50 py-4 pl-1 italic">
        Товары скоро появятся
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product, idx) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favoriteIds.includes(product.id)}
          index={idx}
        />
      ))}
    </div>
  )
}
