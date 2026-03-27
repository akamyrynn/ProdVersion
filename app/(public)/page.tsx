"use client"

import dynamic from "next/dynamic"

const LenisProvider = dynamic(
  () => import("@/components/landing/LenisProvider"),
  { ssr: false },
)
const GSAPRegistry = dynamic(
  () => import("@/components/landing/GSAPRegistry"),
  { ssr: false },
)
const LandingPage = dynamic(
  () => import("@/components/landing/LandingPage"),
  { ssr: false },
)

export default function Page() {
  return (
    <LenisProvider>
      <GSAPRegistry />
      <LandingPage />
    </LenisProvider>
  )
}
