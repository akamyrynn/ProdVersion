import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { query, city } = await request.json()

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.DADATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          count: 5,
          ...(city ? {
            from_bound: { value: "street" },
            to_bound: { value: "house" },
            locations: [{ city }],
          } : {}),
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] })
    }

    const data = await response.json()
    const suggestions = (data.suggestions || []).map((s: any) => ({
      value: s.value,
      unrestricted: s.unrestricted_value,
    }))

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
