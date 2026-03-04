import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateInvoicePDF } from "@/lib/generate-invoice"

// Company (seller) defaults — 10coffee details
const SELLER = {
  name: "IP Laboreshnikov Andrej Olegovich",
  inn: "742903438805",
  address: "Chelyabinskaya obl., Verhneuralskij r-n, g. Verhneuralsk, ul. Lenina, d. 138",
  bank: 'AO "TBank"',
  bik: "044525974",
  account: "40802810100001068216",
  corrAccount: "30101810145250000974",
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orderId = req.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 })
  }

  // Fetch order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Verify ownership (client can only download their own)
  if (order.client_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Fetch related data separately
  const [orderItemsRes, companyRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id),
    order.company_id
      ? supabase.from("companies").select("*").eq("id", order.company_id).single()
      : Promise.resolve({ data: null }),
  ])

  const company = companyRes.data || {}
  const items = (orderItemsRes.data || []).map((item: any) => ({
    name: `${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ""}${item.grind_option ? `, ${item.grind_option}` : ""}`,
    quantity: item.quantity,
    unit: "sht",
    price: item.unit_price,
    vat: "bez NDS",
    total: item.total_price,
  }))

  const invoiceDate = new Date(order.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const pdfBuffer = await generateInvoicePDF({
    invoiceNumber: String(order.order_number),
    invoiceDate,
    sellerName: SELLER.name,
    sellerInn: SELLER.inn,
    sellerAddress: SELLER.address,
    sellerBank: SELLER.bank,
    sellerBik: SELLER.bik,
    sellerAccount: SELLER.account,
    sellerCorrAccount: SELLER.corrAccount,
    buyerName: company.name || "—",
    buyerInn: company.inn || "—",
    buyerKpp: company.kpp || "—",
    buyerAddress: company.legal_address || company.actual_address || "—",
    items,
    total: order.total,
  })

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="schet-${order.order_number}.pdf"`,
    },
  })
}
