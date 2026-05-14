"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2, AlertCircle, Search, ExternalLink, Filter, BarChart2 } from "lucide-react"
import { T } from "@/lib/constants"

/* ── helpers ── */
function extractEmpreendimento(campaign: string, adName: string): string {
  const cn = campaign + " " + adName
  const spots = [
    "Cachoeira Beach Spot","Ilha do Campeche II Spot","Rosa Sul Spot","Santinho Spot",
    "Santo Ant\u00f4nio Spot","Ingleses Spot","Urubici Spot II","Urubici Spot","Sul da Ilha Spot",
    "Japaratinga Spot","Rosa Norte Spot","Ponta das Canas Spot","Morro das Pedras Spot",
    "Novo Campeche Spot","Batel Spot","Foz Spot","Meireles Spot","Bonito Spot","Penha Spot",
  ]
  for (const s of spots) { if (cn.includes(s)) return s }
  if (campaign.includes("Gen\u00e9rico") && campaign.includes("Norte")) return "Norte da Ilha (Gen\u00e9rico)"
  if (campaign.includes("Gen\u00e9rico") && campaign.includes("Sul")) return "Sul da Ilha (Gen\u00e9rico)"
  if (campaign.includes("Engajamento")) return "Engajamento (Geral)"
  if (campaign.includes("Empreendimentos Unificado")) return "Empreendimentos Unificado"
  if (campaign.includes("Melhores ADs")) return "Melhores ADs (Mix)"
  if (campaign.includes("Remarketing") && !cn.match(/Spot/)) return "Remarketing (Geral)"
  return "Outros"
}

function extractTipo(adName: string): string {
  if (/V\u00cdDEO APRESENTADOR|V\u00eddeo [Aa]presentador/i.test(adName)) return "V\u00eddeo Apresentador(a)"
  if (/V\u00cdDEO NARRADO|V\u00eddeo [Nn]arrado/i.test(adName)) return "V\u00eddeo Narrado"
  if (/V\u00cdDEO|V\u00eddeo/i.test(adName)) return "V\u00eddeo"
  if (/EST\u00c1TICO|Est\u00e1tico/i.test(adName)) return "Est\u00e1tico"
  if (/Carrossel/i.test(adName)) return "Carrossel"
  return "Outro"
}

const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR")

const ACT_ID = "799783985155825"

interface Row { ad_name: string; ad_id: string; campaign_name: string; investimento: number; impressoes: number; cliques: number; leads: number; mql: number; empreendimento: string; tipo: string }

