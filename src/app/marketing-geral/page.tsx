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
    { id: "visao-geral",    label: "Visão Geral" },
    { id: "midias-sociais", label: "Mídias Sociais" },
    { id: "midia-paga",     label: "Mídia Paga" },
    { id: "funis",          label: "Funis" },
    { id: "ativacao",       label: "Ativação" },
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
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.fg, margin: "0 0 6px" }}>Metas do Trimestre</h2>
              <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
                Dados atualizados em tempo real via Nekt · {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
            </div>

            {Object.keys(errors).length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: "0 0 6px" }}>Erros ao carregar dados:</p>
                {Object.entries(errors).map(([k, v]) => (
                  <p key={k} style={{ fontSize: 11, color: "#dc2626", margin: "2px 0", fontFamily: "monospace" }}>{k}: {v}</p>
                ))}
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {(Object.entries(METAS) as [keyof typeof METAS, typeof METAS[keyof typeof METAS]][]).map(([key, m]) => (
                <MetaCard
                  key={key}
                  label={m.label}
                  meta={m.meta}
                  real={reais[key]}
                  unit={m.unit}
                  tipo={m.tipo}
                  loading={loading}
                />
              ))}
            </div>
          </>
        )}

        {activeTab !== "visao-geral" && (
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
