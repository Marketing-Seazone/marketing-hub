import { NextResponse } from "next/server"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 30

export interface DayData {
  date: string             // YYYY-MM-DD
  count: number            // total de reservas válidas
  countWebsite: number     // reservas via website (partnername = 'External API')
  movingAvg: number        // média móvel 30 dias — total
  movingAvgWebsite: number // média móvel 30 dias — website
}

const SQL = `
  SELECT CAST(creationdate AS DATE) AS dia,
         COUNT(*) AS reservas,
         COUNT_IF(partnername = 'External API') AS reservas_website
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

    const totalByDate: Record<string, number> = {}
    const webByDate: Record<string, number> = {}
    for (const row of rows) {
      const date = String(row.dia).slice(0, 10)
      if (!date) continue
      const total = Number(row.reservas)
      const web = Number(row.reservas_website)
      totalByDate[date] = (totalByDate[date] || 0) + (Number.isFinite(total) ? total : 0)
      webByDate[date] = (webByDate[date] || 0) + (Number.isFinite(web) ? web : 0)
    }

    // Série dos últimos 60 dias, excluindo dia corrente
    const all: DayData[] = []
    for (let i = 60; i >= 1; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      all.push({
        date,
        count: totalByDate[date] || 0,
        countWebsite: webByDate[date] || 0,
        movingAvg: 0,
        movingAvgWebsite: 0,
      })
    }

    // Média móvel 30 dias (total e website)
    for (let i = 0; i < all.length; i++) {
      const start = Math.max(0, i - 29)
      const window = all.slice(start, i + 1)
      const sumT = window.reduce((s, d) => s + d.count, 0)
      const sumW = window.reduce((s, d) => s + d.countWebsite, 0)
      all[i].movingAvg = Math.round((sumT / window.length) * 10) / 10
      all[i].movingAvgWebsite = Math.round((sumW / window.length) * 10) / 10
    }

    const days = all.slice(-30)
    return NextResponse.json({ days })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
