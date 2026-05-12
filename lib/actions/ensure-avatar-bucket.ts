"use server"

let bucketChecked = false

export async function ensureAvatarBucket() {
  if (bucketChecked) return
  // Avatars are stored in the configured S3/MinIO bucket now.
  bucketChecked = true
}
