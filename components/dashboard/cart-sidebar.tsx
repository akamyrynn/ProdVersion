"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, Send, Minus, Plus, FileText, ShoppingBag, X, Coffee, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatPrice, formatWeight } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { useCart } from "@/providers/cart-provider"
import { validatePromoCode } from "@/lib/actions/promo"
import { toast } from "sonner"
import type { CartItem } from "@/types"

interface CartSidebarProps {
  items: CartItem[]
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  onClearCart?: () => void
  onClose?: () => void
  inPanel?: boolean
  priceListUrl?: string
  clientDiscount?: number
}

export function CartSidebar({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onClose,
  inPanel = false,
  priceListUrl,
  clientDiscount = 0,
}: CartSidebarProps) {
  const { appliedPromo, setAppliedPromo } = useCart()
  const [promoInput, setPromoInput] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)

  const totalPrice = items.reduce((sum, item) => {
    return sum + (item.variant?.price ?? 0) * item.quantity
  }, 0)

  const totalWeight = items.reduce((sum, item) => {
    return sum + (item.variant?.weight_grams ?? 0) * item.quantity
  }, 0)

  // Promo discount
  const promoDiscount = appliedPromo
    ? appliedPromo.discountType === "percentage"
      ? Math.round((totalPrice * appliedPromo.discountValue) / 100)
      : Math.min(appliedPromo.discountValue, totalPrice)
    : 0

  // Client personal discount (percentage)
  const clientDiscountAmount = clientDiscount > 0
    ? Math.round((totalPrice * clientDiscount) / 100)
    : 0

  // Use the greater of the two discounts
  const currentDiscount = Math.max(promoDiscount, clientDiscountAmount)
  const activeDiscountLabel = currentDiscount > 0
    ? (clientDiscountAmount > promoDiscount && !appliedPromo ? `Скидка ${clientDiscount}%` : undefined)
    : undefined
  const finalPrice = Math.max(0, totalPrice - currentDiscount)

  async function handleApplyPromo() {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    const result = await validatePromoCode(promoInput.trim(), totalPrice)
    if (result.valid) {
      setAppliedPromo({
        promoCodeId: result.promoCodeId,
        discountAmount: result.calculatedDiscount,
        discountType: result.discountType,
        discountValue: result.discountValue,
      })
      toast.success(`Промокод применён! Скидка: ${result.calculatedDiscount.toLocaleString("ru-RU")} ₽`)
    } else {
      toast.error(result.error)
    }
    setPromoLoading(false)
  }

  function handleRemovePromo() {
    setAppliedPromo(null)
    setPromoInput("")
  }

  const DEFAULT_PRICE_LIST = "/Прайс 10coffee_ Март 2026г. (1).pdf"
  const priceListHref = priceListUrl || DEFAULT_PRICE_LIST

  const inner = (
    <>
      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br bg-[#faead5] flex items-center justify-center mb-4">
                <Coffee className="h-7 w-7 text-[#e6610d]/50" />
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">Корзина пуста</p>
              <p className="text-[12px] text-neutral-400 mt-1.5 max-w-[200px] leading-relaxed">
                Перейдите в каталог и добавьте товары
              </p>
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {items.map((item) => (
                <div key={item.id} className="group rounded-xl p-3 hover:bg-[#faead5]/40 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br bg-[#faead5] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.name || ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Coffee className="h-5 w-5 text-[#e6610d]/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-bold text-neutral-900 leading-tight line-clamp-2">
                            {item.product?.name || "Товар"}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {item.variant?.name}
                            {item.grind_option && ` · ${item.grind_option}`}
                          </p>
                        </div>
                        <button
                          onClick={() => onRemoveItem?.(item.id)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 shrink-0 h-6 w-6 flex items-center justify-center rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center bg-neutral-100 rounded-lg overflow-hidden">
                          <button
                            onClick={() => item.quantity <= 1 ? onRemoveItem?.(item.id) : onUpdateQuantity?.(item.id, item.quantity - 1)}
                            className="h-7 w-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-[12px] font-bold text-neutral-900">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                            className="h-7 w-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-[14px] font-black text-neutral-900">
                          {formatPrice((item.variant?.price ?? 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Bottom */}
      <div className="px-3 pb-3 sm:px-5 sm:pb-5 space-y-2 sm:space-y-3">
        {items.length > 0 && (
          <>
            {/* Total block */}
            <div className="bg-gradient-to-r bg-[#faead5] rounded-xl p-3 space-y-1.5">
              {currentDiscount > 0 && (
                <>
                  <div className="flex items-end justify-between">
                    <span className="text-[11px] text-neutral-400">Товары</span>
                    <span className="text-[13px] font-semibold text-neutral-600">
                      {Math.round(totalPrice).toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-green-600 font-medium">
                      {activeDiscountLabel || "Скидка"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-green-600">
                        −{currentDiscount.toLocaleString("ru-RU")} ₽
                      </span>
                      {appliedPromo && (
                        <button
                          onClick={handleRemovePromo}
                          className="h-4 w-4 rounded flex items-center justify-center text-neutral-300 hover:text-red-500 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="flex items-end justify-between gap-2">
                <span className="text-[12px] text-neutral-400 uppercase tracking-wider font-medium shrink-0">Итого</span>
                <span className="text-lg font-black text-neutral-900 truncate text-right">
                  {finalPrice > 0 ? `${Math.round(finalPrice).toLocaleString("ru-RU")} ₽` : "0 ₽"}
                </span>
              </div>
            </div>

            {/* Promo code */}
            {appliedPromo ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-50 border border-green-100">
                <span className="text-[12px] font-semibold text-green-700 flex-1 truncate">
                  Промокод применён
                </span>
                <button
                  onClick={handleRemovePromo}
                  className="text-[11px] font-medium text-green-600 hover:text-red-500 transition-colors shrink-0"
                >
                  Отменить
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  placeholder="Промокод"
                  className="h-10 text-[12px] rounded-xl border-neutral-200 bg-neutral-50 flex-1 min-w-0"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className="h-10 px-4 bg-neutral-900 text-white text-[11px] font-bold rounded-xl hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {promoLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                </button>
              </div>
            )}

            {/* Checkout */}
            <Link
              href="/dashboard/checkout"
              onClick={() => onClose?.()}
              className="flex items-center justify-center w-full h-11 sm:h-12 bg-[#5b328a] text-white text-[13px] font-bold tracking-wide rounded-xl hover:bg-[#4a2870] transition-all hover:shadow-lg hover:shadow-[#5b328a]/20 active:scale-[0.98]"
            >
              Оформить заказ
            </Link>
          </>
        )}

        {/* Separate blocks */}
        <div className="flex gap-2 pt-1">
          <a
            href={priceListHref}
            download
            className="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#faead5]/80 hover:bg-[#faead5] transition-colors text-center"
          >
            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="h-3.5 w-3.5 text-[#5b328a]" />
            </div>
            <p className="text-[11px] font-bold text-[#1d1d1b] leading-tight">Прайс-лист</p>
          </a>

          <a
            href="tg://resolve?domain=Tencoffeesochi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#e8f4fd]/80 hover:bg-[#d4ecfa] transition-colors text-center"
          >
            <div className="h-7 w-7 rounded-lg bg-[#2AABEE] flex items-center justify-center shrink-0 shadow-sm">
              <Send className="h-3 w-3 text-white" />
            </div>
            <p className="text-[11px] font-bold text-neutral-900 leading-tight">Менеджер</p>
          </a>
        </div>
      </div>
    </>
  )

  if (inPanel) {
    return <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{inner}</div>
  }

  return (
    <div className="hidden xl:flex w-[270px] 2xl:w-[340px] flex-col shrink-0 p-3 pl-0 min-h-0">
      <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl overflow-hidden border border-black/[0.04]">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#5b328a] flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-neutral-900">Корзина</h3>
              <p className="text-[11px] text-neutral-400">
                {items.length === 0 ? "Пока пусто" : `${items.length} ${items.length === 1 ? "товар" : "товаров"} · ${formatWeight(totalWeight)}`}
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="ml-auto h-8 w-8 rounded-lg flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Очистить корзину"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        {inner}
      </div>
    </div>
  )
}
