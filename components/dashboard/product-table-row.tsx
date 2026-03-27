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
    <div className="py-2.5 border-b border-neutral-50 hover:bg-white/60 transition-colors group px-1">
      {/* ── DESKTOP: single row — image + name + variants + heart ── */}
      <div className="hidden sm:flex items-center gap-3">
        {/* Thumbnail */}
        <div className="h-10 w-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
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
              {[product.region, product.processing_method].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Stickers */}
        {product.stickers?.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {product.stickers.map((tag) => (
              <span
                key={tag.id}
                className={cn(
                  "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                  tag.color === "purple" ? "bg-[#faead5] text-[#5b328a]" : "bg-[#faead5] text-[#e6610d]"
                )}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Variant cells — inline */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {variants.map((variant) => (
            <VariantCell
              key={variant.id}
              variant={variant}
              productId={product.id}
              onAdd={addItem}
            />
          ))}
        </div>

        {/* Favorite */}
        <button onClick={handleFavorite} disabled={isPending} className="shrink-0">
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-neutral-300 hover:text-red-400"
            )}
          />
        </button>
      </div>

      {/* ── MOBILE: header + variant rows below ── */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neutral-100 shrink-0 overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Coffee className="h-4 w-4 text-neutral-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/product/${product.id}`}
              className="text-[13px] font-semibold text-neutral-900 hover:text-[#5b328a] transition-colors truncate block"
            >
              {product.name}
            </Link>
            {(product.region || product.processing_method) && (
              <p className="text-[11px] text-neutral-400 truncate">
                {[product.region, product.processing_method].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button onClick={handleFavorite} disabled={isPending} className="shrink-0">
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-neutral-300 hover:text-red-400"
              )}
            />
          </button>
        </div>
        {variants.length > 0 && (
          <div className="mt-2 pl-[52px] space-y-1.5">
            {variants.flatMap((variant) => {
              const hasMultipleGrinds = variant.grind_options && variant.grind_options.length > 1
              if (hasMultipleGrinds) {
                return variant.grind_options!.map((grind) => (
                  <MobileVariantRow
                    key={`${variant.id}-${grind}`}
                    variant={variant}
                    productId={product.id}
                    grind={grind}
                  />
                ))
              }
              return [
                <MobileVariantRow
                  key={variant.id}
                  variant={variant}
                  productId={product.id}
                  grind={variant.grind_options?.[0]}
                />,
              ]
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mobile variant row (matches reference screenshot) ──
function MobileVariantRow({
  variant,
  productId,
  grind,
}: {
  variant: ProductVariant
  productId: string
  grind?: string
}) {
  const { items, updateQuantity, removeItem, addItem } = useCart()

  const cartItem = items.find(
    (i) =>
      i.product_id === productId &&
      i.variant_id === variant.id &&
      (i.grind_option || "") === (grind || "")
  )
  const qty = cartItem?.quantity ?? 0

  async function increment() {
    if (cartItem) {
      await updateQuantity(cartItem.id, cartItem.quantity + 1)
    } else {
      await addItem({ productId, variantId: variant.id, quantity: 1, grindOption: grind })
    }
  }

  async function decrement() {
    if (!cartItem) return
    if (cartItem.quantity <= 1) await removeItem(cartItem.id)
    else await updateQuantity(cartItem.id, cartItem.quantity - 1)
  }

  if (variant.price <= 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-neutral-500 w-12 shrink-0">{variant.name}</span>
      <span className="text-[12px] text-neutral-400 flex-1">{grind ?? ""}</span>
      <span className="text-[13px] font-bold text-neutral-800 w-16 text-right shrink-0">
        {Math.round(variant.price).toLocaleString("ru-RU")} ₽
      </span>

      {qty > 0 ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={decrement}
            className="h-6 w-6 rounded-full border border-[#5b328a]/30 flex items-center justify-center text-[#5b328a] hover:bg-[#5b328a]/10 transition-colors"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
          <span className="w-5 text-center text-[11px] font-bold text-[#5b328a]">{qty}</span>
          <button
            onClick={increment}
            className="h-6 w-6 rounded-full bg-[#5b328a] flex items-center justify-center text-white hover:bg-[#4a2870] transition-colors"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={increment}
          className="h-7 w-7 rounded-lg border border-neutral-300 flex items-center justify-center text-neutral-500 hover:border-[#5b328a] hover:text-[#5b328a] transition-colors shrink-0"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ── Desktop variant cell ──
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
      <div className="text-center min-w-[50px]">
        <div className="text-[10px] font-medium text-neutral-400 leading-none">{variant.name}</div>
        <div className="text-[13px] font-bold text-neutral-900 tabular-nums mt-0.5">
          {variant.price > 0 ? `${Math.round(variant.price)}₽` : "—"}
        </div>
      </div>

      {variant.price > 0 && (
        <div className="flex items-center gap-1.5">
          {hasMultipleGrinds ? (
            <>
              <AddButton variant={variant} productId={productId} grindOption="В зёрнах" label="зёрна" onAdd={onAdd} />
              <AddButton variant={variant} productId={productId} grindOption="Молотый" label="молотый" onAdd={onAdd} />
            </>
          ) : (
            <AddButton variant={variant} productId={productId} grindOption={variant.grind_options?.[0]} onAdd={onAdd} />
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
  onAdd: (params: { productId: string; variantId: string; quantity: number; grindOption?: string }) => Promise<void>
}) {
  const { items, updateQuantity, removeItem } = useCart()

  const cartItem = items.find(
    (i) =>
      i.product_id === productId &&
      i.variant_id === variant.id &&
      (i.grind_option || "") === (grindOption || "")
  )
  const cartQty = cartItem?.quantity ?? 0

  async function increment() {
    if (cartItem) {
      await updateQuantity(cartItem.id, cartItem.quantity + 1)
    } else {
      await onAdd({ productId, variantId: variant.id, quantity: 1, grindOption })
    }
  }

  async function decrement() {
    if (!cartItem) return
    if (cartItem.quantity <= 1) await removeItem(cartItem.id)
    else await updateQuantity(cartItem.id, cartItem.quantity - 1)
  }

  if (cartQty === 0) {
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
        className="flex h-6 w-6 items-center justify-center rounded-full border border-[#5b328a]/30 text-[#5b328a] hover:bg-[#5b328a]/10 transition-colors"
      >
        <Minus className="h-2.5 w-2.5" />
      </button>
      <span className="w-5 text-center text-[11px] font-bold text-[#5b328a] tabular-nums">{cartQty}</span>
      <button
        onClick={increment}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b328a] text-white hover:bg-[#4a2870] transition-colors"
      >
        <Plus className="h-2.5 w-2.5" />
      </button>
      {label && <span className="text-[9px] text-neutral-400 ml-0.5">{label}</span>}
    </div>
  )
}
