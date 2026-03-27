import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || "10coffee",
        Key: `avatars/${filename}`,
      })
    )

    const bytes = await result.Body?.transformToByteArray()
    if (!bytes) return new NextResponse(null, { status: 404 })

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": result.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
