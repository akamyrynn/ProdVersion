import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "@/app/globals.css"

const googleSans = localFont({
  src: [
    {
      path: "../../public/fonts/GoogleSans-Regular.ttf",
      weight: "100 400",
      style: "normal",
    },
    {
      path: "../../public/fonts/GoogleSans-Medium.ttf",
      weight: "500 900",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
})

export function HtmlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${googleSans.variable} font-[family-name:var(--font-google-sans)] antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-right" richColors duration={2000} />
      </body>
    </html>
  )
}
