import { PDFDocument, rgb, PDFFont } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { readFileSync } from "fs"
import { join } from "path"

// ── Russian number-to-words ──
const ONES_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
const ONES_M = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"]
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"]
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]

function numForm(n: number, one: string, two: string, five: string) {
  const m = Math.abs(n) % 100
  if (m >= 11 && m <= 19) return five
  const d = m % 10
  if (d === 1) return one
  if (d >= 2 && d <= 4) return two
  return five
}

function tripletToWords(n: number, feminine: boolean): string {
  const parts: string[] = []
  const h = Math.floor(n / 100)
  if (h > 0) parts.push(HUNDREDS[h])
  const remainder = n % 100
  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS[remainder - 10])
  } else {
    const t = Math.floor(remainder / 10)
    const o = remainder % 10
    if (t > 0) parts.push(TENS[t])
    if (o > 0) parts.push(feminine ? ONES_F[o] : ONES_M[o])
  }
  return parts.join(" ")
}

function amountInWords(amount: number): string {
  const rubles = Math.floor(amount)
  const kopecks = Math.round((amount - rubles) * 100)

  if (rubles === 0) {
    return `Ноль рублей ${String(kopecks).padStart(2, "0")} коп.`
  }

  const parts: string[] = []
  const millions = Math.floor(rubles / 1000000)
  const thousands = Math.floor((rubles % 1000000) / 1000)
  const ones = rubles % 1000

  if (millions > 0) {
    parts.push(tripletToWords(millions, false))
    parts.push(numForm(millions, "миллион", "миллиона", "миллионов"))
  }
  if (thousands > 0) {
    parts.push(tripletToWords(thousands, true))
    parts.push(numForm(thousands, "тысяча", "тысячи", "тысяч"))
  }
  if (ones > 0) {
    parts.push(tripletToWords(ones, false))
  }

  const rubWord = numForm(rubles, "рубль", "рубля", "рублей")
  let result = parts.join(" ") + " " + rubWord
  result = result.charAt(0).toUpperCase() + result.slice(1)
  return `${result} ${String(kopecks).padStart(2, "0")} коп.`
}

// ── Cache font bytes ──
let fontRegularBytes: Buffer | null = null
let fontMediumBytes: Buffer | null = null

