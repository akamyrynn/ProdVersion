import { NextRequest, NextResponse } from "next/server"
import { getDeliveryPoints } from "@/lib/cdek"

export async function GET(req: NextRequest) {
  const cityCode = req.nextUrl.searchParams.get("cityCode")
  if (!cityCode) {
    return NextResponse.json([])
  }

  try {
    const offices = await getDeliveryPoints(Number(cityCode))
    return NextResponse.json(offices)
  } catch (e) {
    console.error("CDEK offices error:", e)
    return NextResponse.json({ error: "Ошибка загрузки пунктов выдачи" }, { status: 500 })
  }
}
