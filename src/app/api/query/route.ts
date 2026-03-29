import { NextRequest, NextResponse } from "next/server"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 60

export async function POST(req: NextRequest) {
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
