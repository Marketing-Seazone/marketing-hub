"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2, AlertCircle, Search, Filter, BarChart2 } from "lucide-react"
import { T } from "@/lib/constants"

/* ── helpers ── */
const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR")

interface AdRow {
  ad_name: string
  ad_id: string
  campaign_name: string
  adset_name: string
  investimento: number
  impressoes: number
  leads: number
  mql: number
  won: number
}

interface CampRow {
  campaign_name: string
  investimento: number
  impressoes: number
  leads: number
  mql: number
  won: number
}

type GroupBy = "anuncio" | "campanha"

/* ── component ── */
export default function SzsAdsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [allAdRows, setAllAdRows] = useState<AdRow[]>([])
  const [allCampRows, setAllCampRows] = useState<CampRow[]>([])
  const [groupBy, setGroupBy] = useState<GroupBy>("anuncio")

  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 90)
    return d.toISOString().slice(0, 10)
  })
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10))
  const [campFilter, setCampFilter] = useState("Todas")
  const [busca, setBusca] = useState("")

  useEffect(() => {
    // vertical = 'Servicos' é o valor correto conforme documentado em CLAUDE.md (sem acento)
    async function fetchData() {
      setLoading(true)
      setError("")
      try {
        const [adRes, campRes] = await Promise.all([
          fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sql: `SELECT ad_name, ad_id, campaign_name, adset_name, SUM(spend) AS investimento, SUM(impressions) AS impressoes, SUM(lead) AS leads, SUM(mql) AS mql, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE vertical = 'SZS' AND date >= DATE '${dataInicio}' AND date <= DATE '${dataFim}' GROUP BY ad_name, ad_id, campaign_name, adset_name ORDER BY investimento DESC`,
            }),
          }),
          fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sql: `SELECT campaign_name, SUM(spend) AS investimento, SUM(impressions) AS impressoes, SUM(lead) AS leads, SUM(mql) AS mql, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE vertical = 'SZS' AND date >= DATE '${dataInicio}' AND date <= DATE '${dataFim}' GROUP BY campaign_name ORDER BY investimento DESC`,
            }),
          }),
        ])

        const adData = await adRes.json()
        const campData = await campRes.json()

        if (!adRes.ok) throw new Error(adData.error || "Erro ao buscar anúncios")
        if (!campRes.ok) throw new Error(campData.error || "Erro ao buscar campanhas")

        setAllAdRows((adData.rows || []).map((r: Record<string, string | number | null>) => ({
          ad_name: String(r.ad_name || ""),
          ad_id: String(r.ad_id || ""),
          campaign_name: String(r.campaign_name || ""),
          adset_name: String(r.adset_name || ""),
          investimento: Number(r.investimento) || 0,
          impressoes: Number(r.impressoes) || 0,
          leads: Number(r.leads) || 0,
          mql: Number(r.mql) || 0,
          won: Number(r.won) || 0,
        })))

        setAllCampRows((campData.rows || []).map((r: Record<string, string | number | null>) => ({
          campaign_name: String(r.campaign_name || ""),
          investimento: Number(r.investimento) || 0,
          impressoes: Number(r.impressoes) || 0,
          leads: Number(r.leads) || 0,
          mql: Number(r.mql) || 0,
          won: Number(r.won) || 0,
        })))
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [dataInicio, dataFim])

  const campanhas = useMemo(() => {
    const set = new Set(allAdRows.map(r => r.campaign_name))
    return ["Todas", ...Array.from(set).sort()]
  }, [allAdRows])

  const filteredAds = useMemo(() => {
    let rows = allAdRows
    if (campFilter !== "Todas") rows = rows.filter(r => r.campaign_name === campFilter)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      rows = rows.filter(r => r.ad_name.toLowerCase().includes(q) || r.campaign_name.toLowerCase().includes(q))
    }
    return rows
  }, [allAdRows, campFilter, busca])

  const filteredCamps = useMemo(() => {
    let rows = allCampRows
    if (busca.trim()) {
      const q = busca.toLowerCase()
      rows = rows.filter(r => r.campaign_name.toLowerCase().includes(q))
    }
    return rows
  }, [allCampRows, busca])

  const totals = useMemo(() => {
    const rows = groupBy === "anuncio" ? filteredAds : filteredCamps
    return {
      investimento: rows.reduce((s, r) => s + r.investimento, 0),
      impressoes: rows.reduce((s, r) => s + r.impressoes, 0),
      leads: rows.reduce((s, r) => s + r.leads, 0),
      mql: rows.reduce((s, r) => s + r.mql, 0),
      won: rows.reduce((s, r) => s + r.won, 0),
      qtd: rows.length,
    }
  }, [filteredAds, filteredCamps, groupBy])

  const cpl = totals.leads > 0 ? totals.investimento / totals.leads : 0
  const cac = totals.won > 0 ? totals.investimento / totals.won : 0

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>
      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
          <ChevronLeft size={14} /> Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.roxo600, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Criativos SZS</span>
      </header>

      <main style={{ padding: "24px 24px 64px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 4px" }}>Nekt · Meta Ads</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.cardFg, margin: 0 }}>Criativos SZS — Proprietários</h1>
        </div>

        {/* ── Filtros ── */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: "16px 20px", marginBottom: 16, boxShadow: T.elevSm,
          display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>De</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted,
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>Até</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted,
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>
              <Filter size={10} style={{ marginRight: 3 }} />Campanha
            </label>
            <select value={campFilter} onChange={e => setCampFilter(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, minWidth: 200,
            }}>
              {campanhas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>
              <Search size={10} style={{ marginRight: 3 }} />Buscar por nome
            </label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex: Florianópolis, gestão..." style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, width: "100%",
            }} />
          </div>

          {/* GroupBy toggle */}
          <div style={{ display: "flex", gap: 0 }}>
            {(["anuncio", "campanha"] as GroupBy[]).map((g, i) => (
              <button key={g} onClick={() => setGroupBy(g)} style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                background: groupBy === g ? T.roxo600 : T.muted,
                color: groupBy === g ? "#fff" : T.mutedFg,
                border: `1px solid ${groupBy === g ? T.roxo600 : T.border}`,
                borderRadius: i === 0 ? "6px 0 0 6px" : "0 6px 6px 0",
                borderLeft: i === 1 ? "none" : undefined,
              }}>
                {g === "anuncio" ? "Por anúncio" : "Por campanha"}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: groupBy === "anuncio" ? "Criativos" : "Campanhas", value: fmtInt(totals.qtd), color: T.primary },
              { label: "Investimento", value: `R$ ${fmt(totals.investimento)}`, color: T.laranja500 },
              { label: "Impressões", value: fmtInt(totals.impressoes), color: T.cinza600 },
              { label: "Leads", value: fmtInt(totals.leads), color: T.teal600 },
              { label: "MQL", value: fmtInt(totals.mql), color: T.verde600 },
              { label: "WON", value: fmtInt(totals.won), color: T.primary },
              { label: "CPL", value: `R$ ${fmt(cpl)}`, color: T.roxo600 },
              { label: "CAC", value: `R$ ${fmt(cac)}`, color: T.destructive },
            ].map(kpi => (
              <div key={kpi.label} style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                padding: "12px 16px", boxShadow: T.elevSm,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Loader2 size={24} color={T.roxo600} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13, color: T.mutedFg, marginTop: 12 }}>Carregando dados...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: `${T.destructive}10`, border: `1px solid ${T.destructive}30`,
            borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16,
          }}>
            <AlertCircle size={16} color={T.destructive} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: T.destructive, fontFamily: "monospace" }}>{error}</span>
          </div>
        )}

        {/* ── Table: Por anúncio ── */}
        {!loading && !error && groupBy === "anuncio" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={14} color={T.mutedFg} />
              <span style={{ fontSize: 12, color: T.mutedFg }}>{filteredAds.length} criativo{filteredAds.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.muted }}>
                    {["Criativo", "Campanha", "Conjunto", "Investimento", "Impressões", "Leads", "MQL", "WON", "CPL", "CAC"].map(col => (
                      <th key={col} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((row, i) => (
                    <tr key={`${row.ad_id}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = T.muted }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}
                    >
                      <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.ad_name}>
                        {row.ad_name}
                      </td>
                      <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.campaign_name}>
                        <span style={{ background: `${T.roxo600}15`, color: T.roxo600, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {row.campaign_name}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }} title={row.adset_name}>
                        {row.adset_name}
                      </td>
                      <td style={{ padding: "7px 10px", color: T.cardFg, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>R$ {fmt(row.investimento)}</td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmtInt(row.impressoes)}</td>
                      <td style={{ padding: "7px 10px", color: T.teal600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.leads)}</td>
                      <td style={{ padding: "7px 10px", color: T.verde600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.mql)}</td>
                      <td style={{ padding: "7px 10px", color: T.primary, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.won)}</td>
                      <td style={{ padding: "7px 10px", color: T.roxo600, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.leads > 0 ? `R$ ${fmt(row.investimento / row.leads)}` : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", color: T.destructive, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.won > 0 ? `R$ ${fmt(row.investimento / row.won)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Table: Por campanha ── */}
        {!loading && !error && groupBy === "campanha" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={14} color={T.mutedFg} />
              <span style={{ fontSize: 12, color: T.mutedFg }}>{filteredCamps.length} campanha{filteredCamps.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.muted }}>
                    {["Campanha", "Investimento", "Impressões", "Leads", "MQL", "WON", "CPL", "CAC"].map(col => (
                      <th key={col} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCamps.map((row, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = T.muted }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}
                    >
                      <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.campaign_name}>
                        <span style={{ background: `${T.roxo600}15`, color: T.roxo600, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {row.campaign_name}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", color: T.cardFg, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>R$ {fmt(row.investimento)}</td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmtInt(row.impressoes)}</td>
                      <td style={{ padding: "7px 10px", color: T.teal600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.leads)}</td>
                      <td style={{ padding: "7px 10px", color: T.verde600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.mql)}</td>
                      <td style={{ padding: "7px 10px", color: T.primary, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.won)}</td>
                      <td style={{ padding: "7px 10px", color: T.roxo600, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.leads > 0 ? `R$ ${fmt(row.investimento / row.leads)}` : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", color: T.destructive, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.won > 0 ? `R$ ${fmt(row.investimento / row.won)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
