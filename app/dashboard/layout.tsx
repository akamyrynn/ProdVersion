import type { Metadata } from "next"
import { AuthProvider } from "@/providers/auth-provider"
import { CartProvider } from "@/providers/cart-provider"
import { NotificationProvider } from "@/providers/notification-provider"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { HtmlWrapper } from "@/components/shared/html-wrapper"

export const metadata: Metadata = {
  title: "Оптовая платформа - 10coffee",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <HtmlWrapper>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <DashboardShell>{children}</DashboardShell>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </HtmlWrapper>
  )
}
