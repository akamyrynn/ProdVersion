"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export async function saveQuickComments(
  comments: string[]
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: "Не авторизован" }

  const db = createAdminClient()
  const { error } = await db
    .from("client_settings")
    .upsert(
      { client_id: userId, quick_comments: comments },
      { onConflict: "client_id" }
    )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getQuickComments(): Promise<string[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const db = createAdminClient()
  const { data } = await db
    .from("client_settings")
    .select("quick_comments")
    .eq("client_id", userId)
    .single()

  return data?.quick_comments || []
}
