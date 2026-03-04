import { PDFDocument, rgb } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { readFileSync } from "fs"
import { join } from "path"

// Cache font bytes at module level
let fontRegularBytes: Buffer | null = null
let fontMediumBytes: Buffer | null = null

function loadFonts() {
  if (!fontRegularBytes) {
    const dir = join(process.cwd(), "public", "fonts")
    fontRegularBytes = readFileSync(join(dir, "GoogleSans-Regular.ttf"))
    fontMediumBytes = readFileSync(join(dir, "GoogleSans-Medium.ttf"))
  }
  return { regular: fontRegularBytes, medium: fontMediumBytes! }
}

interface InvoiceItem {
  name: string
  quantity: number
  unit: string
  price: number
  vat: string
  total: number
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  sellerName: string
  sellerInn: string
  sellerAddress: string
  sellerBank: string
  sellerBik: string
  sellerAccount: string
  sellerCorrAccount: string
  buyerName: string
  buyerInn: string
  buyerKpp: string
  buyerAddress: string
  items: InvoiceItem[]
  total: number
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fonts = loadFonts()
  const font = await pdfDoc.embedFont(fonts.regular)
  const fontBold = await pdfDoc.embedFont(fonts.medium)

  const page = pdfDoc.addPage([595, 842]) // A4
  const { height } = page.getSize()

  const margin = 40
  let y = height - margin
  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)

  function text(t: string, x: number, yPos: number, size = 8, f = font, color = black) {
    page.drawText(t, { x, y: yPos, size, font: f, color })
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: black })
  }

  // --- QR Code ---
  const qrPayload = [
    "ST00012",
    `Name=${data.sellerName}`,
    `PersonalAcc=${data.sellerAccount}`,
    `BankName=${data.sellerBank}`,
    `BIC=${data.sellerBik}`,
    `CorrespAcc=${data.sellerCorrAccount}`,
    `PayeeINN=${data.sellerInn}`,
    `Purpose=Оплата по счёту №${data.invoiceNumber} от ${data.invoiceDate}`,
    `Sum=${Math.round(data.total * 100)}`,
  ].join("|")

  try {
    const qrPng = await QRCode.toBuffer(qrPayload, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: "M",
    })
    const qrImage = await pdfDoc.embedPng(qrPng)
    page.drawImage(qrImage, { x: 480, y: y - 80, width: 80, height: 80 })
  } catch {
    // QR failed, continue
  }

  // --- Header ---
  text("Предоплата 50%", margin, y - 10, 8, font, gray)
  y -= 30

  // --- Bank details ---
  const bx = margin
  const bw = 400

  line(bx, y, bx + bw, y)
  text(`Банк: ${data.sellerBank}`, bx + 4, y - 10, 7)
  text(`БИК: ${data.sellerBik}`, bx + 280, y - 10, 7)
  line(bx, y - 14, bx + bw, y - 14)
  text(`Сч. №: ${data.sellerCorrAccount}`, bx + 280, y - 24, 7)
  line(bx, y - 28, bx + bw, y - 28)

  text(`ИНН: ${data.sellerInn}`, bx + 4, y - 38, 7)
  text(`Сч. №: ${data.sellerAccount}`, bx + 280, y - 38, 7)
  line(bx, y - 42, bx + bw, y - 42)
  text(data.sellerName, bx + 4, y - 52, 7)
  line(bx, y - 56, bx + bw, y - 56)

  // Vertical divider
  line(bx + 270, y, bx + 270, y - 56)
  // Outer
  line(bx, y, bx, y - 56)
  line(bx + bw, y, bx + bw, y - 56)

  y -= 68

  // --- Buyer ---
  text("Покупатель:", bx, y, 7, fontBold)
  text(data.buyerName, bx + 60, y, 7)
  y -= 12
  text(`ИНН ${data.buyerInn}, КПП ${data.buyerKpp}`, bx + 60, y, 7)
  y -= 12
  text(data.buyerAddress, bx + 60, y, 7)
  y -= 20

  // --- Invoice title ---
  text(`Счёт на оплату № ${data.invoiceNumber} от ${data.invoiceDate}`, bx, y, 14, fontBold)
  y -= 18

  // --- Supplier ---
  text("Поставщик:", bx, y, 7, fontBold)
  text(`${data.sellerName}, ${data.sellerAddress}`, bx + 60, y, 7)
  y -= 12
  text("Покупатель:", bx, y, 7, fontBold)
  text(`${data.buyerName}, ${data.buyerAddress}`, bx + 60, y, 7)
  y -= 18

  // --- Items table ---
  const tw = 515
  const cols = [30, 230, 40, 35, 50, 60, 70]
  const headers = ["№", "Товары (работы, услуги)", "Кол-во", "Ед.", "НДС", "Цена", "Сумма"]

  // Header row
  page.drawRectangle({ x: bx, y: y - 14, width: tw, height: 14, color: rgb(0.95, 0.95, 0.95) })
  let cx = bx
  headers.forEach((h, i) => {
    text(h, cx + 3, y - 11, 6, fontBold)
    line(cx, y, cx, y - 14)
    cx += cols[i]
  })
  line(cx, y, cx, y - 14)
  line(bx, y, bx + tw, y)
  line(bx, y - 14, bx + tw, y - 14)
  y -= 14

  // Data rows
  data.items.forEach((item, idx) => {
    const rh = 12
    cx = bx
    const vals = [
      String(idx + 1),
      item.name.length > 45 ? item.name.substring(0, 42) + "..." : item.name,
      String(item.quantity),
      item.unit,
      item.vat,
      item.price.toFixed(2),
      item.total.toFixed(2),
    ]
    vals.forEach((v, i) => {
      text(v, cx + 3, y - 9, 7)
      line(cx, y, cx, y - rh)
      cx += cols[i]
    })
    line(cx, y, cx, y - rh)
    line(bx, y - rh, bx + tw, y - rh)
    y -= rh
  })

  // --- Totals ---
  y -= 10
  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0)
  text(`Всего наименований ${totalItems}, на сумму ${data.total.toFixed(2)} руб.`, bx, y, 8)
  y -= 16

  text("Итого к оплате:", bx + 300, y, 12, fontBold)
  text(`${data.total.toFixed(2)}`, bx + 420, y, 12, fontBold)
  y -= 14
  text(`${Math.floor(data.total)} руб. ${((data.total % 1) * 100).toFixed(0).padStart(2, "0")} коп.`, bx, y, 8)
  y -= 30

  // --- Signature ---
  text("Индивидуальный предприниматель", bx, y, 8)
  line(bx + 170, y - 2, bx + 350, y - 2)
  const sellerShort = data.sellerName.replace(/^ИП\s*/i, "")
  text(sellerShort, bx + 360, y, 8)

  return pdfDoc.save()
}
