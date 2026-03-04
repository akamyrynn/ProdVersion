"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Heart, Plus, Minus, Coffee } from "lucide-react"
import { useCart } from "@/providers/cart-provider"
import { toggleFavorite } from "@/lib/actions/products"
import { cn } from "@/lib/utils"
import type { Product, ProductVariant } from "@/types"

interface ProductTableRowProps {
  product: Product
  isFavorite: boolean
}

export function ProductTableRow({
  product,
  isFavorite: initialFav,
}: ProductTableRowProps) {
  const { addItem } = useCart()
  const [isFavorite, setIsFavorite] = useState(initialFav)
  const [isPending, startTransition] = useTransition()

  const imageUrl = product.images?.[0] || null
  const variants = product.variants ?? []

  function handleFavorite() {
    setIsFavorite(!isFavorite)
    startTransition(async () => {
      const result = await toggleFavorite(product.id)
      if ("isFavorite" in result) {
        setIsFavorite(result.isFavorite ?? false)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-neutral-50 hover:bg-white/60 transition-colors group min-w-[600px] px-1">
      {/* Thumbnail */}
      <div className="h-10 w-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Coffee className="h-4 w-4 text-neutral-300" />
        )}
      </div>

      {/* Name + description */}
      <div className="min-w-0 w-[180px] shrink-0">
        <Link
          href={`/dashboard/product/${product.id}`}
          className="text-[13px] font-semibold text-neutral-900 hover:text-[#5b328a] transition-colors truncate block"
        >
          {product.name}
        </Link>
        {(product.region || product.processing_method) && (
          <p className="text-[11px] text-neutral-400 truncate">
            {[product.region, product.processing_method]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      {/* Stickers */}
      {product.stickers?.length > 0 && (
        <div className="flex gap-1 shrink-0">
          {product.stickers.map((s) => (
            <span
              key={s}
              className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                s === "new"
                  ? "bg-[#faead5] text-[#5b328a]"
                  : s === "popular"
                    ? "bg-[#faead5] text-[#e6610d]"
                    : "bg-[#faead5] text-[#e6610d]"
              )}
            >
              {s === "new" ? "new" : s === "popular" ? "хит" : "sale"}
            </span>
          ))}
        </div>
      )}

      {/* Favorite */}
      <button
        onClick={handleFavorite}
        disabled={isPending}
        className="shrink-0"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorite
              ? "fill-red-500 text-red-500"
              : "text-neutral-300 hover:text-red-400"
          )}
        />
      </button>

      {/* Variants — dynamic */}
      <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
        {variants.map((variant) => (
          <VariantCell
            key={variant.id}
            variant={variant}
            productId={product.id}
            onAdd={addItem}
          />
        ))}
      </div>
    </div>
  )
}

function VariantCell({
  variant,
  productId,
  onAdd,
}: {
  variant: ProductVariant
  productId: string
  onAdd: (params: {
    productId: string
    variantId: string
    quantity: number
    grindOption?: string
  }) => Promise<void>
}) {
  const hasMultipleGrinds = variant.grind_options && variant.grind_options.length > 1

  return (
    <div className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-100">
      {/* Variant name + price */}
      <div className="text-center min-w-[50px]">
        <div className="text-[10px] font-medium text-neutral-400 leading-none">{variant.name}</div>
        <div className="text-[13px] font-bold text-neutral-900 tabular-nums mt-0.5">
          {variant.price > 0 ? `${Math.round(variant.price)}₽` : "—"}
        </div>
      </div>

      {/* Grind add buttons */}
      {variant.price > 0 && (
        <div className="flex items-center gap-1.5">
          {hasMultipleGrinds ? (
            <>
              <AddButton
                variant={variant}
                productId={productId}
                grindOption="В зёрнах"
                label="зёрна"
                onAdd={onAdd}
              />
              <AddButton
                variant={variant}
                productId={productId}
                grindOption="Молотый"
                label="молотый"
                onAdd={onAdd}
              />
            </>
          ) : (
            <AddButton
              variant={variant}
              productId={productId}
              grindOption={variant.grind_options?.[0]}
              onAdd={onAdd}
            />
          )}
        </div>
      )}
    </div>
  )
}

function AddButton({
  variant,
  productId,
  grindOption,
  label,
  onAdd,
}: {
  variant: ProductVariant
  productId: string
  grindOption?: string
  label?: string
  onAdd: (params: {
    productId: string
    variantId: string
    quantity: number
    grindOption?: string
  }) => Promise<void>
}) {
  const [qty, setQty] = useState(0)

  async function increment() {
    const newQty = qty + 1
    setQty(newQty)
    await onAdd({
      productId,
      variantId: variant.id,
      quantity: 1,
      grindOption,
    })
  }

  function decrement() {
    if (qty > 0) setQty(qty - 1)
  }

  if (qty === 0) {
    return (
      <button
        onClick={increment}
        className="flex h-7 items-center gap-1 px-2 rounded-lg border border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
        title={grindOption || "Добавить"}
      >
        <Plus className="h-3 w-3" />
        {label && <span className="text-[10px] font-medium">{label}</span>}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={decrement}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
      >
        <Minus className="h-2.5 w-2.5" />
      </button>
      <span className="w-5 text-center text-[11px] font-bold text-neutral-900 tabular-nums">
        {qty}
      </span>
      <button
        onClick={increment}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
      {label && <span className="text-[9px] text-neutral-400 ml-0.5">{label}</span>}
    </div>
  )
}
