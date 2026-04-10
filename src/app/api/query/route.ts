import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  try {
    const { sql } = await req.json()
    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "Campo 'sql' obrigatório." }, { status: 400 })
    }
    const result = await queryNekt(sql)
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
