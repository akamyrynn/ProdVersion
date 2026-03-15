"use server"

import { createClient } from "@/lib/supabase/server"

async function resolveMediaUrls(items: any[]) {
  if (!items.length) return items

  const mediaIds = items
    .map((item) => item.cover_image)
    .filter((id) => typeof id === "number")

  if (mediaIds.length === 0) return items

  const supabase = await createClient()
  const { data: mediaItems } = await supabase
    .from("media")
    .select("id, url, filename")
    .in("id", mediaIds)

  const mediaMap = new Map(
    (mediaItems || []).map((m: any) => [m.id, m.url || `/api/media/file/${m.filename}`])
  )

  return items.map((item) => ({
    ...item,
    cover_image:
      typeof item.cover_image === "number"
        ? mediaMap.get(item.cover_image) || null
        : item.cover_image,
  }))
}

export async function getNewsPaginated(offset: number, limit: number = 10) {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from("news")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  const resolved = await resolveMediaUrls(data || [])

  return {
    items: resolved,
    total: count || 0,
  }
}

export async function getNewsById(id: string) {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (!item) return null

  const [resolved] = await resolveMediaUrls([item])
  return resolved
}
