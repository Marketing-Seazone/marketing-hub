import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 30

interface MetabaseRow {
  payment_date: string
  reservation_city: string
  [key: string]: unknown
}

export interface DayData {
  date: string        // YYYY-MM-DD
  count: number
  movingAvg: number   // média móvel 30 dias
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateFrom = searchParams.get("from") || null
  const dateTo = searchParams.get("to") || null

  const apiKey = process.env.METABASE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "METABASE_API_KEY não configurada" }, { status: 503 })

  try {
    const res = await fetch("https://metabase.seazone.com.br/api/card/3350/query/json", {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`Metabase error ${res.status}`)

    const rows: MetabaseRow[] = await res.json()

    // Filtra Anitápolis
    const anita = rows.filter(r => r.reservation_city === "Anitápolis")

    // Agrega por data
    const byDate: Record<string, number> = {}
    for (const row of anita) {
      const date = String(row.payment_date).slice(0, 10)
      byDate[date] = (byDate[date] || 0) + 1
    }

    // Se não tiver filtro, usa último período (60 dias para média móvel de 30)
    if (!dateFrom && !dateTo) {
      const all: DayData[] = []
      for (let i = 59; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const date = d.toISOString().slice(0, 10)
        all.push({ date, count: byDate[date] || 0, movingAvg: 0 })
      }
      for (let i = 0; i < all.length; i++) {
        const start = Math.max(0, i - 29)
        const window = all.slice(start, i + 1)
        const sum = window.reduce((s, d) => s + d.count, 0)
        all[i].movingAvg = Math.round((sum / window.length) * 10) / 10
      }
      const days = all.slice(-30)
      return NextResponse.json({ days })
    }

    // Com filtros de período
    const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const to = dateTo ? new Date(dateTo) : new Date()

    // Expandir período para cálculo da média móvel (30 dias antes do início)
    const windowStart = new Date(from)
    windowStart.setDate(windowStart.getDate() - 29)

    const all: DayData[] = []
    const current = new Date(windowStart)
    while (current <= to) {
      const date = current.toISOString().slice(0, 10)
      all.push({ date, count: byDate[date] || 0, movingAvg: 0 })
      current.setDate(current.getDate() + 1)
    }

    // Calcula média móvel 30 dias
    for (let i = 0; i < all.length; i++) {
      const start = Math.max(0, i - 29)
      const window = all.slice(start, i + 1)
      const sum = window.reduce((s, d) => s + d.count, 0)
      all[i].movingAvg = Math.round((sum / window.length) * 10) / 10
    }

    // Filtra para período selecionado
    const days = all.filter(d =>
      (!dateFrom || d.date >= dateFrom) && (!dateTo || d.date <= dateTo)
    )

    return NextResponse.json({ days })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
