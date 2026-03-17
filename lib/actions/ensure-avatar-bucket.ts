"use server"

import { createAdminClient } from "@/lib/supabase/admin"

let bucketChecked = false

export async function ensureAvatarBucket() {
  if (bucketChecked) return

  const admin = createAdminClient()
  const { data: buckets } = await admin.storage.listBuckets()
  const exists = buckets?.some((b) => b.id === "avatars")

  if (!exists) {
    await admin.storage.createBucket("avatars", { public: true })
  }

  bucketChecked = true
}
