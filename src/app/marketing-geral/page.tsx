"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { T } from "@/lib/constants"

// ============================================================
// TYPES
// ============================================================

interface NektResult {
  columns: string[]
  rows: Record<string, string | number | null>[]
}

// ============================================================
// DATA FETCHER — pulls live from Nekt via /api/query
// ============================================================

async function queryNekt(sql: string): Promise<NektResult> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status}`)
  return res.json()
}

// ============================================================
// STATIC DATA (editorial, ativação — não vem do Nekt)
// ============================================================

const CURRENT_MONTH = new Date().toLocaleString("pt-BR", { month: "short" }).replace(".", "")

const FOLLOWERS_DATA: Record<string, { label: string; platform: string; current: number; goals: Record<string, number> }> = {
  "@destinoseazone_ig": {
    label: "@destinoseazone", platform: "Instagram", current: 108500,
    goals: { abr: 110000, mai: 120000, jun: 130000, jul: 140000, ago: 150000, set: 160000, out: 170000, nov: 180000, dez: 190000 },
  },
  "@vistasdeanita_ig": {
    label: "@vistasdeanita", platform: "Instagram", current: 167200,
    goals: { abr: 170000, mai: 180000, jun: 190000, jul: 200000, ago: 210000, set: 220000, out: 230000, nov: 240000, dez: 250000 },
  },
  "@vistasdeanita_tt": {
    label: "@vistasdeanita", platform: "TikTok", current: 4800,
    goals: { abr: 5000, mai: 6000, jun: 7000, jul: 8000, ago: 9000, set: 10000, out: 11000, nov: 12000, dez: 13000 },
  },
  "@destinoseazone_tt": {
    label: "@destinoseazone", platform: "TikTok", current: 920,
    goals: { abr: 1000, mai: 2000, jun: 3000, jul: 4000, ago: 5000, set: 6000, out: 7000, nov: 8000, dez: 9000 },
  },
}

const EDITORIAL_CALENDAR = [
  { day: "Segunda", editoria: "Inteligência de Mercado", format: "Carrossel educativo", channels: ["Instagram"] },
  { day: "Terça", editoria: "Achados Seazone", format: "Oportunidade do portfólio", channels: ["Instagram", "TikTok"] },
  { day: "Quarta", editoria: "Dono no Controle", format: "Reels ou carrossel", channels: ["Instagram"] },
  { day: "Quinta", editoria: "Resultados Reais", format: "Prova social/depoimento", channels: ["Instagram"] },
  { day: "Sexta", editoria: "Onde Investir", format: "Carrossel ou Reels", channels: ["Instagram"] },
  { day: "Sábado", editoria: "Por dentro do Airbnb", format: "Reels rápido/dica", channels: ["Instagram", "TikTok"] },
  { day: "Domingo", editoria: "Autoridade Seazone", format: "Bastidor/institucional", channels: ["Instagram"] },
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

const EDITORIAS = [
  "Inteligência de Mercado", "Dono no Controle", "Onde Investir",
  "Resultados Reais", "Destinos Seazone", "Autoridade Seazone", "Por dentro do Airbnb",
]

const ATIVACAO_ORCAMENTO = {
  total: 688500, mensal: 114750,
  frentes: [
    { name: "SP · BH · RJ (cidades foco)", mensal: 82500, executado: 78200 },
    { name: "Salvador — manutenção", mensal: 11000, executado: 9800 },
    { name: "Novas cidades (A+B)", mensal: 5500, executado: 4200 },
    { name: "Eventos (3 ativações)", mensal: 5500, executado: 5500 },
    { name: "Urubici Spot", mensal: 2500, executado: 1800 },
    { name: "Patrocínio / parceria", mensal: 2250, executado: 2250 },
    { name: "Ações de experiência", mensal: 2200, executado: 1600 },
    { name: "Publicidade in-property", mensal: 3300, executado: 2900 },
  ],
}

const ATIVACAO_METRICAS = {
  acoesRealizadas: { real: 12, meta: 15, unit: "ações" },
  orcamentoExecutado: { real: 106250, meta: 114750, unit: "R$" },
  leadsBTL: { real: 47, meta: 60, unit: "leads" },
  ugcTTL: { real: 23, meta: 30, unit: "menções" },
  alcanceATL: { real: 185000, meta: 200000, unit: "pessoas" },
}

const NIVEIS_ATIVACAO = [
  { sigla: "ATL", nome: "Marca Memorável", desc: "OOH, patrocínio", indicadores: "Acessos diretos, seguidores, menções" },
  { sigla: "TTL", nome: "Consideração", desc: "Experiências, ativações presenciais", indicadores: "UGC, engajamento, tempo de exposição" },
  { sigla: "BTL", nome: "Conversão", desc: "Eventos qualificados, captação direta", indicadores: "Leads, taxa de conversão, CPC" },
]

const BACKOFFICE_STATUS = [
  { name: "Linktree", status: "ok" },
  { name: "Automações ativas", status: "ok" },
  { name: "Integrações entre ferramentas", status: "falha" },
  { name: "Processos documentados no Pipefy", status: "ok" },
]

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatNumber(n: number | null | undefined, unit?: string) {
  if (n === null || n === undefined) return "—"
  if (unit === "R$") return `R$ ${n.toLocaleString("pt-BR")}`
  if (unit === "%") return `${n}%`
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString("pt-BR")
}

function calcPercent(real: number | null, meta: number | null) {
  if (real === null || meta === null || meta === 0) return null
  return Math.round((real / meta) * 100)
}

function progressColor(pct: number | null) {
  if (pct === null) return T.cinza200
  if (pct >= 90) return "#10b981"
  if (pct >= 70) return "#f59e0b"
  return "#ef4444"
}

function progressTextColor(pct: number | null) {
  if (pct === null) return T.cinza400
  if (pct >= 90) return "#059669"
  if (pct >= 70) return "#d97706"
  return "#dc2626"
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function ProgressBar({ real, meta }: { real: number | null; meta: number | null }) {
  const pct = calcPercent(real, meta)
  const width = pct !== null ? Math.min(pct, 100) : 0
  return (
    <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 8, overflow: "hidden" }}>
      <div style={{
        width: `${pct !== null ? width : 100}%`,
        height: 8, borderRadius: 6,
        background: progressColor(pct),
        opacity: pct === null ? 0.3 : 1,
        transition: "width 0.5s",
      }} />
    </div>
  )
}

function KPICard({ label, real, meta, unit, fonte }: {
  label: string; real: number | null; meta: number | null; unit?: string; fonte?: string
}) {
  const pct = calcPercent(real, meta)
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: 20, boxShadow: T.elevSm,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        {fonte && <span style={{ fontSize: 10, color: T.cinza400, background: T.cinza50, padding: "2px 6px", borderRadius: 4 }}>{fonte}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: T.fg }}>{formatNumber(real, unit)}</span>
        <span style={{ fontSize: 13, color: T.cinza400, marginBottom: 2 }}>/ {formatNumber(meta, unit)}</span>
        <span style={{ fontSize: 13, fontWeight: 600, marginLeft: "auto", color: progressTextColor(pct) }}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </div>
      <ProgressBar real={real} meta={meta} />
    </div>
  )
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: T.fg, margin: 0, fontFamily: T.font }}>{children}</h2>
      {subtitle && <p style={{ fontSize: 13, color: T.mutedFg, marginTop: 4 }}>{subtitle}</p>}
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "12px 16px", fontSize: 13, whiteSpace: "nowrap", background: "none", border: "none", cursor: "pointer",
      borderBottom: active ? `2px solid ${T.primary}` : "2px solid transparent",
      color: active ? T.primary : T.mutedFg, fontWeight: active ? 600 : 400, fontFamily: T.font,
      transition: "color 0.15s",
    }}>
      {label}
    </button>
  )
}

// ============================================================
// TAB: VISÃO GERAL
// ============================================================

function VisaoGeral({ setTab, adsData }: { setTab: (t: string) => void; adsData: NektResult | null }) {
  const totalSpend = useMemo(() => {
    if (!adsData) return null
    return adsData.rows.reduce((sum, r) => sum + (Number(r.spend) || 0), 0)
  }, [adsData])

  const totalMQL = useMemo(() => {
    if (!adsData) return null
    return adsData.rows.reduce((sum, r) => sum + (Number(r.mql) || 0), 0)
  }, [adsData])

  const areas = [
    { name: "Mídias Sociais", kpi: "Seguidores @destinoseazone IG", real: 108500, meta: 110000, unit: "", tab: "midias-sociais", fonte: "Instagram API" },
    { name: "Mídia Paga", kpi: "Investimento mensal", real: totalSpend, meta: null, unit: "R$", tab: "midia-paga", fonte: "Nekt (Meta)" },
    { name: "Ativação", kpi: "Ações realizadas no mês", real: 12, meta: 15, unit: "ações", tab: "ativacao", fonte: "Planilha" },
    { name: "Funis", kpi: "MQLs gerados", real: totalMQL, meta: null, unit: "", tab: "funis", fonte: "Nekt (Pipedrive)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <SectionTitle subtitle="Clique em um card para ver detalhes">Resumo por Área</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {areas.map(a => (
            <div key={a.tab} onClick={() => setTab(a.tab)} style={{ cursor: "pointer" }}>
              <div style={{
                background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
                padding: 20, boxShadow: T.elevSm, transition: "box-shadow 0.15s, transform 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevMd; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = T.elevSm; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>{a.name}</span>
                  <span style={{ fontSize: 10, color: T.cinza400, background: T.cinza50, padding: "2px 6px", borderRadius: 4 }}>{a.fonte}</span>
                </div>
                <p style={{ fontSize: 12, color: T.mutedFg, margin: "0 0 12px" }}>{a.kpi}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: T.fg }}>{formatNumber(a.real, a.unit)}</span>
                  {a.meta && <span style={{ fontSize: 13, color: T.cinza400 }}>/ {formatNumber(a.meta, a.unit)}</span>}
                </div>
                {a.meta && <ProgressBar real={a.real} meta={a.meta} />}
                <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: T.primary }}>Ver detalhes →</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Followers */}
      <div>
        <SectionTitle subtitle={`Meta do mês: ${CURRENT_MONTH}/2025`}>Seguidores por Conta</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Object.values(FOLLOWERS_DATA).map((d, i) => {
            const goal = d.goals[CURRENT_MONTH] || d.goals.abr
            const pct = calcPercent(d.current, goal)
            return (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{d.platform === "Instagram" ? "📷" : "🎵"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.cardFg }}>{d.label}</span>
                  <span style={{ fontSize: 10, background: T.cinza50, color: T.cinza400, padding: "2px 6px", borderRadius: 4 }}>{d.platform}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{formatNumber(d.current)}</span>
                  <span style={{ fontSize: 12, color: T.cinza400 }}>/ {formatNumber(goal)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, marginLeft: "auto", color: progressTextColor(pct) }}>
                    {pct !== null ? `${pct}%` : "—"}
                  </span>
                </div>
                <ProgressBar real={d.current} meta={goal} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB: MÍDIAS SOCIAIS
// ============================================================

function MidiasSociais() {
  const months = ["abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)

  const editorialMix = useMemo(() =>
    EDITORIAS.map(e => ({ editoria: e, real: Math.floor(Math.random() * 5) + 1, planned: Math.floor(Math.random() * 3) + 3 })),
  [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Month selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: T.mutedFg, marginRight: 8 }}>Mês:</span>
        {months.map(m => (
          <button key={m} onClick={() => setSelectedMonth(m)} style={{
            padding: "4px 12px", fontSize: 13, borderRadius: 20, border: "none", cursor: "pointer",
            background: m === selectedMonth ? T.primary : T.cinza50,
            color: m === selectedMonth ? "#fff" : T.cinza600, fontWeight: m === selectedMonth ? 600 : 400,
          }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Followers */}
      <div>
        <SectionTitle subtitle={`Metas de seguidores — ${selectedMonth}/2025`}>Seguidores por Conta</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Object.values(FOLLOWERS_DATA).map((d, i) => {
            const goal = d.goals[selectedMonth] || 0
            const pct = calcPercent(d.current, goal)
            return (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16, boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span>{d.platform === "Instagram" ? "📷" : "🎵"}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.cardFg }}>{d.label}</span>
                  <span style={{ fontSize: 10, background: T.cinza50, color: T.cinza400, padding: "2px 6px", borderRadius: 4 }}>{d.platform}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{formatNumber(d.current)}</span>
                  <span style={{ fontSize: 12, color: T.cinza400 }}>/ {formatNumber(goal)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, marginLeft: "auto", color: progressTextColor(pct) }}>{pct !== null ? `${pct}%` : "—"}</span>
                </div>
                <ProgressBar real={d.current} meta={goal} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Roadmap table */}
      <div>
        <SectionTitle>Roadmap de Seguidores (Abr → Dez/2025)</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "auto", boxShadow: T.elevSm }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.cinza50 }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: T.mutedFg, position: "sticky", left: 0, background: T.cinza50 }}>Conta</th>
                {months.map(m => (
                  <th key={m} style={{ padding: "12px 16px", textAlign: "center", fontWeight: 500, color: m === selectedMonth ? T.primary : T.mutedFg, background: m === selectedMonth ? `${T.primary}10` : T.cinza50 }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(FOLLOWERS_DATA).map((d, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500, position: "sticky", left: 0, background: T.card }}>
                    {d.label} <span style={{ fontSize: 11, color: T.cinza400 }}>{d.platform}</span>
                  </td>
                  {months.map(m => (
                    <td key={m} style={{ padding: "12px 16px", textAlign: "center", fontWeight: m === selectedMonth ? 600 : 400, background: m === selectedMonth ? `${T.primary}10` : "transparent" }}>
                      {formatNumber(d.goals[m])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editorial compliance */}
      <div>
        <SectionTitle subtitle="Posts publicados na data planejada / total planejado">Calendário Editorial — Aderência</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, color: T.mutedFg, marginBottom: 8 }}>Aderência geral</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: T.fg, margin: "0 0 4px" }}>
              {Math.round((EDITORIAL_COMPLIANCE.total.published / EDITORIAL_COMPLIANCE.total.planned) * 100)}%
            </p>
            <p style={{ fontSize: 12, color: T.cinza400, marginBottom: 12 }}>{EDITORIAL_COMPLIANCE.total.published} de {EDITORIAL_COMPLIANCE.total.planned} posts</p>
            <ProgressBar real={EDITORIAL_COMPLIANCE.total.published} meta={EDITORIAL_COMPLIANCE.total.planned} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
            <p style={{ fontSize: 13, color: T.mutedFg, marginBottom: 12 }}>Status por dia da semana</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {EDITORIAL_COMPLIANCE.byDay.map(d => (
                <div key={d.day} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: T.cinza600, marginBottom: 8 }}>{d.day}</p>
                  <div style={{ background: T.cinza50, borderRadius: 8, padding: 8 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{d.count}/{d.planned}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 10,
                      background: d.count >= d.planned ? "#d1fae5" : d.count > 0 ? "#fef3c7" : "#dbeafe",
                      color: d.count >= d.planned ? "#065f46" : d.count > 0 ? "#92400e" : "#1e40af",
                    }}>
                      {d.count >= d.planned ? "OK" : d.count > 0 ? "Parcial" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly calendar */}
      <div>
        <SectionTitle subtitle="Planejamento semanal fixo de conteúdo">Calendário Semanal</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.elevSm }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.cinza50 }}>
                {["Dia", "Editoria", "Formato", "Canais"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: T.mutedFg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDITORIAL_CALENDAR.map((row, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: T.primary }}>{row.day}</td>
                  <td style={{ padding: "12px 16px" }}>{row.editoria}</td>
                  <td style={{ padding: "12px 16px", color: T.mutedFg }}>{row.format}</td>
                  <td style={{ padding: "12px 16px" }}>
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

      {/* Editorial mix */}
      <div>
        <SectionTitle subtitle="Distribuição real vs planejada por editoria">Mix de Editorias</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {editorialMix.map(e => (
              <div key={e.editoria} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, width: 200, flexShrink: 0, color: T.cardFg }}>{e.editoria}</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, background: T.cinza100, borderRadius: 10, height: 20, overflow: "hidden" }}>
                    <div style={{ width: `${(e.real / Math.max(e.real, e.planned)) * 100}%`, height: 20, background: T.primary, borderRadius: "10px 0 0 10px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 4 }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 500 }}>{e.real}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: T.cinza400, width: 60 }}>Meta: {e.planned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB: MÍDIA PAGA (dados reais do Nekt)
// ============================================================

function MidiaPaga({ adsData, loading }: { adsData: NektResult | null; loading: boolean }) {
  const summary = useMemo(() => {
    if (!adsData) return { spend: null, impressions: null, clicks: null, mql: null, won: null }
    const rows = adsData.rows
    return {
      spend: rows.reduce((s, r) => s + (Number(r.spend) || 0), 0),
      impressions: rows.reduce((s, r) => s + (Number(r.impressions) || 0), 0),
      clicks: rows.reduce((s, r) => s + (Number(r.clicks) || 0), 0),
      mql: rows.reduce((s, r) => s + (Number(r.mql) || 0), 0),
      won: rows.reduce((s, r) => s + (Number(r.won) || 0), 0),
    }
  }, [adsData])

  const ctr = summary.impressions ? ((summary.clicks! / summary.impressions) * 100) : null
  const cpc = summary.clicks ? (summary.spend! / summary.clicks) : null
  const cpl = summary.mql ? (summary.spend! / summary.mql) : null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {loading && (
        <div style={{ background: `${T.primary}10`, border: `1px solid ${T.primary}30`, borderRadius: 8, padding: 16, fontSize: 13, color: T.primary }}>
          Carregando dados do Nekt...
        </div>
      )}

      <div>
        <SectionTitle subtitle="Dados reais do Meta Ads via Nekt — mês corrente">Métricas Principais</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <KPICard label="Investimento Total" real={summary.spend} meta={null} unit="R$" fonte="Nekt (Meta)" />
          <KPICard label="Impressões" real={summary.impressions} meta={null} unit="" fonte="Nekt (Meta)" />
          <KPICard label="Cliques" real={summary.clicks} meta={null} unit="" fonte="Nekt (Meta)" />
          <KPICard label="MQLs" real={summary.mql} meta={null} unit="" fonte="Nekt (Meta)" />
          <KPICard label="WON (Vendas)" real={summary.won} meta={null} unit="" fonte="Nekt (Meta)" />
        </div>
      </div>

      <div>
        <SectionTitle>Métricas Calculadas</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {[
            { label: "CTR", value: ctr, suffix: "%" },
            { label: "CPC", value: cpc, prefix: "R$ " },
            { label: "CPL (custo por MQL)", value: cpl, prefix: "R$ " },
          ].map(m => (
            <div key={m.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, textAlign: "center", boxShadow: T.elevSm }}>
              <p style={{ fontSize: 12, color: T.mutedFg, textTransform: "uppercase", marginBottom: 8 }}>{m.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: m.value !== null ? T.fg : T.cinza200, margin: 0 }}>
                {m.value !== null ? `${m.prefix || ""}${m.value.toFixed(2)}${m.suffix || ""}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB: FUNIS (dados reais do Nekt)
