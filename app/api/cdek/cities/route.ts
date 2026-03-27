import { NextRequest, NextResponse } from "next/server"
import { searchCities } from "@/lib/cdek"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    if (!process.env.CDEK_CLIENT_ID || !process.env.CDEK_CLIENT_SECRET) {
      console.error("CDEK env vars missing: CDEK_CLIENT_ID or CDEK_CLIENT_SECRET not set")
      return NextResponse.json({ error: "СДЭК не настроен" }, { status: 500 })
    }
    const cities = await searchCities(q)
    return NextResponse.json(cities)
  } catch (e) {
    console.error("CDEK cities error:", e)
    return NextResponse.json({ error: "Ошибка поиска городов" }, { status: 500 })
  }
}
