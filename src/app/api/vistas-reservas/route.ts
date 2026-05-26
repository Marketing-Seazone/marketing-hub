import { NextResponse } from "next/server"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 30

export interface DayData {
  date: string        // YYYY-MM-DD
  count: number
  movingAvg: number   // média móvel 30 dias
}

const SQL = `
  SELECT CAST(creationdate AS DATE) AS dia,
         COUNT(*) AS reservas
  FROM "nekt_operacional_bronze"."stays_reservations_export"
  WHERE listing.internalname LIKE 'VST%'
    AND type <> 'canceled'
    AND CAST(creationdate AS DATE) >= date_add('day', -60, current_date)
    AND CAST(creationdate AS DATE) < current_date
  GROUP BY CAST(creationdate AS DATE)
  ORDER BY dia
`

export async function GET() {
  try {
    const { rows } = await queryNekt(SQL)

    const byDate: Record<string, number> = {}
    for (const row of rows) {
      const date = String(row.dia).slice(0, 10)
      const n = Number(row.reservas)
      if (date) byDate[date] = (byDate[date] || 0) + (Number.isFinite(n) ? n : 0)
    }

    // Monta série dos últimos 60 dias, excluindo o dia corrente
    const all: DayData[] = []
    for (let i = 60; i >= 1; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      all.push({ date, count: byDate[date] || 0, movingAvg: 0 })
    }

    // Média móvel 30 dias
    for (let i = 0; i < all.length; i++) {
      const start = Math.max(0, i - 29)
      const window = all.slice(start, i + 1)
      const sum = window.reduce((s, d) => s + d.count, 0)
      all[i].movingAvg = Math.round((sum / window.length) * 10) / 10
    }

    const days = all.slice(-30)
    return NextResponse.json({ days })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
