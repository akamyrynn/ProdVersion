import { NextRequest, NextResponse } from "next/server"
import { getProductsByCategory } from "@/lib/actions/products"

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId")

  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 })
  }

  try {
    const products = await getProductsByCategory(categoryId)
    return NextResponse.json({ products })
  } catch (error) {
    console.error("Failed to load catalog products", error)
    return NextResponse.json({ error: "Failed to load catalog products" }, { status: 500 })
  }
}
