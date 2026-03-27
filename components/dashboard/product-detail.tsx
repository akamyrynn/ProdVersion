"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Heart,
  Plus,
  Minus,
  Star,
  MapPin,
  Flame,
  Mountain,
  Beaker,
  Award,
  ChevronRight,
  Check,
  Download,
  FileText,
  Coffee,
  Leaf,
  ThermometerSun,
  Droplets,
  ShoppingBag,
} from "lucide-react"
import { useCart } from "@/providers/cart-provider"
import { toggleFavorite } from "@/lib/actions/products"
import { formatPrice } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import { getTagBgClass } from "@/lib/utils/constants"
import type { Product, ProductVariant } from "@/types"

interface ProductDetailProps {
  product: Product
  isFavorite: boolean
}

export function ProductDetail({ product, isFavorite: initialFav }: ProductDetailProps) {
  const { addItem } = useCart()
  const [isFavorite, setIsFavorite] = useState(initialFav)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  )
  const [quantity, setQuantity] = useState(1)
  const [grind, setGrind] = useState<string>(selectedVariant?.grind_options?.[0] || "")
  const [isPending, startTransition] = useTransition()
  const [activeImage, setActiveImage] = useState(0)
  const [added, setAdded] = useState(false)

  function handleFavorite() {
    setIsFavorite(!isFavorite)
    startTransition(async () => {
      const result = await toggleFavorite(product.id)
      if ("isFavorite" in result) {
        setIsFavorite(result.isFavorite ?? false)
      }
    })
  }

  async function handleAddToCart() {
    if (!selectedVariant) return
    await addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
      grindOption: grind || undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    setQuantity(1)
  }

  const isCoffee = product.product_type === "coffee"
  const isTea = product.product_type === "tea"

  const coffeeSpecs = isCoffee
    ? [
        { icon: Flame, label: "Обжарщик", value: product.roaster },
        { icon: ThermometerSun, label: "Степень обжарки", value: product.roast_level },
        { icon: MapPin, label: "Регион", value: product.region },
        { icon: Beaker, label: "Обработка", value: product.processing_method },
        { icon: Mountain, label: "Высота произрастания", value: product.growing_height },
        { icon: Award, label: "Q-грейд", value: product.q_grader_rating ? `${product.q_grader_rating} баллов` : null },
      ].filter((s) => s.value)
    : []

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/catalog"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-900 text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Каталог</span>
      </Link>

      <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-[1fr_1fr]">
        {/* ── LEFT: Gallery ── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="aspect-square rounded-2xl bg-gradient-to-br bg-[#faead5] overflow-hidden relative group">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[activeImage] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Coffee className="h-16 w-16 text-neutral-200" />
              </div>
            )}

            {/* Stickers */}
            {product.stickers && product.stickers.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.stickers.map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      "text-[11px] font-bold px-3 py-1 rounded-full shadow-lg",
                      getTagBgClass(tag.color)
                    )}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Q-rating badge */}
            {product.q_grader_rating && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Star className="h-3.5 w-3.5 text-[#e6610d] fill-[#e6610d]" />
                <span className="text-[13px] font-bold text-white">Q {product.q_grader_rating}</span>
              </div>
            )}

            {/* Favorite */}
            <button
              onClick={handleFavorite}
              disabled={isPending}
              className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-neutral-400"
                )}
              />
            </button>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                    activeImage === i
                      ? "border-[#5b328a] shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info ── */}
        <div className="space-y-6">
          {/* Title & region */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {product.name}
            </h1>
            {product.region && (
              <div className="flex items-center gap-1.5 mt-2 text-neutral-400">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{product.region}</span>
              </div>
            )}
          </div>

          {/* Coffee specs grid */}
          {coffeeSpecs.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {coffeeSpecs.map((spec) => (
                <div
                  key={spec.label}
                  className="bg-neutral-50 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                    <spec.icon className="h-4 w-4 text-[#5b328a]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-medium">{spec.label}</p>
                    <p className="text-sm font-semibold text-neutral-800 mt-0.5">{spec.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Фасовка</h3>
              <div className="flex gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v)
                      setGrind(v.grind_options?.[0] || "")
                    }}
                    disabled={!v.is_available}
                    className={cn(
                      "px-5 py-3 rounded-xl text-sm font-semibold transition-all",
                      selectedVariant?.id === v.id
                        ? "bg-[#5b328a] text-white shadow-lg shadow-[#5b328a]/20"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                      !v.is_available && "opacity-40 cursor-not-allowed line-through"
                    )}
                  >
                    <span className="block">{v.name}</span>
                    <span className={cn(
                      "block text-[13px] mt-0.5",
                      selectedVariant?.id === v.id ? "text-white/70" : "text-neutral-400"
                    )}>
                      {formatPrice(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grind selector */}
          {selectedVariant && selectedVariant.grind_options && selectedVariant.grind_options.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Помол</h3>
              <div className="flex gap-2">
                {selectedVariant.grind_options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGrind(opt)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                      grind === opt
                        ? "bg-[#faead5] text-[#1d1d1b] ring-2 ring-[#5b328a]"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + Add to cart */}
          {selectedVariant && (
            <div className="bg-gradient-to-r bg-[#faead5]/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">Итого</p>
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900 mt-0.5">
                    {formatPrice(selectedVariant.price * quantity)}
                  </p>
                </div>
                {/* Quantity */}
                <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-neutral-900 text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-300",
                  added
                    ? "bg-[#5b328a] text-white shadow-lg shadow-[#5b328a]/30 scale-[1.02]"
                    : "bg-[#5b328a] text-white hover:bg-[#4a2870] hover:shadow-xl active:scale-[0.98]"
                )}
              >
                {added ? (
                  <>
                    <Check className="h-5 w-5" />
                    Добавлено!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    В корзину
                  </>
                )}
              </button>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Описание</h3>
              <div
                className="text-sm text-neutral-600 leading-relaxed prose prose-sm max-w-none prose-img:rounded-xl prose-img:shadow-md prose-headings:text-neutral-900 prose-strong:text-neutral-800"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTIONS ── */}
      <div className="mt-10 space-y-10">
        {/* Brewing methods (coffee) */}
        {isCoffee && product.brewing_methods && product.brewing_methods.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-[#faead5] flex items-center justify-center">
                <Coffee className="h-5 w-5 text-[#5b328a]" />
              </div>
              <h2 className="text-lg font-black text-neutral-900">Способы приготовления</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {product.brewing_methods.map((method, i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-[#faead5]/50 transition-all duration-300 group"
                >
                  {method.image_url && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-neutral-50">
                      <img
                        src={method.image_url}
                        alt={method.method}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-[#faead5]/50 flex items-center justify-center">
                      <Droplets className="h-3.5 w-3.5 text-[#5b328a]" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm">{method.method}</h4>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{method.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Brewing instructions (tea) */}
        {isTea && product.brewing_instructions && product.brewing_instructions.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-[#faead5] flex items-center justify-center">
                <Leaf className="h-5 w-5 text-[#5b328a]" />
              </div>
              <h2 className="text-lg font-black text-neutral-900">Как заваривать</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {product.brewing_instructions.map((instr, i) => (
                <div
                  key={i}
                  className="bg-white border border-neutral-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-[#faead5]/50 transition-all duration-300 group"
                >
                  {instr.image_url && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-neutral-50">
                      <img
                        src={instr.image_url}
                        alt={instr.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-[#faead5]/50 flex items-center justify-center text-sm font-black text-[#5b328a]">
                      {i + 1}
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm">{instr.title}</h4>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{instr.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attached files */}
        {product.attached_files && product.attached_files.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-[#faead5] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#e6610d]" />
              </div>
              <h2 className="text-lg font-black text-neutral-900">Файлы</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {product.attached_files.map((file, i) => (
                <a
                  key={i}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-neutral-100 rounded-xl p-4 hover:shadow-md hover:border-[#e6610d]/30 transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#faead5]/50 flex items-center justify-center shrink-0">
                    <Download className="h-4 w-4 text-[#e6610d] group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-800 truncate">{file.name}</p>
                    {file.size > 0 && (
                      <p className="text-[11px] text-neutral-400">
                        {(file.size / 1024).toFixed(0)} КБ
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-[#e6610d] transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Video URLs */}
        {product.video_urls && product.video_urls.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-neutral-900 mb-5">Видео</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {product.video_urls.map((url, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-neutral-100">
                  <iframe
                    src={url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
