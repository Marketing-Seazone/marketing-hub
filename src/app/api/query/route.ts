import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 60

/* ── Mock para dev local sem NEKT_API_KEY ── */
function mockNekt(sql: string) {
  const s = sql.toLowerCase()

  // Por anúncio (szs-ads / vistas)
  if (s.includes("ad_name") && s.includes("ad_id") && s.includes("group by ad_name")) {
    return {
      columns: ["ad_name","ad_id","campaign_name","adset_name","investimento","impressoes","leads","mql","won"],
      rows: [
        { ad_name: "[MOCK] Criativo_Video_Gestão_A", ad_id: "mock001", campaign_name: "[MOCK] SZS | Captação | Proprietários", adset_name: "Interesse Proprietários SC", investimento: 3420.50, impressoes: 84200, leads: 62, mql: 18, won: 3 },
        { ad_name: "[MOCK] Criativo_Carrossel_Renda_B", ad_id: "mock002", campaign_name: "[MOCK] SZS | Captação | Proprietários", adset_name: "Lookalike 3% — Base atual", investimento: 2180.00, impressoes: 61000, leads: 45, mql: 12, won: 2 },
        { ad_name: "[MOCK] Criativo_Estatico_Facilidade_C", ad_id: "mock003", campaign_name: "[MOCK] SZS | Retargeting | Site", adset_name: "Visitantes últimos 30d", investimento: 980.00, impressoes: 31500, leads: 28, mql: 7, won: 1 },
        { ad_name: "[MOCK] Criativo_Video_Depoimento_D", ad_id: "mock004", campaign_name: "[MOCK] SZS | Retargeting | Site", adset_name: "Engajamento Instagram 60d", investimento: 760.20, impressoes: 22100, leads: 19, mql: 4, won: 1 },
      ],
    }
  }

  // Por campanha (szs-ads)
  if (s.includes("campaign_name") && s.includes("group by campaign_name") && !s.includes("ad_name")) {
    return {
      columns: ["campaign_name","investimento","impressoes","leads","mql","won"],
      rows: [
        { campaign_name: "[MOCK] SZS | Captação | Proprietários", investimento: 5600.50, impressoes: 145200, leads: 107, mql: 30, won: 5 },
        { campaign_name: "[MOCK] SZS | Retargeting | Site", investimento: 1740.20, impressoes: 53600, leads: 47, mql: 11, won: 2 },
      ],
    }
  }

  // Discover campanhas vistas (vistas-hospedes)
  if (s.includes("distinct campaign_name")) {
    return { columns: ["campaign_name","vertical"], rows: [] }
  }

  return { columns: [], rows: [] }
}

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

    // Sem NEKT_API_KEY em dev → retorna mock
    if (process.env.NODE_ENV === "development" && !process.env.NEKT_API_KEY) {
      return NextResponse.json(mockNekt(sql), { headers: { "Cache-Control": "no-store" } })
    }

    const result = await queryNekt(sql)
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
