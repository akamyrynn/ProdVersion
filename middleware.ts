import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Skip Payload admin and API routes — Payload handles its own auth
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