// ============================================================

function Funis({ funnelData, loading }: { funnelData: Record<string, NektResult | null>; loading: boolean }) {
  const funnels = [
    { key: "szi", label: "SZI (Investimentos)", table: "nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable" },
    { key: "szs", label: "SZS (Serviços)", table: "nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable" },
    { key: "mktp", label: "Marketplace", table: "nekt_silver.funil_mktp_pago_mql_sql_opp_won_lovable" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {loading && (
        <div style={{ background: `${T.primary}10`, border: `1px solid ${T.primary}30`, borderRadius: 8, padding: 16, fontSize: 13, color: T.primary }}>
          Carregando dados dos funis...
        </div>
      )}

      {funnels.map(f => {
        const data = funnelData[f.key]
        if (!data || data.rows.length === 0) {
          return (
            <div key={f.key}>
              <SectionTitle>{f.label}</SectionTitle>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 32, textAlign: "center", boxShadow: T.elevSm }}>
                <p style={{ fontSize: 13, color: T.mutedFg }}>{loading ? "Carregando..." : "Sem dados disponíveis"}</p>
              </div>
            </div>
          )
        }

        return (
          <div key={f.key}>
            <SectionTitle subtitle="Dados agregados por dia — Nekt">{f.label}</SectionTitle>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "auto", boxShadow: T.elevSm }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.cinza50 }}>
                    {data.columns.map(col => (
                      <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: T.mutedFg, whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.slice(0, 30).map((row, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                      {data.columns.map(col => (
                        <td key={col} style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          {row[col] !== null ? String(row[col]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.rows.length > 30 && (
                <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: T.cinza400, borderTop: `1px solid ${T.border}` }}>
                  Mostrando 30 de {data.rows.length} linhas
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// TAB: ATIVAÇÃO
// ============================================================

function Ativacao() {
  const totalExecutado = ATIVACAO_ORCAMENTO.frentes.reduce((s, f) => s + f.executado, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ background: `${T.primary}10`, border: `1px solid ${T.primary}30`, borderRadius: 8, padding: 16, fontSize: 13, color: T.primary }}>
        <strong>Período:</strong> Abril a Setembro/2026 · <strong>Orçamento total:</strong> R$ {ATIVACAO_ORCAMENTO.total.toLocaleString("pt-BR")} → R$ {ATIVACAO_ORCAMENTO.mensal.toLocaleString("pt-BR")}/mês
      </div>

      <div>
        <SectionTitle>Métricas do Mês</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <KPICard label="Ações Realizadas" real={ATIVACAO_METRICAS.acoesRealizadas.real} meta={ATIVACAO_METRICAS.acoesRealizadas.meta} unit="ações" fonte="Manual" />
          <KPICard label="Orçamento Executado" real={ATIVACAO_METRICAS.orcamentoExecutado.real} meta={ATIVACAO_METRICAS.orcamentoExecutado.meta} unit="R$" fonte="Planilha" />
          <KPICard label="Leads BTL" real={ATIVACAO_METRICAS.leadsBTL.real} meta={ATIVACAO_METRICAS.leadsBTL.meta} unit="leads" fonte="Eventos" />
          <KPICard label="UGC Gerado (TTL)" real={ATIVACAO_METRICAS.ugcTTL.real} meta={ATIVACAO_METRICAS.ugcTTL.meta} unit="menções" fonte="Social" />
          <KPICard label="Alcance ATL" real={ATIVACAO_METRICAS.alcanceATL.real} meta={ATIVACAO_METRICAS.alcanceATL.meta} unit="pessoas" fonte="Estimativa" />
        </div>
      </div>

      <div>
        <SectionTitle subtitle="Orçamento mensal por frente vs executado">Orçamento por Frente</SectionTitle>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.elevSm }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.cinza50 }}>
                {["Frente", "Planejado/mês", "Executado", "%", "Progresso"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: h === "Frente" || h === "Progresso" ? "left" : "right", fontWeight: 500, color: T.mutedFg }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATIVACAO_ORCAMENTO.frentes.map(f => {
                const pct = calcPercent(f.executado, f.mensal)
                return (
                  <tr key={f.name} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{f.name}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: T.mutedFg }}>R$ {f.mensal.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>R$ {f.executado.toLocaleString("pt-BR")}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: progressTextColor(pct) }}>{pct}%</td>
                    <td style={{ padding: "12px 16px", width: 140 }}><ProgressBar real={f.executado} meta={f.mensal} /></td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: `2px solid ${T.cinza200}`, background: T.cinza50, fontWeight: 600 }}>
                <td style={{ padding: "12px 16px" }}>TOTAL</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>R$ {ATIVACAO_ORCAMENTO.mensal.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>R$ {totalExecutado.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", color: progressTextColor(calcPercent(totalExecutado, ATIVACAO_ORCAMENTO.mensal)) }}>
                  {calcPercent(totalExecutado, ATIVACAO_ORCAMENTO.mensal)}%
                </td>
                <td style={{ padding: "12px 16px", width: 140 }}><ProgressBar real={totalExecutado} meta={ATIVACAO_ORCAMENTO.mensal} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionTitle subtitle="Funil de ativação: marca → consideração → conversão">Níveis de Ativação</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {NIVEIS_ATIVACAO.map(n => {
            const colors: Record<string, { bg: string; border: string; badge: string; title: string }> = {
              ATL: { bg: "#eff6ff", border: "#bfdbfe", badge: "#dbeafe", title: "#1e40af" },
              TTL: { bg: "#faf5ff", border: "#e9d5ff", badge: "#f3e8ff", title: "#7e22ce" },
              BTL: { bg: "#fff7ed", border: "#fed7aa", badge: "#ffedd5", title: "#c2410c" },
            }
            const c = colors[n.sigla]
            return (
              <div key={n.sigla} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: c.badge, color: c.title, padding: "2px 8px", borderRadius: 4 }}>{n.sigla}</span>
                  <span style={{ fontWeight: 600, color: c.title }}>{n.nome}</span>
                </div>
                <p style={{ fontSize: 13, color: T.cinza600, marginBottom: 12 }}>{n.desc}</p>
                <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 12 }}>
                  <p style={{ fontSize: 11, color: T.cinza400, textTransform: "uppercase", marginBottom: 4 }}>Indicadores-chave</p>
                  <p style={{ fontSize: 13, color: T.cardFg, margin: 0 }}>{n.indicadores}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB: MÍDIA NÃO PAGA
// ============================================================

function MidiaNaoPaga() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: 16, fontSize: 13, color: "#92400e" }}>
        <strong>Canais:</strong> Email marketing + WhatsApp + Manychat · Todas as metas são "a definir" após 1º mês de operação.
      </div>

      <div>
        <SectionTitle subtitle="Métricas aguardando integração">Métricas Principais</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[
            "Vendas Orgânicas", "CAC Orgânico", "Taxa de Abertura", "CTR",
            "Taxa de Conversão", "Base Ativa Email", "Base Ativa WhatsApp",
            "Taxa de Opt-out", "Fluxos Ativos Manychat", "% Processos Documentados",
          ].map(label => (
            <KPICard key={label} label={label} real={null} meta={null} unit="" fonte="Pendente" />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle subtitle="Status de sistemas e integrações">Backoffice</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {BACKOFFICE_STATUS.map(b => (
            <div key={b.name} style={{
              background: T.card, border: `1px solid ${b.status === "falha" ? "#fecaca" : T.border}`,
              borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: T.elevSm,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: b.status === "ok" ? "#d1fae5" : "#fee2e2",
              }}>
                <span style={{ fontSize: 16 }}>{b.status === "ok" ? "✓" : "✕"}</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: T.cardFg, margin: 0 }}>{b.name}</p>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 10,
                  background: b.status === "ok" ? "#d1fae5" : "#fee2e2",
                  color: b.status === "ok" ? "#065f46" : "#991b1b",
                }}>
                  {b.status === "ok" ? "OK" : "Falha"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Estratégia por Canal</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[
            { name: "Email Marketing", icon: "✉️", desc: "Nutrição de leads, newsletters, campanhas", status: "Plataforma a confirmar" },
            { name: "WhatsApp", icon: "💬", desc: "Comunicação direta, automações, follow-up", status: "API em setup" },
            { name: "Manychat", icon: "🤖", desc: "Automações de DM, captação via stories/reels", status: "Configuração inicial" },
          ].map(ch => (
            <div key={ch.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{ch.icon}</span>
                <span style={{ fontWeight: 600, color: T.cardFg }}>{ch.name}</span>
              </div>
              <p style={{ fontSize: 13, color: T.mutedFg, marginBottom: 12 }}>{ch.desc}</p>
              <span style={{ fontSize: 11, background: T.cinza50, color: T.cinza400, padding: "2px 8px", borderRadius: 10 }}>{ch.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function MarketingGeral() {
  const [activeTab, setActiveTab] = useState("visao-geral")
  const [adsData, setAdsData] = useState<NektResult | null>(null)
  const [funnelData, setFunnelData] = useState<Record<string, NektResult | null>>({ szi: null, szs: null, mktp: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [ads, szi, szs, mktp] = await Promise.all([
          queryNekt(`SELECT date, campaign_name, SUM(spend) AS spend, SUM(impressions) AS impressions, SUM(clicks) AS clicks, SUM(mql) AS mql, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE date >= date_trunc('month', CURRENT_DATE) GROUP BY 1, 2 ORDER BY date DESC`),
          queryNekt(`SELECT * FROM nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable WHERE date >= date_trunc('month', CURRENT_DATE) ORDER BY date DESC`),
          queryNekt(`SELECT * FROM nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable WHERE date >= date_trunc('month', CURRENT_DATE) ORDER BY date DESC`),
          queryNekt(`SELECT * FROM nekt_silver.funil_mktp_pago_mql_sql_opp_won_lovable WHERE date >= date_trunc('month', CURRENT_DATE) ORDER BY date DESC`),
        ])
        setAdsData(ads)
        setFunnelData({ szi, szs, mktp })
      } catch (err) {
        console.error("Erro ao carregar dados do Nekt:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const tabs = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "midias-sociais", label: "Mídias Sociais" },
    { id: "midia-paga", label: "Mídia Paga" },
    { id: "funis", label: "Funis" },
    { id: "ativacao", label: "Ativação" },
    { id: "midia-nao-paga", label: "Mídia Não Paga" },
  ]

  const renderTab = () => {
    switch (activeTab) {
      case "visao-geral": return <VisaoGeral setTab={setActiveTab} adsData={adsData} />
      case "midias-sociais": return <MidiasSociais />
      case "midia-paga": return <MidiaPaga adsData={adsData} loading={loading} />
      case "funis": return <Funis funnelData={funnelData} loading={loading} />
      case "ativacao": return <Ativacao />
      case "midia-nao-paga": return <MidiaNaoPaga />
      default: return <VisaoGeral setTab={setActiveTab} adsData={adsData} />
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>
      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
              <ChevronLeft size={14} /> Menu
            </Link>
            <span style={{ color: T.border }}>|</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Marketing Geral</span>
            {loading && <span style={{ fontSize: 11, color: T.cinza400, marginLeft: "auto" }}>Sincronizando dados...</span>}
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", overflowX: "auto", marginBottom: -1 }}>
            {tabs.map(t => (
              <TabButton key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {renderTab()}
      </main>
    </div>
  )
}
