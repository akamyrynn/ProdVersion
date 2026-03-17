import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { createClient } from "@/lib/supabase/server"
import { generateInvoicePDF } from "@/lib/generate-invoice"

// Company (seller) defaults — 10coffee details
const SELLER = {
  name: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ПЕЙДЖ КОФЕ"',
  inn: "2366021670",
  kpp: "236601001",
  address: "354003, Россия, Краснодарский край, г Сочи, ул Пластунская, 79/1, 1",
  bank: "ЮГО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК, г Ростов-на-Дону",
  bik: "046015602",
  account: "40702810230060009772",
  corrAccount: "30101810600000000602",
  director: "Тен Игорь Олегович",
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orderId = req.nextUrl.searchParams.get("orderId")
    if (!orderId) {
      return NextResponse.json({ error: "orderId required" }, { status: 400 })
    }

    // Fetch order from Payload
    const payload = await getPayload({ config: configPromise })
    const doc = await payload.findByID({
      collection: "orders",
      id: orderId,
      depth: 1,
    }) as any

    if (!doc) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify ownership — support both old (client_user_id) and new (client relationship) orders
    const clientRef = doc.client
    const clientSupabaseId = typeof clientRef === "object" ? clientRef?.supabaseId : null

    if (clientSupabaseId) {
      // New order: client relationship exists
      if (clientSupabaseId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } else {
      // Old order: check client_user_id column directly via Supabase
      const { data: rawOrder } = await supabase
        .from("orders")
        .select("client_user_id")
        .eq("id", orderId)
        .single()

      if (!rawOrder || rawOrder.client_user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // VAT rate from order (set by global settings or admin override)
    const rateStr = doc.vatRate || "none"
    let VAT_RATE = 0
    if (rateStr !== "none") {
      VAT_RATE = rateStr === "custom" ? (Number(doc.vatCustomRate) || 0) : Number(rateStr)
    }
    const vatLabel = VAT_RATE > 0 ? `${VAT_RATE}%` : ""

    // Build items — support both Payload embedded items and old order_items table
    let items: any[] = []

    if (doc.items && doc.items.length > 0) {
      // New order: items embedded in Payload
      items = doc.items.map((item: any) => ({
        name: `${item.productName}${item.variantName ? ` (${item.variantName})` : ""}${item.grindOption ? `, ${item.grindOption}` : ""}`,
        quantity: Number(item.quantity) || 0,
        unit: "шт",
        price: Number(item.unitPrice) || 0,
        vat: vatLabel,
        total: Number(item.totalPrice) || 0,
      }))
    } else {
      // Old order: items in separate order_items table
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)

      items = (orderItems || []).map((item: any) => ({
        name: `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}${item.grind_option ? `, ${item.grind_option}` : ""}`,
        quantity: Number(item.quantity) || 0,
        unit: "шт",
        price: Number(item.unit_price) || 0,
        vat: vatLabel,
        total: Number(item.total_price) || 0,
      }))
    }

    // Resolve buyer info — support both inline company fields and old company_id
    let buyerName = doc.companyName || "—"
    let buyerInn = doc.companyInn || "—"
    let buyerKpp = "—"
    let buyerAddress = "—"

    if (buyerName === "—") {
      // Try old company_id
      const { data: rawOrder } = await supabase
        .from("orders")
        .select("company_id")
        .eq("id", orderId)
        .single()

      if (rawOrder?.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("*")
          .eq("id", rawOrder.company_id)
          .single()

        if (company) {
          buyerName = company.name || "—"
          buyerInn = company.inn || "—"
          buyerKpp = company.kpp || "—"
          buyerAddress = company.legal_address || company.actual_address || "—"
        }
      }
    }

    const invoiceDate = new Date(doc.createdAt).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: doc.orderId || String(doc.id),
      invoiceDate,
      sellerName: SELLER.name,
      sellerInn: SELLER.inn,
      sellerKpp: SELLER.kpp,
      sellerAddress: SELLER.address,
      sellerBank: SELLER.bank,
      sellerBik: SELLER.bik,
      sellerAccount: SELLER.account,
      sellerCorrAccount: SELLER.corrAccount,
      sellerDirector: SELLER.director,
      buyerName,
      buyerInn,
      buyerKpp,
      buyerAddress,
      items,
      subtotal: Number(doc.subtotal) || 0,
      discountAmount: Number(doc.discountAmount) || 0,
      deliveryCost: Number(doc.deliveryCost) || 0,
      vatLabel,
      vatAmount: VAT_RATE > 0
        ? Math.round((Number(doc.total) || 0) * VAT_RATE / (100 + VAT_RATE) * 100) / 100
        : 0,
      total: Number(doc.total) || 0,
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="schet-${doc.orderId || doc.id}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error("Invoice generation error:", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
