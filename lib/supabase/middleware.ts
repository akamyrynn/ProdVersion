import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.searchParams.set("auth", "login")
    return NextResponse.redirect(url)
  }

  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
