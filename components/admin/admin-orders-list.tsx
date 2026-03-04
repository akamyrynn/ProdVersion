"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye } from "lucide-react"
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/utils/format"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_METHOD_LABELS,
} from "@/lib/utils/constants"
import { updateOrderStatus } from "@/lib/actions/orders"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Order, OrderStatus } from "@/types"

interface AdminOrdersListProps {
  initialOrders: Order[]
}

export function AdminOrdersList({ initialOrders }: AdminOrdersListProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter)

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Статус обновлён")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Доставка</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {formatOrderNumber(order.order_id)}
                  </TableCell>
                  <TableCell>
                    {(order.client as any)?.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        handleStatusChange(order.id, v as OrderStatus)
                      }
                    >
                      <SelectTrigger className="w-44 h-8">
                        <Badge
                          className={cn(
                            "text-xs",
                            ORDER_STATUS_COLORS[order.status]
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORDER_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{DELIVERY_METHOD_LABELS[order.delivery_method]}</div>
                    {(order.cdek_tracking_number || order.cap_2000_tracking_number) && (
                      <div className="text-xs font-mono text-[#5b328a] mt-0.5">
                        {order.cdek_tracking_number || order.cap_2000_tracking_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Нет заказов
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
