"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2, AlertCircle, Search, Filter, BarChart2, Sparkles, X, ChevronDown, ChevronUp, Trophy, TrendingDown, ExternalLink } from "lucide-react"
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

interface CreativeData {
  ad_id: string
  object_type?: string
  headline?: string
  body?: string
  thumbnail_url?: string
  image_url?: string
  video_frames?: string[]
}

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
  const [somenteAtivos, setSomenteAtivos] = useState(true)

  /* ── agente de análise geral ── */
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState("")
  const [analysisText, setAnalysisText] = useState("")
  const [analysisError, setAnalysisError] = useState("")
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisMeta, setAnalysisMeta] = useState<{ hadThumbnails?: boolean; hadBenchmarks?: boolean; hadTrends?: boolean } | null>(null)
  const analysisPanelRef = useRef<HTMLDivElement>(null)

  /* ── agente de ranking ── */
  const [rankingAnalyzing, setRankingAnalyzing] = useState(false)
  const [rankingAnalysisText, setRankingAnalysisText] = useState("")
  const [rankingAnalysisError, setRankingAnalysisError] = useState("")
  const [showRankingAnalysis, setShowRankingAnalysis] = useState(false)
  const rankingPanelRef = useRef<HTMLDivElement>(null)

  /* ── iframe ads-squad ── */
  const [showAdsSquad, setShowAdsSquad] = useState(false)

  useEffect(() => {
    // vertical IN ('Serviços', 'Servicos', 'SZS') — cobre variantes do valor na Nekt
    // somenteAtivos: filtra por ad_id/campaign_name que tiveram spend nos últimos 7 dias
    const ativoAdFilter = somenteAtivos
      ? `AND ad_id IN (SELECT DISTINCT ad_id FROM nekt_silver.ads_unificado WHERE vertical IN ('Serviços', 'Servicos', 'SZS') AND date >= CURRENT_DATE - INTERVAL '7' DAY AND spend > 0)`
      : ""
    const ativoCampFilter = somenteAtivos
      ? `AND campaign_name IN (SELECT DISTINCT campaign_name FROM nekt_silver.ads_unificado WHERE vertical IN ('Serviços', 'Servicos', 'SZS') AND date >= CURRENT_DATE - INTERVAL '7' DAY AND spend > 0)`
      : ""

    async function fetchData() {
      setLoading(true)
      setError("")
      try {
        const [adRes, campRes] = await Promise.all([
          fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sql: `SELECT ad_name, ad_id, campaign_name, adset_name, SUM(spend) AS investimento, SUM(impressions) AS impressoes, SUM(lead) AS leads, SUM(mql) AS mql, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE vertical IN ('Serviços', 'Servicos', 'SZS') AND date >= DATE '${dataInicio}' AND date <= DATE '${dataFim}' ${ativoAdFilter} GROUP BY ad_name, ad_id, campaign_name, adset_name ORDER BY investimento DESC`,
            }),
          }),
          fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sql: `SELECT campaign_name, SUM(spend) AS investimento, SUM(impressions) AS impressoes, SUM(lead) AS leads, SUM(mql) AS mql, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE vertical IN ('Serviços', 'Servicos', 'SZS') AND date >= DATE '${dataInicio}' AND date <= DATE '${dataFim}' ${ativoCampFilter} GROUP BY campaign_name ORDER BY investimento DESC`,
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
  }, [dataInicio, dataFim, somenteAtivos])

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

  /* ── ranking top 3 / bottom 3 ── */
  const rankingTop3 = useMemo(() => {
    const withWon = filteredAds.filter(r => r.won > 0)
    return [...withWon]
      .sort((a, b) => (a.investimento / a.won) - (b.investimento / b.won))
      .slice(0, 3)
  }, [filteredAds])

  const rankingBottom3 = useMemo(() => {
    // Piores: prioridade a 0 WON com alto gasto, depois alto CAC
    const withoutWon = filteredAds
      .filter(r => r.won === 0 && r.investimento > 200)
      .sort((a, b) => b.investimento - a.investimento)
    const withWon = filteredAds
      .filter(r => r.won > 0)
      .sort((a, b) => (b.investimento / b.won) - (a.investimento / a.won))
    return [...withoutWon, ...withWon].slice(0, 3)
  }, [filteredAds])

  async function handleRankingAnalyze() {
    if (rankingTop3.length === 0) return
    setRankingAnalyzing(true)
    setRankingAnalysisError("")
    setRankingAnalysisText("")
    setShowRankingAnalysis(true)
    setTimeout(() => rankingPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    try {
      // Busca criativos dos 6 ads do ranking
      const rankingIds = [...rankingTop3, ...rankingBottom3].map(r => r.ad_id)
      let creativeData: CreativeData[] = []
      try {
        const metaRes = await fetch("/api/meta-creatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_ids: rankingIds }),
        })
        if (metaRes.ok) creativeData = (await metaRes.json()).results || []
      } catch { /* continua sem visual */ }

      const res = await fetch("/api/analyze-creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: [...rankingTop3, ...rankingBottom3],
          groupBy: "anuncio",
          dataInicio,
          dataFim,
          creativeData,
          rankingMode: true,
          rankingTop3,
          rankingBottom3,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro na análise")
      setRankingAnalysisText(data.analysis)
    } catch (e) {
      setRankingAnalysisError(String(e))
    } finally {
      setRankingAnalyzing(false)
    }
  }

  async function handleAnalyze() {
    const rows = groupBy === "anuncio" ? filteredAds : filteredCamps
    if (rows.length === 0) return
    setAnalyzing(true)
    setAnalysisError("")
    setAnalysisText("")
    setAnalysisMeta(null)
    setShowAnalysis(true)
    setTimeout(() => analysisPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    try {
      /* step 1: busca copy + frames via Meta API (apenas por anúncio) */
      let creativeData: CreativeData[] = []
      if (groupBy === "anuncio") {
        setAnalyzeStep("Buscando criativos (copy + frames) no Meta Ads...")
        const topIds = filteredAds.slice(0, 20).map(r => r.ad_id)
        try {
          const metaRes = await fetch("/api/meta-creatives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ad_ids: topIds }),
          })
          if (metaRes.ok) {
            const metaData = await metaRes.json()
            creativeData = metaData.results || []
          }
        } catch {
          // silencia falha — análise continua sem dados visuais/copy
        }
      }

      /* step 2: análise principal */
      setAnalyzeStep("Analisando criativos com IA...")
      const res = await fetch("/api/analyze-creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, groupBy, dataInicio, dataFim, creativeData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro na análise")
      setAnalysisText(data.analysis)
      setAnalysisMeta({ hadThumbnails: data.hadThumbnails, hadBenchmarks: data.hadBenchmarks, hadTrends: data.hadTrends })
    } catch (e) {
      setAnalysisError(String(e))
    } finally {
      setAnalyzing(false)
      setAnalyzeStep("")
    }
  }

  /* renderiza markdown simples (bold, headers, listas) sem dependência externa */
  function renderMarkdown(text: string) {
    const lines = text.split("\n")
    return lines.map((line, i) => {
      // h2
      if (line.startsWith("## ")) {
        return <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "16px 0 6px", paddingBottom: 4, borderBottom: `1px solid ${T.border}` }}>
          {line.replace(/^## /, "")}
        </h3>
      }
      // h3
      if (line.startsWith("### ")) {
        return <h4 key={i} style={{ fontSize: 12, fontWeight: 700, color: T.cardFg, margin: "12px 0 4px" }}>
          {line.replace(/^### /, "")}
        </h4>
      }
      // blockquote
      if (line.startsWith("> ")) {
        return <blockquote key={i} style={{ margin: "6px 0", paddingLeft: 10, borderLeft: `3px solid ${T.border}`, color: T.mutedFg, fontSize: 12 }}>
          {parseBold(line.replace(/^> /, ""))}
        </blockquote>
      }
      // list item
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} style={{ fontSize: 12, color: T.cardFg, marginBottom: 3, paddingLeft: 4 }}>
          {parseBold(line.replace(/^[-*] /, ""))}
        </li>
      }
      // numbered list
      if (/^\d+\. /.test(line)) {
        return <li key={i} style={{ fontSize: 12, color: T.cardFg, marginBottom: 3, paddingLeft: 4, listStyleType: "decimal" }}>
          {parseBold(line.replace(/^\d+\. /, ""))}
        </li>
      }
      // separator
      if (line.trim() === "---") {
        return <hr key={i} style={{ border: "none", borderTop: `1px solid ${T.border}`, margin: "10px 0" }} />
      }
      // empty line
      if (line.trim() === "") return <br key={i} />
      // paragraph
      return <p key={i} style={{ fontSize: 12, color: T.cardFg, margin: "4px 0", lineHeight: 1.6 }}>{parseBold(line)}</p>
    })
  }

  function parseBold(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} style={{ background: `${T.roxo600}15`, color: T.roxo600, padding: "1px 4px", borderRadius: 3, fontSize: 11, fontFamily: "monospace" }}>{part.slice(1, -1)}</code>
      }
      return part
    })
  }

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

          {/* Toggle: apenas ativos */}
          <button onClick={() => setSomenteAtivos(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            background: somenteAtivos ? "#10b98115" : T.muted,
            color: somenteAtivos ? "#10b981" : T.mutedFg,
            border: `1px solid ${somenteAtivos ? "#10b981" : T.border}`,
            borderRadius: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: somenteAtivos ? "#10b981" : T.border,
              boxShadow: somenteAtivos ? "0 0 0 3px #10b98130" : "none",
            }} />
            Apenas ativos
          </button>

          {/* Analisar com IA */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || loading || (filteredAds.length === 0 && filteredCamps.length === 0)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: analyzing ? "wait" : "pointer", fontFamily: T.font,
              background: analyzing ? `${T.roxo600}20` : T.roxo600,
              color: analyzing ? T.roxo600 : "#fff",
              border: `1px solid ${T.roxo600}`,
              borderRadius: 6, opacity: (loading || (filteredAds.length === 0 && filteredCamps.length === 0)) ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {analyzing
              ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
              : <Sparkles size={12} />
            }
            {analyzing ? "Analisando..." : "Analisar com IA"}
          </button>

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

        {/* ── Ranking Top 3 / Bottom 3 ── */}
        {!loading && !error && groupBy === "anuncio" && rankingTop3.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, boxShadow: T.elevSm }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={14} color={T.laranja500} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.cardFg }}>Ranking de Criativos</span>
                <span style={{ fontSize: 11, color: T.mutedFg }}>— por CAC</span>
              </div>
              <button
                onClick={handleRankingAnalyze}
                disabled={rankingAnalyzing || loading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: rankingAnalyzing ? "wait" : "pointer",
                  background: rankingAnalyzing ? `${T.laranja500}20` : T.laranja500,
                  color: rankingAnalyzing ? T.laranja500 : "#fff",
                  border: `1px solid ${T.laranja500}`, borderRadius: 6,
                  fontFamily: T.font, opacity: loading ? 0.5 : 1,
                }}
              >
                {rankingAnalyzing ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={11} />}
                {rankingAnalyzing ? "Analisando..." : "Analisar Ranking com IA"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Top 3 */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.verde600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Trophy size={10} /> Melhores — menor CAC
                </p>
                {rankingTop3.map((r, i) => {
                  const cac = r.won > 0 ? r.investimento / r.won : 0
                  const medals = ["🥇", "🥈", "🥉"]
                  return (
                    <div key={r.ad_id} style={{
                      background: `${T.verde600}08`, border: `1px solid ${T.verde600}30`,
                      borderRadius: 8, padding: "8px 10px", marginBottom: 6,
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.2 }}>{medals[i]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: T.cardFg, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.ad_name}>
                            {r.ad_name}
                          </p>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: T.verde600 }}>CAC R$ {fmt(cac)}</span>
                            <span style={{ fontSize: 10, color: T.mutedFg }}>{r.won} WON · R$ {fmt(r.investimento)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom 3 */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.destructive, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingDown size={10} /> Piores — maior CAC / 0 WON
                </p>
                {rankingBottom3.map((r, i) => {
                  const cac = r.won > 0 ? r.investimento / r.won : null
                  return (
                    <div key={r.ad_id} style={{
                      background: `${T.destructive}08`, border: `1px solid ${T.destructive}25`,
                      borderRadius: 8, padding: "8px 10px", marginBottom: 6,
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.2 }}>{"💀⚠️🔴"[i * 2]}️</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: T.cardFg, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.ad_name}>
                            {r.ad_name}
                          </p>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: T.destructive }}>
                              {cac ? `CAC R$ ${fmt(cac)}` : "0 WON"}
                            </span>
                            <span style={{ fontSize: 10, color: T.mutedFg }}>{r.won} WON · R$ {fmt(r.investimento)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Painel análise ranking */}
            {showRankingAnalysis && (
              <div ref={rankingPanelRef} style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={12} color={T.laranja500} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.laranja500 }}>Análise de Ranking — IA</span>
                    {rankingAnalyzing && (
                      <span style={{ fontSize: 10, color: T.mutedFg, display: "flex", alignItems: "center", gap: 3 }}>
                        <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                        Analisando top 3 vs. piores 3...
                      </span>
                    )}
                  </div>
                  <button onClick={() => { setShowRankingAnalysis(false); setRankingAnalysisText("") }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.mutedFg, padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>

                {rankingAnalysisError && (
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <AlertCircle size={13} color={T.destructive} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: T.destructive, fontFamily: "monospace" }}>{rankingAnalysisError}</span>
                  </div>
                )}

                {rankingAnalyzing && !rankingAnalysisText && (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <Loader2 size={18} color={T.laranja500} style={{ animation: "spin 1s linear infinite" }} />
                    <p style={{ fontSize: 11, color: T.mutedFg, marginTop: 8 }}>Comparando top 3 vs. piores 3 · Copy · Visual · Briefs para novos criativos...</p>
                  </div>
                )}

                {rankingAnalysisText && (
                  <div style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {renderMarkdown(rankingAnalysisText)}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
                    {["Criativo", "ID do Criativo", "Campanha", "Conjunto", "Investimento", "Impressões", "Leads", "MQL", "WON", "CPL", "CAC"].map(col => (
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
                      <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                        <code style={{ fontSize: 11, fontFamily: "monospace", color: T.mutedFg, background: T.muted, padding: "2px 6px", borderRadius: 4 }}>
                          {row.ad_id}
                        </code>
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

        {/* ── Painel de Análise IA ── */}
        {showAnalysis && (
          <div ref={analysisPanelRef} style={{
            marginTop: 16, background: T.card, border: `1px solid ${T.roxo600}40`,
            borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm,
          }}>
            {/* header do painel */}
            <div style={{
              padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: `${T.roxo600}08`, flexWrap: "wrap", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Sparkles size={14} color={T.roxo600} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.roxo600 }}>
                  Análise de Criativos — IA
                </span>
                {analyzing && (
                  <span style={{ fontSize: 11, color: T.mutedFg, display: "flex", alignItems: "center", gap: 4 }}>
                    <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                    {analyzeStep || "Gerando análise..."}
                  </span>
                )}
                {/* badges de contexto (após análise concluída) */}
                {!analyzing && analysisMeta && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {analysisMeta.hadBenchmarks && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: `${T.teal600}15`, color: T.teal600 }}>
                        + Benchmarks 180d
                      </span>
                    )}
                    {analysisMeta.hadTrends && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: `${T.verde600}15`, color: T.verde600 }}>
                        + Tendência 8 sem.
                      </span>
                    )}
                    {analysisMeta.hadThumbnails && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: `${T.laranja500}15`, color: T.laranja500 }}>
                        + Visual + Copy
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShowAnalysis(v => !v)} style={{
                  background: "none", border: "none", cursor: "pointer", color: T.mutedFg, display: "flex", alignItems: "center", padding: 2,
                }}>
                  {showAnalysis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <button onClick={() => { setShowAnalysis(false); setAnalysisText("") }} style={{
                  background: "none", border: "none", cursor: "pointer", color: T.mutedFg, display: "flex", alignItems: "center", padding: 2,
                }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* corpo */}
            <div style={{ padding: "16px 20px" }}>
              {analysisError && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <AlertCircle size={14} color={T.destructive} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: T.destructive, fontFamily: "monospace" }}>{analysisError}</span>
                </div>
              )}

              {analyzing && !analysisText && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <Loader2 size={20} color={T.roxo600} style={{ animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: 12, color: T.mutedFg, marginTop: 10 }}>
                    {analyzeStep || `Processando ${groupBy === "anuncio" ? filteredAds.length : filteredCamps.length} ${groupBy === "anuncio" ? "criativos" : "campanhas"}...`}
                  </p>
                  <p style={{ fontSize: 11, color: T.mutedFg, marginTop: 4 }}>
                    Benchmarks históricos · Tendência semanal · Padrões de copy
                    {groupBy === "anuncio" ? " · Análise visual" : ""}
                  </p>
                </div>
              )}

              {analysisText && (
                <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {renderMarkdown(analysisText)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Ads Squad — painel do Sampaio (iframe) ── */}
        <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
          <button
            onClick={() => setShowAdsSquad(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 18px", background: "none", border: "none", cursor: "pointer",
              fontFamily: T.font,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.cinza600, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>Ads Squad</span>
              <span style={{ fontSize: 11, color: T.mutedFg }}>— artefato do Sampaio</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a
                href="https://artefatos-growth-seazone.vercel.app/ads-squad"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: T.mutedFg, textDecoration: "none" }}
              >
                <ExternalLink size={11} /> abrir em nova aba
              </a>
              {showAdsSquad ? <ChevronUp size={14} color={T.mutedFg} /> : <ChevronDown size={14} color={T.mutedFg} />}
            </div>
          </button>

          {showAdsSquad && (
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, color: T.mutedFg, margin: "6px 18px", fontStyle: "italic" }}>
                Login via GitHub — se ainda não estiver logado, use "abrir em nova aba" acima para autenticar e volte aqui.
              </p>
              <iframe
                src="https://artefatos-growth-seazone.vercel.app/ads-squad"
                style={{ width: "100%", height: 720, border: "none", display: "block" }}
                allow="clipboard-read; clipboard-write"
              />
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
