import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and API route
  if (pathname.startsWith("/login") || pathname.startsWith("/api/login")) {
    return NextResponse.next()
  }

  const auth = request.cookies.get("mh_auth")?.value
  if (auth !== "1") {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
