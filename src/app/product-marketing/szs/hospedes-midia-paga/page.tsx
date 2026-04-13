"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, RefreshCw, Play, Search } from "lucide-react"
import { T } from "@/lib/constants"

// ─── tipos ────────────────────────────────────────────────────────────────────

interface SpendRow {
  date: string
  meta: number
  google: number
  total: number
}

interface NektResult {
  columns: string[]
  rows: Record<string, string | number | null>[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  if (!v) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

async function query(sql: string): Promise<NektResult> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ─── SQL de gastos hóspedes ───────────────────────────────────────────────────
// Filtra ads_unificado por campanhas de hóspedes (Meta Ads).
// Google Ads: explore a aba Nekt para localizar a tabela correta.

function buildSpendSQL(days: number) {
  return `
SELECT
  date,
  SUM(spend) AS meta
FROM nekt_silver.ads_unificado_historico
WHERE (
  LOWER(campaign_name) LIKE '%hospedes%'
  OR LOWER(campaign_name) LIKE '%vistassc%'
  OR LOWER(campaign_name) LIKE '%vistas%hospede%'
)
  AND date >= CURRENT_DATE - INTERVAL '${days}' DAY
GROUP BY date
ORDER BY date DESC
`.trim()
}

// ─── Mini gráfico de barras SVG ───────────────────────────────────────────────

function SpendChart({ rows }: { rows: SpendRow[] }) {
  const data = [...rows].reverse().slice(-60) // últimos 60 dias, ordem crescente
  if (data.length === 0) return null

  const W = 720, H = 160, PL = 44, PB = 20, PT = 8, PR = 8
  const cW = W - PL - PR
  const cH = H - PT - PB
  const maxV = Math.max(...data.map(d => d.total), 1)
  const barW = Math.max(2, (cW / data.length) - 2)

  const xs = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * cW
  const ys = (v: number) => PT + cH - (v / maxV) * cH

  const yLabels = [0, maxV * 0.5, maxV].map(v => ({
    v,
    y: ys(v),
    label: v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0),
  }))

  const xLabels = [0, Math.floor(data.length / 3), Math.floor((data.length * 2) / 3), data.length - 1]
    .filter((i, idx, arr) => arr.indexOf(i) === idx && data[i])

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {yLabels.map(({ v, y, label }) => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={y} y2={y} stroke={T.border} strokeWidth={0.5} />
          <text x={PL - 4} y={y + 4} fontSize={9} fill={T.cinza400} textAnchor="end">{label}</text>
        </g>
      ))}

      {data.map((d, i) => {
        const bh = Math.max(2, (d.meta / maxV) * cH)
        const x = xs(i) - barW / 2
        const yMeta = PT + cH - bh
        return (
          <g key={d.date}>
            <rect x={x} y={yMeta} width={barW} height={bh}
              fill={`${T.primary}CC`} rx={1}>
              <title>{fmtDate(d.date)} — Meta: {fmtBRL(d.meta)}{d.google > 0 ? ` · Google: ${fmtBRL(d.google)}` : ""}</title>
            </rect>
          </g>
        )
      })}

      {xLabels.map(i => (
        <text key={i} x={xs(i)} y={H - 4} fontSize={8} fill={T.mutedFg} textAnchor="middle">
          {fmtDate(data[i].date)}
        </text>
      ))}
    </svg>
  )
}

// ─── Nekt Explorer ───────────────────────────────────────────────────────────

const PRESETS = [
  {
    label: "Tabelas disponíveis",
    sql: `SELECT table_schema, table_name\nFROM information_schema.tables\nWHERE table_schema NOT IN ('information_schema','pg_catalog')\nORDER BY 1, 2 LIMIT 100`,
  },
  {
    label: "Colunas de ads_unificado",
    sql: `SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'nekt_silver'\n  AND table_name = 'ads_unificado'\nORDER BY ordinal_position`,
  },
  {
    label: "Gastos hóspedes (Meta)",
    sql: buildSpendSQL(30),
  },
  {
    label: "Buscar tabela Google Ads",
    sql: `SELECT table_schema, table_name\nFROM information_schema.tables\nWHERE LOWER(table_name) LIKE '%google%'\n   OR LOWER(table_name) LIKE '%gads%'\nORDER BY 1, 2`,
  },
  {
    label: "Prévia de tabela",
    sql: `SELECT *\nFROM nekt_silver.ads_unificado\nLIMIT 5`,
  },
]

