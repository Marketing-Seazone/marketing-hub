import { NextResponse } from "next/server"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 30

const SQL_UTI = `
  WITH upcoming AS (
    SELECT property_key, COUNT(*) AS cnt
    FROM nekt_operacional_gold.fact_reservations
    WHERE check_in_date >= CURRENT_TIMESTAMP
      AND check_in_date < CURRENT_TIMESTAMP + INTERVAL '60' DAY
      AND is_valid_revenue = true
    GROUP BY property_key
  )
  SELECT
    p.property_name AS codigo,
    p.city_name     AS cidade,
    p.state         AS estado,
    CAST(p.activation_date AS VARCHAR) AS ativacao
  FROM nekt_operacional_silver.dim_property p
  LEFT JOIN upcoming u ON p.property_key = u.property_key
  WHERE p.is_current = true
    AND p.status = 'Active'
    AND p.is_churn = false
    AND COALESCE(u.cnt, 0) = 0
  ORDER BY p.activation_date ASC
`

const SQL_NOVOS = `
  SELECT
    p.property_name AS codigo,
    p.city_name     AS cidade,
    p.state         AS estado,
    CAST(p.activation_date AS VARCHAR) AS ativacao
  FROM nekt_operacional_silver.dim_property p
  WHERE p.is_current = true
    AND p.status = 'Active'
    AND p.is_churn = false
    AND p.activation_date >= CURRENT_DATE - INTERVAL '90' DAY
  ORDER BY p.activation_date DESC
`

export async function GET() {
  try {
    const [utiResult, novosResult] = await Promise.all([
      queryNekt(SQL_UTI),
      queryNekt(SQL_NOVOS),
    ])

    return NextResponse.json({
      uti: utiResult.rows,
      novos: novosResult.rows,
    }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
