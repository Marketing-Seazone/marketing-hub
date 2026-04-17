import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

const authMiddleware = withAuth({ pages: { signIn: "/login" } })

export default function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") return NextResponse.next()
  if (process.env.VERCEL_ENV === "preview") return NextResponse.next()
  return (authMiddleware as (req: NextRequest) => Response)(req)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
