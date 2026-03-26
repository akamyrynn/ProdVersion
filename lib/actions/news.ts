"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function resolveMediaUrls(items: any[]) {
  if (!items.length) return items

  // Collect all numeric media IDs from cover_image_id or cover_image
  const mediaIds = items
    .map((item) => item.cover_image_id ?? item.cover_image)
    .filter((id) => typeof id === "number")

  // Also collect media IDs from Lexical rich-text content (upload nodes)
  const contentMediaIds: number[] = []
  function walkLexical(node: any) {
    if (!node) return
    if (node.type === "upload" && node.value?.id && typeof node.value.id === "number") {
      contentMediaIds.push(node.value.id)
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walkLexical)
    }
  }
  for (const item of items) {
    if (item.content && typeof item.content === "object") {
      walkLexical(item.content.root || item.content)
    }
  }

  const allIds = [...new Set([...mediaIds, ...contentMediaIds])]
  if (allIds.length === 0) return items

  // Use admin client to bypass RLS on Payload-managed media table
  const admin = createAdminClient()
  const { data: mediaItems } = await admin
    .from("media")
    .select("id, url, filename")
    .in("id", allIds)

  const mediaMap = new Map(
    (mediaItems || []).map((m: any) => [m.id, m.url || `/api/media/file/${m.filename}`])
  )

  // Patch upload nodes in Lexical content with resolved src
  function patchLexical(node: any): any {
    if (!node) return node
    if (node.type === "upload" && node.value?.id && typeof node.value.id === "number") {
      const resolvedUrl = mediaMap.get(node.value.id)
      if (resolvedUrl) {
        return { ...node, src: resolvedUrl }
      }
    }
    if (Array.isArray(node.children)) {
      return { ...node, children: node.children.map(patchLexical) }
    }
    return node
  }

  return items.map((item) => {
    let content = item.content
    if (content && typeof content === "object" && content.root) {
      content = { ...content, root: patchLexical(content.root) }
    }

    return {
      ...item,
      content,
      cover_image:
        typeof item.cover_image_id === "number"
          ? mediaMap.get(item.cover_image_id) || null
          : typeof item.cover_image === "number"
            ? mediaMap.get(item.cover_image) || null
            : item.cover_image,
    }
  })
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
