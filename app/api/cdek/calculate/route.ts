import { NextRequest, NextResponse } from "next/server"
import { calculateTariff } from "@/lib/cdek"

export async function POST(req: NextRequest) {
  try {
    const { cityCode, weightGrams } = await req.json()

    if (!cityCode || !weightGrams) {
      return NextResponse.json(
        { error: "cityCode и weightGrams обязательны" },
        { status: 400 },
      )
    }

    const tariffs = await calculateTariff(
      Number(cityCode),
      Number(weightGrams),
    )

    // delivery_mode: 1=дверь-дверь, 2=дверь-склад, 3=склад-дверь, 4=склад-склад
    // Courier = modes 1 & 3 (to door), Pickup = modes 2 & 4 (to warehouse/PVZ)
    const courierTariffs = tariffs
      .filter((t) => t.delivery_mode === 1 || t.delivery_mode === 3)
      .sort((a, b) => a.delivery_sum - b.delivery_sum)

    const pickupTariffs = tariffs
      .filter((t) => t.delivery_mode === 2 || t.delivery_mode === 4)
      .sort((a, b) => a.delivery_sum - b.delivery_sum)

    const mapTariff = (t: typeof tariffs[0]) => ({
      code: t.tariff_code,
      name: t.tariff_name,
      price: t.delivery_sum,
      minDays: t.period_min,
      maxDays: t.period_max,
      mode: t.delivery_mode,
    })

    return NextResponse.json({
      courier: courierTariffs.map(mapTariff),
      pickup: pickupTariffs.map(mapTariff),
    })
  } catch (e) {
    console.error("CDEK calculate error:", e)
    const message = e instanceof Error ? e.message : "Ошибка расчёта"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
