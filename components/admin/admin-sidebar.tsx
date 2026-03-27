"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Coffee,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Ticket,
  Newspaper,
  Settings,
  LayoutDashboard,
  Shield,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

const mainNavItems = [
  {
    title: "Обзор",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
]

const catalogNavItems = [
  {
    title: "Товары",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Категории",
    href: "/admin/categories",
    icon: FolderTree,
  },
]

const businessNavItems = [
  {
    title: "Заказы",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Клиенты",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Промокоды",
    href: "/admin/promo-codes",
    icon: Ticket,
  },
]

const contentNavItems = [
  {
    title: "Новости",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    title: "Настройки",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  function renderGroup(
    label: string,
    items: { title: string; href: string; icon: typeof LayoutDashboard; exact?: boolean }[]
  ) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active = isActive(item.href, "exact" in item ? item.exact : false)
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      "h-9 px-3 gap-3 text-sm",
                      active && "font-medium"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="px-6 py-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Coffee className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight text-primary">
            10coffee
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            <Shield className="h-2.5 w-2.5" />
            Админ
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Главная", mainNavItems)}
        {renderGroup("Каталог", catalogNavItems)}
        {renderGroup("Бизнес", businessNavItems)}
        {renderGroup("Контент", contentNavItems)}
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <div className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} 10coffee Admin
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
