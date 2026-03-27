"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CategorySection } from "@/components/dashboard/category-section"
import { Heart, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Category, ProductType } from "@/types"

interface CatalogViewProps {
  categories: Category[]
  favoriteIds: string[]
  activeType: ProductType
}

const tabs: { value: ProductType; label: string }[] = [
  { value: "coffee", label: "КОФЕ" },
  { value: "tea", label: "ЧАЙ" },
  { value: "accessory", label: "АКСЕССУАРЫ" },
]

export function CatalogView({
  categories,
  favoriteIds,
  activeType,
}: CatalogViewProps) {
  const router = useRouter()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function handleTabChange(value: string) {
    router.push(`/dashboard/catalog?type=${value}`)
  }

  function toggleCategory(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function expandAll() {
    const allIds = new Set<string>()
    categories.forEach((c) => {
      allIds.add(c.id)
      c.children?.forEach((sub) => allIds.add(sub.id))
    })
    setExpandedIds(allIds)
  }

  return (
    <div>
      {/* Category tabs — inline at top */}
      <div className="flex items-center gap-0 border-b border-gray-200 px-6 bg-white">
        <span className="text-xs font-bold text-gray-400 mr-4 tracking-wider">
          КАТАЛОГ
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition-colors",
              activeType === tab.value
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}

        {/* Favorites tab */}
        <Link
          href="/dashboard/favorites"
          className="px-4 py-3 text-xs font-semibold text-gray-400 hover:text-gray-700 border-b-2 border-transparent flex items-center gap-1"
        >
          <Heart className="h-3 w-3" />
          ИЗБРАННОЕ
        </Link>

        <div className="ml-auto">
          <button className="p-2 text-gray-400 hover:text-black transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
        <select className="text-xs font-medium text-gray-600 bg-transparent border border-gray-200 rounded px-3 py-1.5 outline-none">
          <option>По алфавиту</option>
          <option>По цене</option>
          <option>По популярности</option>
        </select>
        <select className="text-xs font-medium text-gray-600 bg-transparent border border-gray-200 rounded px-3 py-1.5 outline-none">
          <option>Показывать все</option>
          <option>В наличии</option>
        </select>
      </div>

      {/* Categories list */}
      <div className="px-6 py-4">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            В этой категории пока нет товаров
          </div>
        ) : (
          <div className="space-y-0">
            {/* Expand all link */}
            <div className="flex justify-end mb-2">
              <button
                onClick={expandAll}
                className="text-[11px] font-medium text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
              >
                РАЗВЕРНУТЬ ВСЕ
              </button>
            </div>

            {categories.map((category) => (
              <div key={category.id}>
                {/* Group label (if has children) */}
                {category.children && category.children.length > 0 && (
                  <div className="text-[10px] font-semibold text-gray-300 tracking-wider uppercase pt-4 pb-1">
                    {category.name.toLowerCase()}
                  </div>
                )}

                {/* If category has subcategories, render each as expandable */}
                {category.children && category.children.length > 0 ? (
                  category.children.map((sub) => (
                    <CategorySection
                      key={sub.id}
                      category={sub}
                      isExpanded={expandedIds.has(sub.id)}
                      onToggle={() => toggleCategory(sub.id)}
                      favoriteIds={favoriteIds}
                    />
                  ))
                ) : (
                  <CategorySection
                    category={category}
                    isExpanded={expandedIds.has(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    favoriteIds={favoriteIds}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
