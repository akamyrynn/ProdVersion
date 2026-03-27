"use client"

import { CartSidebar } from "@/components/dashboard/cart-sidebar"
import { useCart } from "@/providers/cart-provider"

export function DashboardCartPanel() {
  const { items, updateQuantity, removeItem, clearCart } = useCart()

  return (
    <CartSidebar
      items={items}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
      onClearCart={clearCart}
    />
  )
}
