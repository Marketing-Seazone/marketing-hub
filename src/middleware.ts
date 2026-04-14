import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

const authMiddleware = withAuth({ pages: { signIn: "/login" } })

const PUBLIC_ROUTES = ["/vistas-hospedes/plano-de-acao", "/api/vistas-plano"]

export default function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") return NextResponse.next()
  if (PUBLIC_ROUTES.some((r) => req.nextUrl.pathname.startsWith(r)))
    return NextResponse.next()
  return (authMiddleware as (req: NextRequest) => Response)(req)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
