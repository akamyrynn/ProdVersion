import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

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
  const dir = path.join(process.cwd(), "public", "uploads", "avatars")

  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, fileName), buffer)

  const url = `/uploads/avatars/${fileName}?t=${Date.now()}`

  return NextResponse.json({ url })
}
