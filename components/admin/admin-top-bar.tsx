"use client"

import { useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { adminSignOut } from "@/lib/actions/auth"
import { LogOut, User, ChevronDown, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export function AdminTopBar() {
  const { user } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  const displayName =
    user?.user_metadata?.full_name || user?.email || "Администратор"
  const role = user?.user_metadata?.admin_role || "ADMIN"

  async function handleSignOut() {
    setSigningOut(true)
    await adminSignOut()
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1" />

      <Badge variant="outline" className="gap-1 text-xs">
        <Shield className="h-3 w-3" />
        {role === "ADMIN" ? "Администратор" : "Менеджер"}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline-block text-sm max-w-[150px] truncate">
              {displayName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
