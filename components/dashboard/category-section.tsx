"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProductTableRow } from "@/components/dashboard/product-table-row"
import { cn } from "@/lib/utils"
import type { Category, Product } from "@/types"

interface CategorySectionProps {
  category: Category
  isExpanded: boolean
  onToggle: () => void
  favoriteIds: string[]
}

export function CategorySection({
  category,
  isExpanded,
  onToggle,
  favoriteIds,
}: CategorySectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isExpanded && !loaded) {
      setLoading(true)
      supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("category_id", category.id)
        .eq("is_visible", true)
        .order("sort_order")
        .then(({ data }) => {
          if (data) setProducts(data as Product[])
          setLoading(false)
          setLoaded(true)
        })
    }
  }, [isExpanded, loaded, category.id, supabase])

  return (
    <div className="border-b border-gray-100">
      {/* Category header — clickable row */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-0 py-3 text-left group hover:bg-gray-50/50 transition-colors"
      >
        <h3 className="text-sm font-bold text-black uppercase tracking-wide">
          {category.name}
        </h3>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* Expanded content — product table */}
      {isExpanded && (
        <div className="pb-4">
          {loading ? (
            <div className="py-4 text-xs text-gray-400">Загрузка...</div>
          ) : products.length === 0 ? (
            <div className="py-4 text-xs text-gray-400">Товары скоро появятся</div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_100px_100px] gap-2 items-center py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <div>Наименование</div>
                <div className="text-right">Цена, ₽</div>
                <div className="text-center">В зёрнах</div>
                <div className="text-center">Молотый</div>
              </div>

              {/* Product rows */}
              {products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
