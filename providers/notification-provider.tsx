"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { useAuth } from "@/providers/auth-provider"
import type { Notification } from "@/types"

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  hasNewNotification: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNewNotification, setHasNewNotification] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    const res = await fetch("/api/notifications", { cache: "no-store" })
    if (res.ok) {
      const json = await res.json()
      setNotifications((json.notifications || []) as Notification[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  useEffect(() => {
    if (!user) return

    const interval = window.setInterval(() => {
      void loadNotifications()
      setHasNewNotification(true)
      window.setTimeout(() => setHasNewNotification(false), 1200)
    }, 30000)

    return () => window.clearInterval(interval)
  }, [user, loadNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
  }, [user])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasNewNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    )
  }
  return context
}