function loadFonts() {
  const dir = join(process.cwd(), "public", "fonts")
  if (!fontRegularBytes) {
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
  sellerKpp?: string
  sellerAddress: string
  sellerBank: string
  sellerBik: string
  sellerAccount: string
  sellerCorrAccount: string
  sellerDirector?: string
  buyerName: string
  buyerInn: string
  buyerKpp: string
  buyerAddress: string
  items: InvoiceItem[]
  subtotal: number
  discountPercent?: number
  discountAmount?: number
  deliveryCost?: number
  vatLabel?: string
  vatAmount?: number
  total: number
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const fonts = loadFonts()

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(fonts.regular)
  const fontB = await pdfDoc.embedFont(fonts.medium)

  const PW = 595.28 // page width
  const L = 40       // left margin
  const R = PW - 40  // right edge

  const black = rgb(0, 0, 0)
  const gray = rgb(0.5, 0.5, 0.5)
  const lineC = rgb(0.2, 0.2, 0.2)

  // ── Drawing helpers ──
  function txt(t: string, x: number, y: number, size: number, f: PDFFont, color = black) {
    page.drawText(t, { x, y, size, font: f, color })
  }
  function txtRight(t: string, xR: number, y: number, size: number, f: PDFFont, color = black) {
    txt(t, xR - f.widthOfTextAtSize(t, size), y, size, f, color)
  }
  function txtCenter(t: string, xL: number, xR: number, y: number, size: number, f: PDFFont, color = black) {
    const w = f.widthOfTextAtSize(t, size)
    txt(t, xL + (xR - xL - w) / 2, y, size, f, color)
  }
  function hLine(x1: number, y: number, x2: number, thickness = 0.5) {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: lineC })
  }
  function vLine(x: number, y1: number, y2: number, thickness = 0.5) {
    page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness, color: lineC })
  }
  function rect(x: number, y: number, w: number, h: number) {
    page.drawRectangle({ x, y, width: w, height: h, borderColor: lineC, borderWidth: 0.5, color: rgb(1, 1, 1) })
  }

  // ══════════════════════════════════════════
  //  BANK DETAILS TABLE (top of page)
  // ══════════════════════════════════════════
  const MID = 330  // vertical divider between left & right columns
  let y = 808

  // ── Row 1: ИНН / КПП  |  Сч.№ ──
  const r1Top = y
  const r1Bot = y - 20
  hLine(L, r1Top, R)
  hLine(L, r1Bot, R)
  vLine(L, r1Top, r1Bot)
  vLine(MID, r1Top, r1Bot)
  vLine(R, r1Top, r1Bot)
  txt(`ИНН ${data.sellerInn}`, L + 6, r1Bot + 6, 8, font)
  txt(`КПП ${data.sellerKpp || "—"}`, L + 120, r1Bot + 6, 8, font)
  txt("Сч. №", MID + 6, r1Bot + 6, 7, font, gray)
  txt(data.sellerAccount, MID + 40, r1Bot + 6, 8, font)
  y = r1Bot

  // ── Row 2-3: Получатель (name) | (account continues) ──
  const r2Bot = y - 34
  hLine(L, r2Bot, MID)
  vLine(L, y, r2Bot)
  vLine(MID, y, r2Bot)
  vLine(R, y, r2Bot)
  txt("Получатель", L + 6, y - 10, 7, font, gray)
  // Seller name (may be long — truncate to fit)
  const sellerDisplay = data.sellerName.length > 55 ? data.sellerName.substring(0, 52) + "..." : data.sellerName
  txt(sellerDisplay, L + 6, y - 22, 8, fontB)
  y = r2Bot

  // ── Row 4: Банк получателя | БИК ──
  const r4Bot = y - 18
  hLine(L, y, R)
  hLine(MID, r4Bot, R)
  vLine(L, y, r4Bot)
  vLine(MID, y, r4Bot)
  vLine(R, y, r4Bot)
  txt("Банк получателя", L + 6, r4Bot + 5, 7, font, gray)
  txt("БИК", MID + 6, r4Bot + 5, 7, font, gray)
  txt(data.sellerBik, MID + 30, r4Bot + 5, 8, font)
  y = r4Bot

  // ── Row 5: Bank name | К/сч ──
  const r5Bot = y - 20
  hLine(L, r5Bot, R)
  vLine(L, y, r5Bot)
  vLine(MID, y, r5Bot)
  vLine(R, y, r5Bot)
  // Bank name might be long
  const bankDisplay = data.sellerBank.length > 48 ? data.sellerBank.substring(0, 45) + "..." : data.sellerBank
  txt(bankDisplay, L + 6, r5Bot + 6, 7, font)
  txt("К/сч.", MID + 6, r5Bot + 6, 7, font, gray)
  txt(data.sellerCorrAccount, MID + 38, r5Bot + 6, 8, font)
  y = r5Bot

  // ══════════════════════════════════════════
  //  QR CODE (right side, below bank details)
  // ══════════════════════════════════════════
  const qrY = y - 100
  try {
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
    const qrPng = await QRCode.toBuffer(qrPayload, { width: 250, margin: 1, errorCorrectionLevel: "M" })
    const qrImage = await pdfDoc.embedPng(qrPng)
    page.drawImage(qrImage, { x: R - 88, y: qrY, width: 85, height: 85 })
  } catch {
    // QR generation failed silently
  }

  // ══════════════════════════════════════════
  //  INVOICE TITLE
  // ══════════════════════════════════════════
  y -= 28
  const titleText = `Счёт на оплату № ${data.invoiceNumber} от ${data.invoiceDate}`
  txtCenter(titleText, L, R - 100, y, 13, fontB)
  y -= 4
  hLine(L, y, R - 100, 1.5)

  // ══════════════════════════════════════════
  //  SUPPLIER & BUYER
  // ══════════════════════════════════════════
  // Text width constrained to avoid QR code area on the right
  const textMaxW = R - L - 110

  y -= 18
  txt("Поставщик:", L, y, 8, fontB)
  y -= 12
  const supplierFull = `${data.sellerName}, ИНН ${data.sellerInn}, КПП ${data.sellerKpp || "—"}, ${data.sellerAddress}`
  const supplierLines = wrapText(supplierFull, font, 7.5, textMaxW)
  for (const line of supplierLines) {
    txt(line, L, y, 7.5, font)
    y -= 10
  }

  y -= 6
  txt("Покупатель:", L, y, 8, fontB)
  y -= 12
  const buyerFull = `${data.buyerName}, ИНН ${data.buyerInn}${data.buyerKpp && data.buyerKpp !== "—" ? `, КПП ${data.buyerKpp}` : ""}${data.buyerAddress && data.buyerAddress !== "—" ? `, ${data.buyerAddress}` : ""}`
  const buyerLines = wrapText(buyerFull, font, 7.5, textMaxW)
  for (const line of buyerLines) {
    txt(line, L, y, 7.5, font)
    y -= 10
  }

  y -= 4

  // ══════════════════════════════════════════
  //  ITEMS TABLE
  // ══════════════════════════════════════════
  // Column boundaries
  const C1 = L         // №
  const C2 = L + 28    // Наименование
  const C3 = 340       // Цена
  const C4 = 410       // Кол-во
  const C5 = 458       // Ед.
  const C6 = 498       // Сумма
  const CE = R         // right edge

  // Table header
  const thTop = y
  const thBot = y - 16
  rect(C1, thBot, CE - C1, 16)
  vLine(C2, thTop, thBot)
  vLine(C3, thTop, thBot)
  vLine(C4, thTop, thBot)
  vLine(C5, thTop, thBot)
  vLine(C6, thTop, thBot)

  txtCenter("№", C1, C2, thBot + 5, 7, fontB)
  txtCenter("Наименование", C2, C3, thBot + 5, 7, fontB)
  txtCenter("Цена", C3, C4, thBot + 5, 7, fontB)
  txtCenter("Кол-во", C4, C5, thBot + 5, 7, fontB)
  txtCenter("Ед.", C5, C6, thBot + 5, 7, fontB)
  txtCenter("Сумма", C6, CE, thBot + 5, 7, fontB)

  y = thBot

  // Item rows
  data.items.forEach((item, idx) => {
    const rowTop = y
    const rowBot = y - 16
    rect(C1, rowBot, CE - C1, 16)
    vLine(C2, rowTop, rowBot)
    vLine(C3, rowTop, rowBot)
    vLine(C4, rowTop, rowBot)
    vLine(C5, rowTop, rowBot)
    vLine(C6, rowTop, rowBot)

    txtCenter(String(idx + 1), C1, C2, rowBot + 5, 8, font)
    const itemName = item.name.length > 42 ? item.name.substring(0, 39) + "..." : item.name
    txt(itemName, C2 + 4, rowBot + 5, 7.5, font)
    txtRight(item.price.toFixed(2), C4 - 6, rowBot + 5, 8, font)
    txtCenter(String(item.quantity), C4, C5, rowBot + 5, 8, font)
    txtCenter(item.unit, C5, C6, rowBot + 5, 8, font)
    txtRight(item.total.toFixed(2), CE - 6, rowBot + 5, 8, font)

    y = rowBot
  })

  // ══════════════════════════════════════════
  //  TOTALS (right-aligned below table)
  // ══════════════════════════════════════════
  y -= 10
  const valX = CE  // value right edge

  // Итого по товарам
  txtRight("Итого:", valX - 80, y, 9, fontB)
  txtRight(data.subtotal.toFixed(2), valX, y, 9, font)
  y -= 16

  // Скидка
  if (data.discountAmount && data.discountAmount > 0) {
    txtRight("Скидка:", valX - 80, y, 9, fontB)
    txtRight(`-${data.discountAmount.toFixed(2)}`, valX, y, 9, font)
    y -= 16
  }

  // В том числе НДС
  if (data.vatAmount && data.vatAmount > 0) {
    const vatText = `В том числе НДС ${data.vatLabel || ""}:`
    txtRight(vatText, valX - 80, y, 9, fontB)
    txtRight(data.vatAmount.toFixed(2), valX, y, 9, font)
    y -= 16
  }

  // Доставка
  if (data.deliveryCost && data.deliveryCost > 0) {
    txtRight("Доставка:", valX - 80, y, 9, fontB)
    txtRight(data.deliveryCost.toFixed(2), valX, y, 9, font)
    y -= 16
  }

  txtRight("Всего к оплате:", valX - 80, y, 9, fontB)
  txtRight(data.total.toFixed(2), valX, y, 9, font)
  y -= 16

  // ══════════════════════════════════════════
  //  AMOUNT IN WORDS
  // ══════════════════════════════════════════
  y -= 6
  hLine(L, y + 4, R, 1)
  y -= 4
  const totalWords = `Итого к оплате: ${amountInWords(data.total)}`
  const totalWordsLines = wrapText(totalWords, fontB, 9, R - L)
  for (const line of totalWordsLines) {
    txt(line, L, y, 9, fontB)
    y -= 12
  }
  hLine(L, y, R, 1)

  // ══════════════════════════════════════════
  //  SIGNATURE
  // ══════════════════════════════════════════
  y -= 36
  const director = data.sellerDirector || "Тен Игорь Олегович"
  txt("Генеральный директор", L, y, 9, font)
  hLine(L + 140, y - 2, L + 300, 0.5)
  txt(director, L + 310, y, 9, fontB)

  return pdfDoc.save()
}

// ── Word-wrap helper ──
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [""]
}
