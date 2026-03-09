import { NextRequest, NextResponse } from "next/server"
import { searchCities } from "@/lib/cdek"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const cities = await searchCities(q)
    return NextResponse.json(cities)
  } catch (e) {
    console.error("CDEK cities error:", e)
    return NextResponse.json({ error: "Ошибка поиска городов" }, { status: 500 })
  }
}
