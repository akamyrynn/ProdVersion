"use client"

import { TopBar } from "@/components/dashboard/top-bar"
import { useNotifications } from "@/providers/notification-provider"

export function DashboardTopBar() {
  const { unreadCount } = useNotifications()
  return <TopBar notificationCount={unreadCount} />
}
