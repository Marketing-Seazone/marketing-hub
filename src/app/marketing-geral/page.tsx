"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, TrendingDown, TrendingUp } from "lucide-react"
import { T } from "@/lib/constants"

// ── Types ──────────────────────────────────────────────────

interface NektResult {
  columns: string[]
  rows: Record<string, string | number | null>[]
}

async function queryNekt(sql: string): Promise<NektResult> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status}`)
  return res.json()
}

async function queryNektNum(sql: string): Promise<number> {
  try {
    const r = await queryNekt(sql)
    return Number(r.rows?.[0]?.valor ?? 0)
  } catch { return 0 }
}

// ── Metas Abril ──────────────────────────────────────────────────────────────

const METAS_ABRIL = [
  { label: "SZI",       metaPago: 15, metaNaoPago: 10, color: T.laranja500 },
  { label: "SZS",       metaPago: 71, metaNaoPago: 34, color: T.roxo600    },
  { label: "MKT PLACE", metaPago:  6, metaNaoPago:  4, color: T.teal600    },
]

function barColor(pct: number) {
  if (pct >= 100) return "#10b981"
  if (pct >= 60)  return "#f59e0b"
  return "#ef4444"
}

function MetasAbril() {
  const [dados, setDados] = useState<{ pago: number; naoPago: number }[]>([
    { pago: 0, naoPago: 0 },
    { pago: 0, naoPago: 0 },
    { pago: 0, naoPago: 0 },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        sziPago, szsPago, mktpPago,
        sziNP,   szsNP,   mktpNP,
      ] = await Promise.all([
        // Vertical por pipeline_id: SZI=7,28 | SZS=14 | MKTP=37
        // Pago = rd_campanha contém "paga" | Não pago = não contém "paga"
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id IN (7, 28) AND rd_campanha ILIKE '%paga%' AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 14 AND rd_campanha ILIKE '%paga%' AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 37 AND rd_campanha ILIKE '%paga%' AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id IN (7, 28) AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 14 AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 37 AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND ganho_em >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3' HOUR AND ganho_em < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1' MONTH - INTERVAL '3' HOUR`),
      ])
      setDados([
        { pago: sziPago,  naoPago: sziNP  },
        { pago: szsPago,  naoPago: szsNP  },
        { pago: mktpPago, naoPago: mktpNP },
      ])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.fg, margin: "0 0 4px" }}>Metas Abril</h2>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>WON por vertical — abril 2026</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {METAS_ABRIL.map((meta, i) => {
          const { pago, naoPago } = dados[i]
          const totalReal = pago + naoPago
          const totalMeta = meta.metaPago + meta.metaNaoPago
          const pctTotal  = totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0
          const pctPago   = meta.metaPago > 0 ? Math.round((pago / meta.metaPago) * 100) : 0
          const pctNP     = meta.metaNaoPago > 0 ? Math.round((naoPago / meta.metaNaoPago) * 100) : 0

          return (
            <div key={meta.label} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "18px 20px",
              boxShadow: T.elevSm, display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>{meta.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {loading
                    ? <div style={{ width: 32, height: 20, background: T.cinza100, borderRadius: 4 }} />
                    : <span style={{ fontSize: 22, fontWeight: 800, color: T.fg, letterSpacing: "-0.5px" }}>{totalReal}</span>
                  }
                  <span style={{ fontSize: 12, color: T.cinza400 }}>/ {totalMeta}</span>
                  {!loading && <span style={{ fontSize: 12, fontWeight: 700, color: barColor(pctTotal), marginLeft: 4 }}>{pctTotal}%</span>}
                </div>
              </div>

              <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 6 }}>
                <div style={{ width: `${Math.min(pctTotal, 100)}%`, height: 6, borderRadius: 6, background: barColor(pctTotal), transition: "width 0.6s ease" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { rotulo: "Mídia Paga",     real: pago,    metaV: meta.metaPago,    pct: pctPago },
                  { rotulo: "Mídia Não Paga",  real: naoPago, metaV: meta.metaNaoPago, pct: pctNP   },
                ].map(row => (
                  <div key={row.rotulo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: T.cinza600 }}>{row.rotulo}</span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        {loading
                          ? <div style={{ width: 24, height: 14, background: T.cinza100, borderRadius: 3 }} />
                          : <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{row.real}</span>
                        }
                        <span style={{ fontSize: 11, color: T.cinza400 }}>/ {row.metaV}</span>
                      </div>
                    </div>
                    <div style={{ width: "100%", background: T.cinza100, borderRadius: 4, height: 4 }}>
                      <div style={{ width: `${Math.min(row.pct, 100)}%`, height: 4, borderRadius: 4, background: barColor(row.pct), transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Metas (fixas — você edita aqui) ──────────────────────

const METAS = {
  cacSzi:         { label: "CAC Tráfego Pago SZI",       meta: 10190, unit: "R$",  tipo: "menor" as const },
  cacSzs:         { label: "CAC Tráfego Pago SZS",       meta: 1442,  unit: "R$",  tipo: "menor" as const },
  crescimento:    { label: "Crescimento SP + Salvador",   meta: 107,   unit: "",    tipo: "maior" as const },
  vendasSzi:      { label: "Vendas SZI no Trimestre",     meta: 295,   unit: "",    tipo: "maior" as const },
  vendasSzs:      { label: "Vendas SZS no Trimestre",     meta: 852,   unit: "",    tipo: "maior" as const },
}

// ── Utilidades ───────────────────────────────────────────

function fmt(n: number | null, unit: string) {
  if (n === null) return "—"
  if (unit === "R$") return `R$ ${Math.round(n).toLocaleString("pt-BR")}`
  return n.toLocaleString("pt-BR")
}

// Para "menor é melhor": verde se real < meta
// Para "maior é melhor": porcentagem normal
function calcAting(real: number | null, meta: number, tipo: "menor" | "maior") {
  if (real === null) return null
  if (tipo === "menor") return Math.round((meta / real) * 100)   // >100% = abaixo da meta = bom
  return Math.round((real / meta) * 100)                          // >100% = acima da meta = bom
}

function statusColor(pct: number | null) {
  if (pct === null) return T.cinza200
  if (pct >= 100) return "#10b981"  // verde — meta atingida
  if (pct >= 75)  return "#f59e0b"  // amarelo — perto
  return "#ef4444"                   // vermelho — longe
}

function statusBg(pct: number | null) {
  if (pct === null) return T.cinza50
  if (pct >= 100) return "#f0fdf4"
  if (pct >= 75)  return "#fffbeb"
  return "#fef2f2"
}

function statusBorder(pct: number | null) {
  if (pct === null) return T.border
  if (pct >= 100) return "#bbf7d0"
  if (pct >= 75)  return "#fde68a"
  return "#fecaca"
}

// ── Componente do card de meta ───────────────────────────

function MetaCard({
  label, meta, real, unit, tipo, loading,
}: {
  label: string; meta: number; real: number | null; unit: string
  tipo: "menor" | "maior"; loading: boolean
}) {
  const pct = calcAting(real, meta, tipo)
  const atingido = pct !== null && pct >= 100

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${statusBorder(pct)}`,
      borderRadius: 16,
      padding: "28px 28px 24px",
      boxShadow: T.elevSm,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.mutedFg, lineHeight: 1.4 }}>{label}</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: statusBg(pct),
          border: `1px solid ${statusBorder(pct)}`,
          borderRadius: 8, padding: "4px 10px", flexShrink: 0,
        }}>
          {tipo === "menor"
            ? <TrendingDown size={12} color={statusColor(pct)} />
            : <TrendingUp size={12} color={statusColor(pct)} />
          }
          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(pct) }}>
            {tipo === "menor" ? "< " : "> "}{fmt(meta, unit)}
          </span>
        </div>
      </div>

      {/* Valor atual */}
      <div>
        {loading ? (
          <div style={{ height: 40, background: T.cinza100, borderRadius: 8, width: "60%", animation: "pulse 1.5s infinite" }} />
        ) : (
          <span style={{ fontSize: 36, fontWeight: 800, color: T.fg, letterSpacing: "-1px" }}>
            {fmt(real, unit)}
          </span>
        )}
        <p style={{ fontSize: 12, color: T.cinza400, margin: "4px 0 0" }}>
          {tipo === "menor" ? "atual (meta: abaixo de " : "atual (meta: acima de "}{fmt(meta, unit)})
        </p>
      </div>

      {/* Barra de atingimento */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.mutedFg }}>Atingimento</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(pct) }}>
            {pct !== null ? `${Math.min(pct, 999)}%` : "—"}
          </span>
        </div>
        <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{
            width: `${pct !== null ? Math.min(pct, 100) : 0}%`,
            height: 8, borderRadius: 6,
            background: statusColor(pct),
            transition: "width 0.6s ease",
          }} />
        </div>
        {atingido && (
          <p style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 6 }}>✓ Meta atingida</p>
        )}
      </div>
    </div>
  )
}

// ── Mídias Sociais ───────────────────────────────────────

const FOLLOWERS_DATA = [
  { label: "@destinoseazone", platform: "Instagram", icon: "📷", current: 108500, goals: { abr:110000,mai:120000,jun:130000,jul:140000,ago:150000,set:160000,out:170000,nov:180000,dez:190000 } },
  { label: "@vistasdeanita",  platform: "Instagram", icon: "📷", current: 167200, goals: { abr:170000,mai:180000,jun:190000,jul:200000,ago:210000,set:220000,out:230000,nov:240000,dez:250000 } },
  { label: "@vistasdeanita",  platform: "TikTok",    icon: "🎵", current: 4800,   goals: { abr:5000,  mai:6000,  jun:7000,  jul:8000,  ago:9000,  set:10000, out:11000, nov:12000, dez:13000 } },
  { label: "@destinoseazone", platform: "TikTok",    icon: "🎵", current: 920,    goals: { abr:1000,  mai:2000,  jun:3000,  jul:4000,  ago:5000,  set:6000,  out:7000,  nov:8000,  dez:9000  } },
]

const MONTHS = ["abr","mai","jun","jul","ago","set","out","nov","dez"] as const
type Month = typeof MONTHS[number]

const EDITORIAL_CALENDAR = [
  { day: "Segunda", editoria: "Inteligência de Mercado", format: "Carrossel educativo",       channels: ["Instagram"] },
  { day: "Terça",   editoria: "Achados Seazone",         format: "Oportunidade do portfólio", channels: ["Instagram","TikTok"] },
  { day: "Quarta",  editoria: "Dono no Controle",        format: "Reels ou carrossel",        channels: ["Instagram"] },
  { day: "Quinta",  editoria: "Resultados Reais",        format: "Prova social/depoimento",   channels: ["Instagram"] },
  { day: "Sexta",   editoria: "Onde Investir",           format: "Carrossel ou Reels",        channels: ["Instagram"] },
  { day: "Sábado",  editoria: "Por dentro do Airbnb",    format: "Reels rápido/dica",         channels: ["Instagram","TikTok"] },
  { day: "Domingo", editoria: "Autoridade Seazone",      format: "Bastidor/institucional",    channels: ["Instagram"] },
]

const EDITORIAL_COMPLIANCE = {
  total: { published: 18, planned: 22 },
  byDay: [
    { day: "Seg", count: 4, planned: 4 },
    { day: "Ter", count: 3, planned: 4 },
    { day: "Qua", count: 3, planned: 4 },
    { day: "Qui", count: 2, planned: 3 },
    { day: "Sex", count: 3, planned: 3 },
    { day: "Sáb", count: 2, planned: 3 },
    { day: "Dom", count: 1, planned: 1 },
  ],
}

const EDITORIAL_MIX = [
  { editoria: "Inteligência de Mercado", real: 5, planned: 5 },
  { editoria: "Dono no Controle",        real: 2, planned: 4 },
  { editoria: "Onde Investir",           real: 2, planned: 4 },
  { editoria: "Resultados Reais",        real: 5, planned: 4 },
  { editoria: "Destinos Seazone",        real: 4, planned: 5 },
  { editoria: "Autoridade Seazone",      real: 5, planned: 4 },
  { editoria: "Por dentro do Airbnb",    real: 3, planned: 4 },
]

function fmtN(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}k`
  return n.toLocaleString("pt-BR")
}

function MidiasSociais() {
  const [mes, setMes] = useState<Month>("abr")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Seletor de mês */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: T.mutedFg, marginRight: 4 }}>Mês:</span>
        {MONTHS.map(m => (
          <button key={m} onClick={() => setMes(m)} style={{
            padding: "4px 12px", fontSize: 13, borderRadius: 20, border: "none", cursor: "pointer",
            background: m === mes ? T.primary : T.cinza50,
            color: m === mes ? "#fff" : T.cinza600, fontWeight: m === mes ? 600 : 400,
            fontFamily: T.font,
          }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Seguidores por conta */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 4px" }}>Seguidores por Conta</h3>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Metas de seguidores — {mes}/2025</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
          {FOLLOWERS_DATA.map((d, i) => {
            const goal = d.goals[mes]
            const pct = Math.round((d.current / goal) * 100)
            return (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{d.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.cardFg }}>{d.label}</span>
                  <span style={{ fontSize: 10, background: T.cinza50, color: T.cinza400, padding: "2px 6px", borderRadius: 4, marginLeft: "auto" }}>{d.platform}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{fmtN(d.current)}</span>
                  <span style={{ fontSize: 12, color: T.cinza400, marginBottom: 2 }}>/ {fmtN(goal)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, marginLeft: "auto", color: statusColor(pct) }}>{pct}%</span>
                </div>
                <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 6 }}>
                  <div style={{ width: `${Math.min(pct,100)}%`, height: 6, borderRadius: 6, background: statusColor(pct) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Roadmap de seguidores */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 12px" }}>Roadmap de Seguidores (Abr → Dez/2025)</h3>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "auto", boxShadow: T.elevSm }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.cinza50 }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: T.mutedFg, position: "sticky", left: 0, background: T.cinza50 }}>Conta</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: m === mes ? T.primary : T.mutedFg, background: m === mes ? `${T.primary}10` : T.cinza50 }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FOLLOWERS_DATA.map((d, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 16px", fontWeight: 500, position: "sticky", left: 0, background: T.card, whiteSpace: "nowrap" }}>
                    {d.label} <span style={{ fontSize: 11, color: T.cinza400 }}>{d.platform}</span>
                  </td>
                  {MONTHS.map(m => (
                    <td key={m} style={{ padding: "10px 12px", textAlign: "center", fontWeight: m === mes ? 700 : 400, background: m === mes ? `${T.primary}08` : "transparent" }}>
                      {fmtN(d.goals[m])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aderência editorial */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 4px" }}>Calendário Editorial — Aderência</h3>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Posts publicados na data planejada ÷ total planejado</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: "0 0 8px" }}>Aderência geral</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: T.fg, margin: "0 0 4px" }}>
              {Math.round((EDITORIAL_COMPLIANCE.total.published / EDITORIAL_COMPLIANCE.total.planned) * 100)}%
            </p>
            <p style={{ fontSize: 12, color: T.cinza400, margin: "0 0 12px" }}>{EDITORIAL_COMPLIANCE.total.published} de {EDITORIAL_COMPLIANCE.total.planned} posts</p>
            <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 8 }}>
              <div style={{ width: `${Math.round((EDITORIAL_COMPLIANCE.total.published/EDITORIAL_COMPLIANCE.total.planned)*100)}%`, height: 8, borderRadius: 6, background: T.primary }} />
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: "0 0 12px" }}>Status por dia da semana</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {EDITORIAL_COMPLIANCE.byDay.map(d => {
                const ok = d.count >= d.planned
                return (
                  <div key={d.day} style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: T.cinza600, margin: "0 0 6px" }}>{d.day}</p>
                    <div style={{ background: T.cinza50, borderRadius: 8, padding: "8px 4px" }}>
                      <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{d.count}/{d.planned}</p>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 4px", borderRadius: 6, background: ok ? "#d1fae5" : "#fef3c7", color: ok ? "#065f46" : "#92400e" }}>
                        {ok ? "OK" : "Parcial"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Calendário semanal */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 12px" }}>Calendário Semanal</h3>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.elevSm }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.cinza50 }}>
                {["Dia","Editoria","Formato","Canais"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: T.mutedFg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDITORIAL_CALENDAR.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: T.primary }}>{row.day}</td>
                  <td style={{ padding: "10px 16px" }}>{row.editoria}</td>
                  <td style={{ padding: "10px 16px", color: T.mutedFg }}>{row.format}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {row.channels.map(c => (
                        <span key={c} style={{ fontSize: 11, background: T.cinza50, color: T.cinza600, padding: "2px 8px", borderRadius: 10 }}>{c}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mix de editorias */}
      <div>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 4px" }}>Mix de Editorias</h3>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Distribuição real vs planejada de publicações por editoria no mês</p>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {EDITORIAL_MIX.map(e => {
              const maxVal = Math.max(e.real, e.planned)
              return (
                <div key={e.editoria} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, width: 200, flexShrink: 0, color: T.cardFg }}>{e.editoria}</span>
                  <div style={{ flex: 1, background: T.cinza100, borderRadius: 10, height: 20, overflow: "hidden" }}>
                    <div style={{
                      width: `${(e.real / maxVal) * 100}%`, height: 20,
                      background: T.primary, borderRadius: "10px 0 0 10px",
                      display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6,
                    }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>{e.real}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: T.cinza400, width: 56, flexShrink: 0 }}>Meta: {e.planned}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.mutedFg }}>
              <div style={{ width: 12, height: 12, background: T.primary, borderRadius: 3 }} /> Real
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.mutedFg }}>
              <div style={{ width: 12, height: 12, background: T.cinza100, borderRadius: 3 }} /> Planejado
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Tabs (para expansão futura) ─────────────────────────

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 16px", fontSize: 13, whiteSpace: "nowrap",
      background: "none", border: "none", cursor: "pointer",
      borderBottom: active ? `2px solid ${T.primary}` : "2px solid transparent",
      color: active ? T.primary : T.mutedFg,
      fontWeight: active ? 600 : 400, fontFamily: T.font,
    }}>
      {label}
    </button>
  )
}

// ── Página principal ─────────────────────────────────────

export default function MarketingGeral() {
  const [activeTab, setActiveTab] = useState("visao-geral")
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reais, setReais] = useState<Record<string, number | null>>({
    cacSzi: null, cacSzs: null, crescimento: null, vendasSzi: null, vendasSzs: null,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErrors({})

      const safe = async (key: string, sql: string): Promise<number | null> => {
        try {
          const r = await queryNekt(sql)
          const row = r.rows[0]
          if (!row) return null
          const v = Object.values(row)[0]
          return v !== null && v !== undefined ? Number(v) : null
        } catch (e) {
          setErrors(prev => ({ ...prev, [key]: String(e) }))
          return null
        }
      }

      const [cacSzi, cacSzs, crescimento, vendasSzi, vendasSzs] = await Promise.all([
        // CAC SZI = spend tráfego pago SZI / won deals canal marketing SZI
        safe("cacSzi", `
          SELECT
            (SELECT SUM(spend) FROM nekt_silver.ads_unificado
             WHERE vertical = 'Investimentos'
               AND date >= CURRENT_DATE - INTERVAL '90' DAY)
            /
            NULLIF(
              (SELECT COUNT(DISTINCT id) FROM nekt_silver.deals_pipedrive_join_marketing
               WHERE status = 'won'
                 AND rd_campanha LIKE '%[SI]%'
                 AND ganho_em >= CURRENT_DATE - INTERVAL '90' DAY),
            0) AS valor
        `),
        // CAC SZS = spend tráfego pago SZS / won deals canal marketing SZS
        safe("cacSzs", `
          SELECT
            (SELECT SUM(spend) FROM nekt_silver.ads_unificado
             WHERE vertical ILIKE '%serv%'
               AND date >= CURRENT_DATE - INTERVAL '90' DAY)
            /
            NULLIF(
              (SELECT COUNT(DISTINCT id) FROM nekt_silver.deals_pipedrive_join_marketing
               WHERE status = 'won'
                 AND rd_campanha LIKE '%[SS]%'
                 AND ganho_em >= CURRENT_DATE - INTERVAL '90' DAY),
            0) AS valor
        `),
        // Crescimento SP + Salvador = won SZS nessas cidades no trimestre
        safe("crescimento", `
          SELECT COUNT(DISTINCT id) AS valor
          FROM nekt_silver.deals_pipedrive_join_marketing
          WHERE status = 'won'
            AND rd_campanha LIKE '%[SS]%'
            AND ganho_em >= CURRENT_DATE - INTERVAL '90' DAY
            AND (rd_campanha ILIKE '%salvador%'
                 OR rd_campanha ILIKE '%sao paulo%'
                 OR rd_campanha ILIKE '%são paulo%'
                 OR title ILIKE '%salvador%'
                 OR title ILIKE '%são paulo%')
        `),
        safe("vendasSzi", `
          SELECT COALESCE(SUM(won_szi), 0) AS valor
          FROM nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable
          WHERE data >= CURRENT_DATE - INTERVAL '90' DAY
        `),
        safe("vendasSzs", `
          SELECT COALESCE(SUM(won_szs), 0) AS valor
          FROM nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable
          WHERE data >= CURRENT_DATE - INTERVAL '90' DAY
        `),
      ])

      setReais({ cacSzi, cacSzs, crescimento, vendasSzi, vendasSzs })
      setLoading(false)
    }
    load()
  }, [])

  const tabs = [
    { id: "visao-geral",       label: "Visão Geral" },
    { id: "midias-sociais",    label: "Mídias Sociais" },
    { id: "criacao",           label: "Criação" },
    { id: "pmm-szi",           label: "PMM SZI" },
    { id: "pmm-szs",           label: "PMM SZS" },
    { id: "pmm-mktplace",      label: "PMM Mkt Place" },
    { id: "ativacao",          label: "Marketing de Ativação" },
    { id: "growth-paga",       label: "Growth Mídia Paga" },
    { id: "growth-nao-paga",   label: "Growth Mídia Não Paga" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
              <ChevronLeft size={14} /> Menu
            </Link>
            <span style={{ color: T.border }}>|</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Marketing Geral</span>
            {loading && (
              <span style={{ fontSize: 11, color: T.cinza400, marginLeft: "auto" }}>Carregando dados...</span>
            )}
          </div>
          <div style={{ display: "flex", overflowX: "auto", marginBottom: -1 }}>
            {tabs.map(t => (
              <TabButton key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "36px 24px", maxWidth: 1000, margin: "0 auto" }}>

        {activeTab === "visao-geral" && (
          <>
            <MetasAbril />
          </>
        )}

        {activeTab === "midias-sociais" && <MidiasSociais />}

        {activeTab !== "visao-geral" && activeTab !== "midias-sociais" && (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "48px 32px",
            textAlign: "center", boxShadow: T.elevSm,
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 6px" }}>Em construção</p>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Esta aba será desenvolvida em breve.</p>
          </div>
        )}

      </main>
    </div>
  )
}
