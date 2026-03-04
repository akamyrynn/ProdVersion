"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import type { Notification } from "@/types"
import { toast } from "sonner"

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
  const supabase = createClient()

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data as Notification[])
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `client_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          toast.info(newNotification.title, {
            description: newNotification.message,
          })
          setHasNewNotification(true)
          setTimeout(() => setHasNewNotification(false), 2000)

          // Animate browser tab title
          if (typeof document !== "undefined" && document.hidden) {
            const originalTitle = document.title
            let blink = true
            const interval = setInterval(() => {
              document.title = blink
                ? `🔔 ${newNotification.title}`
                : originalTitle
              blink = !blink
            }, 1500)

            const restore = () => {
              clearInterval(interval)
              document.title = originalTitle
              document.removeEventListener("visibilitychange", onVisible)
            }

            const onVisible = () => {
              if (!document.hidden) restore()
            }

            document.addEventListener("visibilitychange", onVisible)
            // Auto-stop after 30s
            setTimeout(restore, 30000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
    },
    [supabase]
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("client_id", user.id)
      .eq("is_read", false)
  }, [user, supabase])

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