/* ── component ── */
export default function MarketplaceAdsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [allRows, setAllRows] = useState<Row[]>([])

  // filters
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 90)
    return d.toISOString().slice(0, 10)
  })
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10))
  const [empFilter, setEmpFilter] = useState("Todos")
  const [busca, setBusca] = useState("")

  async function fetchData() {
    setLoading(true)
    setError("")
    try {
      const sql = `SELECT ad_name, ad_id, campaign_name, SUM(spend) AS investimento, SUM(impressions) AS impressoes, SUM(clicks) AS cliques, SUM(lead) AS leads, SUM(mql) AS mql FROM nekt_operacional_silver.ads_unificado WHERE vertical = 'Marketplace' AND date >= '${dataInicio}' AND date <= '${dataFim}' GROUP BY ad_name, ad_id, campaign_name ORDER BY investimento DESC`
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro desconhecido")
      const rows: Row[] = (data.rows || []).map((r: Record<string, string | number | null>) => ({
        ad_name: String(r.ad_name || ""),
        ad_id: String(r.ad_id || ""),
        campaign_name: String(r.campaign_name || ""),
        investimento: Number(r.investimento) || 0,
        impressoes: Number(r.impressoes) || 0,
        cliques: Number(r.cliques) || 0,
        leads: Number(r.leads) || 0,
        mql: Number(r.mql) || 0,
        empreendimento: extractEmpreendimento(String(r.campaign_name || ""), String(r.ad_name || "")),
        tipo: extractTipo(String(r.ad_name || "")),
      }))
      setAllRows(rows)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [dataInicio, dataFim])

  // derived
  const empreendimentos = useMemo(() => {
    const set = new Set(allRows.map(r => r.empreendimento))
    return ["Todos", ...Array.from(set).sort()]
  }, [allRows])

  const filtered = useMemo(() => {
    let rows = allRows
    if (empFilter !== "Todos") rows = rows.filter(r => r.empreendimento === empFilter)
    if (busca.trim()) {
      const q = busca.toLowerCase()
      rows = rows.filter(r => r.ad_name.toLowerCase().includes(q) || r.campaign_name.toLowerCase().includes(q))
    }
    return rows
  }, [allRows, empFilter, busca])

  const totals = useMemo(() => ({
    investimento: filtered.reduce((s, r) => s + r.investimento, 0),
    impressoes: filtered.reduce((s, r) => s + r.impressoes, 0),
    cliques: filtered.reduce((s, r) => s + r.cliques, 0),
    leads: filtered.reduce((s, r) => s + r.leads, 0),
    mql: filtered.reduce((s, r) => s + r.mql, 0),
    qtd: filtered.length,
  }), [filtered])

  const cpl = totals.leads > 0 ? totals.investimento / totals.leads : 0
  const cpMql = totals.mql > 0 ? totals.investimento / totals.mql : 0

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
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.teal600, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Criativos Marketplace</span>
      </header>

      <main style={{ padding: "24px 24px 64px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 4px" }}>Nekt &middot; Meta Ads</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.cardFg, margin: 0 }}>Criativos Marketplace</h1>
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
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>At\u00e9</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted,
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>
              <Filter size={10} style={{ marginRight: 3 }} />Empreendimento
            </label>
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, minWidth: 180,
            }}>
              {empreendimentos.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 4 }}>
              <Search size={10} style={{ marginRight: 3 }} />Buscar por nome
            </label>
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex: swot, Foz Spot, Brenda..." style={{
              padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, width: "100%",
            }} />
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Criativos", value: fmtInt(totals.qtd), color: T.primary },
              { label: "Investimento", value: `R$ ${fmt(totals.investimento)}`, color: T.laranja500 },
              { label: "Impress\u00f5es", value: fmtInt(totals.impressoes), color: T.cinza600 },
              { label: "Cliques", value: fmtInt(totals.cliques), color: T.indigo600 },
              { label: "Leads", value: fmtInt(totals.leads), color: T.teal600 },
              { label: "MQL", value: fmtInt(totals.mql), color: T.verde600 },
              { label: "CPL", value: `R$ ${fmt(cpl)}`, color: T.roxo600 },
              { label: "CPA MQL", value: `R$ ${fmt(cpMql)}`, color: T.destructive },
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
            <Loader2 size={24} color={T.primary} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13, color: T.mutedFg, marginTop: 12 }}>Carregando criativos...</p>
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

        {/* ── Table ── */}
        {!loading && !error && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart2 size={14} color={T.mutedFg} />
              <span style={{ fontSize: 12, color: T.mutedFg }}>{filtered.length} criativo{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.muted }}>
                    {["Criativo","Empreendimento","Tipo","Investimento","Impress\u00f5es","Cliques","Leads","MQL","CPL","Ads Manager"].map(col => (
                      <th key={col} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={`${row.ad_id}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = T.muted }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}
                    >
                      <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.ad_name}>
                        {row.ad_name}
                      </td>
                      <td style={{ padding: "7px 10px", color: T.cardFg, whiteSpace: "nowrap" }}>
                        <span style={{ background: `${T.teal600}15`, color: T.teal600, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {row.empreendimento}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, whiteSpace: "nowrap", fontSize: 11 }}>{row.tipo}</td>
                      <td style={{ padding: "7px 10px", color: T.cardFg, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>R$ {fmt(row.investimento)}</td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmtInt(row.impressoes)}</td>
                      <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmtInt(row.cliques)}</td>
                      <td style={{ padding: "7px 10px", color: T.teal600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.leads)}</td>
                      <td style={{ padding: "7px 10px", color: T.verde600, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{fmtInt(row.mql)}</td>
                      <td style={{ padding: "7px 10px", color: T.roxo600, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {row.leads > 0 ? `R$ ${fmt(row.investimento / row.leads)}` : "\u2014"}
                      </td>
                      <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                        <a
                          href={`https://business.facebook.com/adsmanager/manage/ads?act=${ACT_ID}&selected_ad_ids=${row.ad_id}&filter_set=SEARCH_BY_ADGROUP_IDS-STRING_SET%1EANY%1E%5B%22${row.ad_id}%22%5D`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: `${T.primary}10`, color: T.primary,
                            padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                            textDecoration: "none", border: `1px solid ${T.primary}30`,
                          }}
                        >
                          <ExternalLink size={10} /> Ver
                        </a>
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
