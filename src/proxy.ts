import { NextRequest, NextResponse } from "next/server"

const PASSWORD = "marketingmari2026"

export default function proxy(req: NextRequest) {
  if (process.env.NODE_ENV === "development") return NextResponse.next()

  const auth = req.cookies.get("auth")?.value
  const { pathname } = req.nextUrl

  // Libera página de login, rotas de API (auth própria) e assets públicos
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/logos/")
  ) {
    return NextResponse.next()
  }

  if (auth !== PASSWORD) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
