import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { dbQuery } from "@/lib/db"

export async function GET() {
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  return NextResponse.json({ user })
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
  const data = body?.data && typeof body.data === "object"
    ? body.data as Record<string, unknown>
    : undefined
  const password = typeof body?.password === "string" ? body.password : undefined

  const { data: result, error } = await auth.auth.updateUser({ data, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data) {
    await dbQuery(
      `update public.client_profiles
          set full_name = coalesce($2, full_name),
              phone = coalesce($3, phone),
              updated_at = now()
        where id = $1`,
      [
        user.id,
        typeof data.full_name === "string" ? data.full_name : null,
        typeof data.phone === "string" ? data.phone : null,
      ]
    )
  }

  return NextResponse.json({ user: result.user })
}
