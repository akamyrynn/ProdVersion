"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextValue {
  user: User | null
  loading: boolean
  userType: "client" | "admin" | null
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  userType: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const userType = user?.user_metadata?.user_type as
    | "client"
    | "admin"
    | null

  return (
    <AuthContext.Provider value={{ user, loading, userType }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
