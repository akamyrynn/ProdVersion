import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ notifications: [] }, { status: 401 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: data || [] })
}

export async function PATCH(request: NextRequest) {
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const db = createAdminClient()

  if (body?.all) {
    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("client_id", user.id)
      .eq("is_read", false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (typeof body?.id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", body.id)
    .eq("client_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
