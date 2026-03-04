"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ShoppingBag, RotateCcw, Calendar, X, FileText, Truck } from "lucide-react"
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/utils/format"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_METHOD_LABELS,
} from "@/lib/utils/constants"
import { repeatOrder } from "@/lib/actions/orders"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Order } from "@/types"

interface OrdersListProps {
  initialOrders: Order[]
}

type DateRange = "all" | "week" | "month" | "quarter" | "custom"

const dateRangeLabels: Record<DateRange, string> = {
  all: "За все время",
  week: "За неделю",
  month: "За месяц",
  quarter: "За квартал",
  custom: "Свой период",
}

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange>("all")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")

  const filteredOrders = useMemo(() => {
    let result = [...orders]

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter)
    }

    const now = new Date()
    if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter((o) => new Date(o.created_at) >= weekAgo)
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter((o) => new Date(o.created_at) >= monthAgo)
    } else if (dateRange === "quarter") {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      result = result.filter((o) => new Date(o.created_at) >= quarterAgo)
    } else if (dateRange === "custom") {
      if (customFrom) {
        result = result.filter(
          (o) => new Date(o.created_at) >= new Date(customFrom)
        )
      }
      if (customTo) {
        const toDate = new Date(customTo)
        toDate.setHours(23, 59, 59, 999)
        result = result.filter((o) => new Date(o.created_at) <= toDate)
      }
    }

    return result
  }, [orders, statusFilter, dateRange, customFrom, customTo])

  async function handleRepeatOrder(orderId: string) {
    const result = await repeatOrder(orderId)
    if (result.success) {
      toast.success("Товары добавлены в корзину")
    } else {
      toast.error(result.error || "Ошибка")
    }
  }

  function resetFilters() {
    setStatusFilter("all")
    setDateRange("all")
    setCustomFrom("")
    setCustomTo("")
  }

  const hasActiveFilters = statusFilter !== "all" || dateRange !== "all"

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52 h-9 text-[12px] rounded-lg">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as DateRange)}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 text-[12px] rounded-lg">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dateRangeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 px-3 text-[12px] border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 transition-colors"
            />
            <span className="text-[11px] text-neutral-400">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 px-3 text-[12px] border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 transition-colors"
            />
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X className="h-3 w-3" />
            Сбросить
          </button>
        )}

        <span className="ml-auto text-[11px] text-neutral-400 tabular-nums">
          {filteredOrders.length} из {orders.length}
        </span>
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-neutral-200 mb-4" />
          <p className="text-[14px] font-bold text-neutral-900">
            {hasActiveFilters ? "Нет заказов по фильтру" : "Пока нет заказов"}
          </p>
          <p className="text-[12px] text-neutral-400 mt-1">
            {hasActiveFilters
              ? "Попробуйте изменить параметры фильтрации"
              : "Ваши заказы появятся здесь"}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/dashboard/catalog"
              className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-bold text-[#5b328a] hover:text-[#4a2870] transition-colors"
            >
              Перейти в каталог
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-black/[0.04] px-4 sm:px-5 py-3 sm:py-4 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-black text-neutral-900 tabular-nums">
                      {formatOrderNumber(order.order_id)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        ORDER_STATUS_COLORS[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-neutral-400">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="text-neutral-200">·</span>
                    <span>
                      {DELIVERY_METHOD_LABELS[order.delivery_method]}
                    </span>
                    <span className="text-neutral-200">·</span>
                    <span>{order.items?.length || 0} позиц.</span>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <p className="text-[11px] text-neutral-400 truncate">
                      {order.items
                        .slice(0, 3)
                        .map(
                          (item) =>
                            `${item.product_name} ×${item.quantity}`
                        )
                        .join(", ")}
                      {order.items.length > 3 &&
                        ` +${order.items.length - 3}`}
                    </p>
                  )}
                  {(order.cdek_tracking_number || order.cap_2000_tracking_number) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Truck className="h-3 w-3 text-[#5b328a]" />
                      <span className="text-[11px] font-semibold text-[#5b328a]">
                        Трек: {order.cdek_tracking_number || order.cap_2000_tracking_number}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-[15px] sm:text-[16px] font-black text-neutral-900 tabular-nums">
                      {formatPrice(order.total)}
                    </div>
                  </div>
                  <div className="ml-auto sm:ml-0 flex items-center gap-2">
                    <a
                      href={`/api/invoice?orderId=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 bg-neutral-100 rounded-lg hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="hidden sm:inline">Счёт</span>
                    </a>
                    <button
                      onClick={() => handleRepeatOrder(order.id)}
                      className="h-8 px-2.5 sm:px-3 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 bg-neutral-100 rounded-lg hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span className="hidden sm:inline">Повторить</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