function NektExplorer() {
  const [sql, setSql] = useState(PRESETS[0].sql)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState<NektResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setStatus("loading"); setError(null); setResult(null)
    try {
      const r = await query(sql)
      setResult(r); setStatus("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e)); setStatus("error")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Info */}
      <div style={{ padding: "12px 16px", background: T.cinza50, borderRadius: 10, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.primary}` }}>
        <p style={{ fontSize: 12, color: T.fg, lineHeight: 1.7, margin: 0 }}>
          Use este explorador para localizar tabelas com gastos de <strong>Google Ads</strong> para hóspedes.
          Quando encontrar, copie o SQL e passe ao responsável para configurar a env var{" "}
          <code style={{ fontFamily: "monospace", background: T.cinza100, padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>NEKT_SPENDING_SQL</code>{" "}
          no projeto <strong>seazone-pmm-servicos</strong> na Vercel — o cron diário das 8h vai preencher os gastos automaticamente.
        </p>
      </div>

      {/* Presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setSql(p.sql); setStatus("idle"); setResult(null); setError(null) }}
            style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
              border: `1px solid ${sql === p.sql ? T.primary : T.border}`,
              background: sql === p.sql ? `${T.primary}12` : T.cinza50,
              color: sql === p.sql ? T.primary : T.mutedFg,
              fontWeight: sql === p.sql ? 600 : 400,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <textarea
        value={sql}
        onChange={e => { setSql(e.target.value); setStatus("idle") }}
        style={{
          width: "100%", height: 160, padding: "10px 12px", borderRadius: 8,
          border: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: 12,
          background: T.cinza50, color: T.fg, resize: "vertical", boxSizing: "border-box",
        }}
        spellCheck={false}
      />

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={run}
          disabled={status === "loading" || !sql.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: status === "loading" || !sql.trim() ? T.cinza100 : T.primary,
            color: status === "loading" || !sql.trim() ? T.mutedFg : "#fff",
            fontWeight: 700, fontSize: 13,
          }}>
          <Play size={13} />
          {status === "loading" ? "Executando..." : "Executar"}
        </button>
        {status === "done" && result && (
          <span style={{ fontSize: 12, color: T.statusOk }}>✓ {result.rows.length} linha(s)</span>
        )}
      </div>

      {status === "error" && error && (
        <div style={{ padding: "10px 14px", background: T.statusErrBg, borderRadius: 8, border: `1px solid ${T.statusErr}30` }}>
          <p style={{ fontSize: 12, color: T.statusErrFg, fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0 }}>{error}</p>
        </div>
      )}

      {status === "done" && result && result.rows.length > 0 && (
        <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: T.mutedFg, padding: "6px 12px", borderBottom: `1px solid ${T.border}`, margin: 0 }}>
            Colunas: <strong style={{ color: T.fg }}>{result.columns.join(", ")}</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {result.columns.map(col => (
                  <th key={col} style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: T.mutedFg, background: T.cinza50, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 100).map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.cinza50}` }}>
                  {result.columns.map(col => (
                    <td key={col} style={{ padding: "6px 12px", color: T.fg, whiteSpace: "nowrap", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row[col] === null ? <span style={{ color: T.cinza200 }}>null</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.rows.length > 100 && (
            <p style={{ padding: "7px 12px", fontSize: 11, color: T.mutedFg, borderTop: `1px solid ${T.border}`, margin: 0 }}>
              Mostrando 100 de {result.rows.length} linhas.
            </p>
          )}
        </div>
      )}

      {status === "done" && result && result.rows.length === 0 && (
        <p style={{ fontSize: 12, color: T.mutedFg }}>Query executada sem resultados.</p>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function HospedesMidiaPagaPage() {
  const [tab, setTab] = useState<"gastos" | "explorar">("gastos")
  const [period, setPeriod] = useState(30)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [rows, setRows] = useState<SpendRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setStatus("loading"); setError(null)
    try {
      const result = await query(buildSpendSQL(period))
      const mapped: SpendRow[] = result.rows.map(r => ({
        date: String(r.date ?? "").slice(0, 10),
        meta: Number(r.meta ?? 0),
        google: Number(r.google ?? 0),
        total: Number(r.meta ?? 0) + Number(r.google ?? 0),
      })).filter(r => r.date)
      setRows(mapped); setStatus("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e)); setStatus("error")
    }
  }

  useEffect(() => { load() }, [period])

  const totals = useMemo(() => ({
    meta: rows.reduce((s, r) => s + r.meta, 0),
    google: rows.reduce((s, r) => s + r.google, 0),
    total: rows.reduce((s, r) => s + r.total, 0),
  }), [rows])

  const TABS = [
    { id: "gastos" as const, label: "Gastos por dia" },
    { id: "explorar" as const, label: "Explorar Nekt" },
  ]

  const card: React.CSSProperties = {
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 12, padding: "20px 24px", boxShadow: T.elevSm,
  }

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52, display: "flex", alignItems: "center",
        gap: 12, position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/product-marketing/szs" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
          <ChevronLeft size={14} />
          PMM SZS
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Mídia Paga — Hóspedes</span>
      </header>

      <main style={{ padding: "28px 24px", maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* KPIs */}
        {status === "done" && rows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Meta Ads", value: fmtBRL(totals.meta), color: T.primary },
              { label: "Google Ads", value: totals.google > 0 ? fmtBRL(totals.google) : "—", color: T.verde600, note: totals.google === 0 ? "tabela pendente" : undefined },
              { label: `Gasto total (${period}d)`, value: fmtBRL(totals.total), color: T.laranja500 },
            ].map(k => (
              <div key={k.label} style={card}>
                <p style={{ fontSize: 11, color: T.mutedFg, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>{k.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
                {k.note && <p style={{ fontSize: 10, color: T.mutedFg, margin: "4px 0 0" }}>{k.note}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Tabs + controles */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 4, background: T.cinza100, borderRadius: 10, padding: 3 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: tab === t.id ? T.card : "transparent",
                  color: tab === t.id ? T.fg : T.mutedFg,
                  fontWeight: tab === t.id ? 700 : 400,
                  fontSize: 13, boxShadow: tab === t.id ? T.elevSm : "none",
                }}>
                {t.id === "explorar" && <Search size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />}
                {t.label}
              </button>
            ))}
          </div>

          {tab === "gastos" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={period} onChange={e => setPeriod(Number(e.target.value))}
                style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, background: T.card, color: T.fg, cursor: "pointer" }}>
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
              <button onClick={load} disabled={status === "loading"}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.mutedFg, fontSize: 12, cursor: "pointer" }}>
                <RefreshCw size={12} style={{ animation: status === "loading" ? "spin 1s linear infinite" : "none" }} />
                Atualizar
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        {tab === "gastos" && (
          <>
            {status === "loading" && (
              <div style={{ ...card, textAlign: "center", padding: "48px 24px", color: T.mutedFg }}>
                <p style={{ fontSize: 13 }}>Buscando dados no Nekt...</p>
              </div>
            )}

            {status === "error" && (
              <div style={{ ...card, padding: "20px 24px", borderLeft: `3px solid ${T.destructive}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.destructive, margin: "0 0 4px" }}>Erro ao buscar dados</p>
                <p style={{ fontSize: 12, color: T.mutedFg, fontFamily: "monospace", margin: 0 }}>{error}</p>
              </div>
            )}

            {status === "done" && rows.length === 0 && (
              <div style={{ ...card, textAlign: "center", padding: "48px 24px" }}>
                <p style={{ fontSize: 24, margin: "0 0 8px" }}>📊</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.fg, margin: "0 0 6px" }}>Nenhum dado encontrado</p>
                <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
                  A tabela <code style={{ fontFamily: "monospace" }}>ads_unificado_historico</code> não retornou campanhas de hóspedes.<br />
                  Use a aba <strong>Explorar Nekt</strong> para ajustar o filtro de campanha.
                </p>
              </div>
            )}

            {status === "done" && rows.length > 0 && (
              <>
                {/* Gráfico */}
                <div style={card}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.fg, margin: "0 0 16px" }}>Gasto diário — Meta Ads Hóspedes</p>
                  <SpendChart rows={rows} />
                </div>

                {/* Tabela */}
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.fg, margin: 0, padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                    Detalhamento por dia
                  </p>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.cinza50 }}>
                          {["Data", "Meta Ads", "Google Ads", "Total"].map(h => (
                            <th key={h} style={{ padding: "8px 16px", textAlign: h === "Data" ? "left" : "right", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.date} style={{ borderBottom: `1px solid ${T.cinza50}` }}>
                            <td style={{ padding: "7px 16px", fontWeight: 600, color: T.fg }}>{fmtDate(r.date)}</td>
                            <td style={{ padding: "7px 16px", textAlign: "right", color: T.primary }}>{fmtBRL(r.meta)}</td>
                            <td style={{ padding: "7px 16px", textAlign: "right", color: r.google > 0 ? T.verde600 : T.cinza200 }}>
                              {r.google > 0 ? fmtBRL(r.google) : "—"}
                            </td>
                            <td style={{ padding: "7px 16px", textAlign: "right", fontWeight: 600, color: T.laranja500 }}>{fmtBRL(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: T.cinza50, borderTop: `2px solid ${T.border}` }}>
                          <td style={{ padding: "8px 16px", fontWeight: 700, color: T.fg }}>Total</td>
                          <td style={{ padding: "8px 16px", textAlign: "right", fontWeight: 700, color: T.primary }}>{fmtBRL(totals.meta)}</td>
                          <td style={{ padding: "8px 16px", textAlign: "right", fontWeight: 700, color: T.verde600 }}>{totals.google > 0 ? fmtBRL(totals.google) : "—"}</td>
                          <td style={{ padding: "8px 16px", textAlign: "right", fontWeight: 700, color: T.laranja500 }}>{fmtBRL(totals.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "explorar" && (
          <div style={card}>
            <NektExplorer />
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
