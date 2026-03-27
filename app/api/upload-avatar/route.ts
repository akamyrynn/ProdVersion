import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${user.id}.jpg`
  const key = `avatars/${fileName}`

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET || "10coffee",
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  )

  const url = `/api/avatar/${fileName}?t=${Date.now()}`

  return NextResponse.json({ url })
}
