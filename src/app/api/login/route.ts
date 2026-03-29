import { NextResponse } from "next/server"

const PASSWORD = "marketingmari2026"

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("mh_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
