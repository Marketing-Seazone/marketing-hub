"use client"

import { useState, useEffect, type CSSProperties } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Pencil, Trash2, Plus, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { T } from "@/lib/constants"
import { FOLLOWERS_DATA, MONTH_KEYS } from '@/lib/followers-config'

const CALENDAR_START = "2026-04-07"


function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

function MetasAbril({ only }: { only?: number } = {}) {
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
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id IN (7, 28) AND rd_campanha ILIKE '%paga%' AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 14 AND rd_campanha ILIKE '%paga%' AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 37 AND rd_campanha ILIKE '%paga%' AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id IN (7, 28) AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 14 AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
        queryNektNum(`SELECT COUNT(DISTINCT id) AS valor FROM nekt_silver.deals_pipedrive_join_marketing WHERE status = 'won' AND pipeline_id = 37 AND (rd_campanha NOT ILIKE '%paga%' OR rd_campanha IS NULL) AND DATE(ganho_em) >= DATE_TRUNC('month', CURRENT_DATE) AND DATE(ganho_em) < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`),
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
      {METAS_ABRIL.map((meta, i) => {
        if (only !== undefined && only !== i) return null
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
                { rotulo: "Mídia Paga",    real: pago,    metaV: meta.metaPago,    pct: pctPago },
                { rotulo: "Mídia Não Paga", real: naoPago, metaV: meta.metaNaoPago, pct: pctNP   },
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
  )
}

// ── Squads ────────────────────────────────────────────────

const SQUADS = [
  {
    id: "szi", label: "Squad SZI", vertical: 0, color: T.laranja500,
    membros: [
      { nome: "Jaque",   papel: "Design" },
      { nome: "Jean",    papel: "PMM"    },
      { nome: "Gabriel", papel: "Copy"   },
    ],
  },
  {
    id: "szs", label: "Squad SZS", vertical: 1, color: T.roxo600,
    membros: [
      { nome: "Laura",   papel: "PMM"    },
      { nome: "Henrique",papel: "Design" },
      { nome: "Gabriel", papel: "Copy"   },
    ],
  },
  {
    id: "mktplace", label: "Squad Mkt Place", vertical: 2, color: T.teal600,
    membros: [
      { nome: "Johny",   papel: "Design" },
      { nome: "Rodrigo", papel: "PMM"    },
      { nome: "Gabriel", papel: "Copy"   },
    ],
  },
] as const

function SquadSection({ squad }: { squad: typeof SQUADS[number] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <MetasAbril only={squad.vertical} />
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", boxShadow: T.elevSm }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Time</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {squad.membros.map(m => (
            <div key={m.nome + m.papel} style={{ display: "flex", alignItems: "center", gap: 10, background: T.cinza50, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: squad.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: T.cinza400, margin: "0 0 2px" }}>{m.papel}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.fg, margin: 0 }}>{m.nome}</p>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.cinza50, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, color: T.cinza400, margin: "0 0 2px" }}>Coordenadora</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.fg, margin: 0 }}>Anna</p>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: T.cinza400, margin: "12px 0 0" }}>
          Meta compartilhada — Design, PMM e Copy são responsáveis juntos pelo resultado de vendas da vertical.
        </p>
      </div>
    </div>
  )
}

// ── Metas fixas ──────────────────────────────────────────

const METAS_CAC = {
  cacSzi: { label: "CAC Tráfego Pago SZI", meta: 5000, unit: "R$", tipo: "menor" as const },
  cacSzs: { label: "CAC Tráfego Pago SZS", meta: 1290, unit: "R$", tipo: "menor" as const },
}

function fmt(n: number | null, unit: string) {
  if (n === null) return "—"
  if (unit === "R$") return `R$ ${Math.round(n).toLocaleString("pt-BR")}`
  return n.toLocaleString("pt-BR")
}

function calcAting(real: number | null, meta: number, tipo: "menor" | "maior") {
  if (real === null) return null
  if (tipo === "menor") return Math.round((meta / real) * 100)
  return Math.round((real / meta) * 100)
}

function statusColor(pct: number | null) {
  if (pct === null) return T.cinza200
  if (pct >= 100) return "#10b981"
  if (pct >= 75)  return "#f59e0b"
  return "#ef4444"
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

function MetaCard({ label, meta, real, unit, tipo, loading }: {
  label: string; meta: number; real: number | null; unit: string
  tipo: "menor" | "maior"; loading: boolean
}) {
  const pct = calcAting(real, meta, tipo)
  const atingido = pct !== null && pct >= 100

  return (
    <div style={{
      background: T.card, border: `1px solid ${statusBorder(pct)}`,
      borderRadius: 16, padding: "28px 28px 24px",
      boxShadow: T.elevSm, display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.mutedFg, lineHeight: 1.4 }}>{label}</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: statusBg(pct), border: `1px solid ${statusBorder(pct)}`,
          borderRadius: 8, padding: "4px 10px", flexShrink: 0,
        }}>
          {tipo === "menor" ? <TrendingDown size={12} color={statusColor(pct)} /> : <TrendingUp size={12} color={statusColor(pct)} />}
          <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(pct) }}>
            {tipo === "menor" ? "< " : "> "}{fmt(meta, unit)}
          </span>
        </div>
      </div>
      <div>
        {loading
          ? <div style={{ height: 40, background: T.cinza100, borderRadius: 8, width: "60%" }} />
          : <span style={{ fontSize: 36, fontWeight: 800, color: T.fg, letterSpacing: "-1px" }}>{fmt(real, unit)}</span>
        }
        <p style={{ fontSize: 12, color: T.cinza400, margin: "4px 0 0" }}>
          {tipo === "menor" ? "atual (meta: abaixo de " : "atual (meta: acima de "}{fmt(meta, unit)})
        </p>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.mutedFg }}>Atingimento</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusColor(pct) }}>
            {pct !== null ? `${Math.min(pct, 999)}%` : "—"}
          </span>
        </div>
        <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 8, overflow: "hidden" }}>
          <div style={{ width: `${pct !== null ? Math.min(pct, 100) : 0}%`, height: 8, borderRadius: 6, background: statusColor(pct), transition: "width 0.6s ease" }} />
        </div>
        {atingido && <p style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 6 }}>✓ Meta atingida</p>}
      </div>
    </div>
  )
}

// ── Mídias Sociais ───────────────────────────────────────

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

// removido — dados agora vêm do Supabase em tempo real

function fmtN(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000)    return `${(n/1000).toFixed(1)}k`
  return n.toLocaleString("pt-BR")
}

interface AdherenceData {
  total: { published: number; planned: number }
  byDay: { day: string; count: number; planned: number }[]
}

interface WeekPost {
  title: string
  status: string
  scheduled_at: string
  editoria: string
}

function getWeekBounds(offset: number) {
  const now = new Date()
  const dow = now.getDay() // 0=Sun
  const mondayDelta = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayDelta + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}


function MidiasSociais() {
  const [mes, setMes] = useState<Month>("abr")
  const [adherence, setAdherence] = useState<AdherenceData | null>(null)
  const [loadingAdherence, setLoadingAdherence] = useState(true)

  useEffect(() => {
    async function load() {
      setLoadingAdherence(true)
      const today = new Date().toISOString().split("T")[0]
      const { data, error } = await getSupabase()
        .from("posts")
        .select("status, scheduled_at, editoria")
        .gte("scheduled_at", CALENDAR_START)
        .lte("scheduled_at", today + "T23:59:59")

      if (error || !data) { setLoadingAdherence(false); return }

      // Aderência por dia da semana (ordem: Seg=1 … Dom=0)
      const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      const planned = [0,0,0,0,0,0,0]
      const published = [0,0,0,0,0,0,0]
      for (const post of data) {
        if (!post.scheduled_at) continue
        const dow = new Date(post.scheduled_at).getDay()
        planned[dow]++
        if (post.status === "publicado") published[dow]++
      }
      const ORDER = [1,2,3,4,5,6,0]
      setAdherence({
        total: {
          planned: data.length,
          published: data.filter(p => p.status === "publicado").length,
        },
        byDay: ORDER.map(i => ({ day: DAY_LABELS[i], count: published[i], planned: planned[i] })),
      })

      setLoadingAdherence(false)
    }
    load()
  }, [mes])

  const [weekOffset, setWeekOffset] = useState(0)
  const [weekPosts, setWeekPosts] = useState<Record<string, WeekPost[]>>({})
  const [loadingWeek, setLoadingWeek] = useState(true)

  useEffect(() => {
    async function loadWeek() {
      setLoadingWeek(true)
      const { monday, sunday } = getWeekBounds(weekOffset)
      const { data } = await getSupabase()
        .from("posts")
        .select("title, status, scheduled_at, editoria")
        .gte("scheduled_at", monday.toISOString().split("T")[0])
        .lte("scheduled_at", sunday.toISOString().split("T")[0] + "T23:59:59")
      const byDay: Record<string, WeekPost[]> = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        byDay[d.toISOString().split("T")[0]] = []
      }
      for (const post of data || []) {
        const k = (post.scheduled_at || "").split("T")[0]
        if (k && byDay[k]) byDay[k].push(post as WeekPost)
      }
      setWeekPosts(byDay)
      setLoadingWeek(false)
    }
    loadWeek()
  }, [weekOffset])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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

      <div>
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 4px" }}>Calendário Editorial — Aderência</h3>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            Posts publicados ÷ planejados — a partir de {new Date(CALENDAR_START + "T12:00:00").toLocaleDateString("pt-BR")}
          </p>
        </div>
        {loadingAdherence ? (
          <div style={{ height: 120, background: T.cinza50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, color: T.cinza400 }}>Carregando dados do calendário...</span>
          </div>
        ) : !adherence || adherence.total.planned === 0 ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 20px", textAlign: "center", boxShadow: T.elevSm }}>
            <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Nenhum post planejado encontrado a partir de {new Date(CALENDAR_START + "T12:00:00").toLocaleDateString("pt-BR")}.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
              <p style={{ fontSize: 13, color: T.mutedFg, margin: "0 0 8px" }}>Aderência geral</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: T.fg, margin: "0 0 4px" }}>
                {Math.round((adherence.total.published / adherence.total.planned) * 100)}%
              </p>
              <p style={{ fontSize: 12, color: T.cinza400, margin: "0 0 12px" }}>{adherence.total.published} de {adherence.total.planned} posts</p>
              <div style={{ width: "100%", background: T.cinza100, borderRadius: 6, height: 8 }}>
                <div style={{ width: `${Math.round((adherence.total.published / adherence.total.planned) * 100)}%`, height: 8, borderRadius: 6, background: T.primary }} />
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, boxShadow: T.elevSm }}>
              <p style={{ fontSize: 13, color: T.mutedFg, margin: "0 0 12px" }}>Status por dia da semana</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {adherence.byDay.map(d => {
                  const ok = d.planned === 0 || d.count >= d.planned
                  const future = d.planned === 0
                  return (
                    <div key={d.day} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 11, fontWeight: 500, color: T.cinza600, margin: "0 0 6px" }}>{d.day}</p>
                      <div style={{ background: T.cinza50, borderRadius: 8, padding: "8px 4px" }}>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
                          {future ? "—" : `${d.count}/${d.planned}`}
                        </p>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 4px", borderRadius: 6,
                          background: future ? T.cinza100 : ok ? "#d1fae5" : "#fef3c7",
                          color:      future ? T.cinza400 : ok ? "#065f46" : "#92400e",
                        }}>
                          {future ? "—" : ok ? "OK" : "Parcial"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        {(() => {
          const { monday } = getWeekBounds(weekOffset)
          const todayStr = new Date().toISOString().split("T")[0]
          const DAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday)
            d.setDate(monday.getDate() + i)
            return { label: DAY_SHORT[i], dateKey: d.toISOString().split("T")[0], date: d }
          })
          const weekLabel = weekOffset === 0 ? "Esta semana"
            : weekOffset === -1 ? "Semana passada"
            : weekOffset === 1 ? "Próxima semana"
            : weekOffset > 0 ? `+${weekOffset} semanas` : `${weekOffset} semanas`
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.fg, margin: "0 0 2px" }}>Posts da Semana</h3>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
                    {days[0].date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {days[6].date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => setWeekOffset(o => o - 1)} style={{ background: T.cinza50, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center" }}>
                    <ChevronLeft size={14} color={T.cinza600} />
                  </button>
                  <span style={{ fontSize: 12, color: T.mutedFg, minWidth: 110, textAlign: "center" }}>{weekLabel}</span>
                  <button onClick={() => setWeekOffset(o => o + 1)} style={{ background: T.cinza50, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center" }}>
                    <ChevronRight size={14} color={T.cinza600} />
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {days.map(({ label, dateKey, date }) => {
                  const posts = weekPosts[dateKey] || []
                  const isToday = dateKey === todayStr
                  return (
                    <div key={dateKey} style={{
                      background: isToday ? `${T.primary}0d` : T.card,
                      border: `1px solid ${isToday ? T.primary : T.border}`,
                      borderRadius: 10, padding: "10px 6px", minHeight: 80,
                      boxShadow: T.elevSm,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: isToday ? T.primary : T.cinza400, margin: "0 0 1px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isToday ? T.primary : T.fg, margin: "0 0 8px", textAlign: "center" }}>{date.getDate()}</p>
                      {loadingWeek ? (
                        <div style={{ height: 16, background: T.cinza100, borderRadius: 4 }} />
                      ) : posts.length === 0 ? (
                        <p style={{ fontSize: 10, color: T.cinza200, textAlign: "center", margin: 0 }}>—</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {posts.map((p, i) => {
                            const bg = p.status === "publicado" ? "#d1fae5" : p.status === "agendado" ? "#dbeafe" : "#fef9c3"
                            const fg = p.status === "publicado" ? "#065f46" : p.status === "agendado" ? "#1e40af" : "#92400e"
                            const badgeLabel = p.status === "publicado" ? "✓ Publicado" : p.status === "agendado" ? "⏰ Agendado" : p.status
                            return (
                              <div key={i} style={{ background: bg, borderRadius: 5, padding: "3px 5px" }}>
                                <p style={{ fontSize: 9, fontWeight: 700, color: fg, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{badgeLabel}</p>
                                <p style={{ fontSize: 10, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }} title={p.title || p.editoria}>
                                  {p.title || p.editoria}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

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

    </div>
  )
}

// ── Marketing de Ativação ────────────────────────────────

interface EntregavelItem {
  item: string
  status: "pendente" | "entregue" | "parcial"
}

interface AtivacaoEvento {
  id: string
  nome: string
  data_evento: string | null
  entregaveis: EntregavelItem[]
  resultado_esperado: string
  resultado_entregue: string
  custo_previsto: number
  custo_realizado: number
}

const ENTREGAVEL_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pendente: { bg: "#fef9c3", fg: "#92400e", label: "Pendente" },
  entregue: { bg: "#d1fae5", fg: "#065f46", label: "Entregue" },
  parcial:  { bg: "#dbeafe", fg: "#1e40af", label: "Parcial"  },
}

const EMPTY_EVENTO: Omit<AtivacaoEvento, "id"> = {
  nome: "", data_evento: null, entregaveis: [],
  resultado_esperado: "", resultado_entregue: "",
  custo_previsto: 0, custo_realizado: 0,
}

function AtivacaoSection() {
  const [eventos, setEventos] = useState<AtivacaoEvento[]>([])
  const [loading, setLoading]   = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]         = useState<Omit<AtivacaoEvento, "id">>(EMPTY_EVENTO)
  const [saving, setSaving]     = useState(false)

  async function load() {
    const { data } = await getSupabase()
      .from("ativacao_eventos").select("*").order("created_at", { ascending: true })
    setEventos((data as AtivacaoEvento[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function startNew()                  { setEditingId("new"); setForm({ ...EMPTY_EVENTO }) }
  function startEdit(e: AtivacaoEvento){ const { id, ...rest } = e; setEditingId(id); setForm(rest) }
  function cancel()                    { setEditingId(null) }

  async function save() {
    if (!form.nome.trim()) return
    setSaving(true)
    if (editingId === "new") {
      await getSupabase().from("ativacao_eventos").insert(form)
    } else {
      await getSupabase().from("ativacao_eventos").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editingId)
    }
    await load()
    setEditingId(null)
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm("Remover este evento?")) return
    await getSupabase().from("ativacao_eventos").delete().eq("id", id)
    setEventos(ev => ev.filter(e => e.id !== id))
  }

  const inp: CSSProperties = {
    width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.muted, color: T.fg, fontFamily: T.font,
  }
  const lbl: CSSProperties = {
    fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block",
    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px",
  }

  function renderForm() {
    return (
      <div style={{ background: T.card, border: `2px solid ${T.primary}`, borderRadius: 14, padding: 24, boxShadow: T.elevSm, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "start" }}>
          <div>
            <label style={lbl}>Nome do Evento</label>
            <input style={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Anitápolis" />
          </div>
          <div>
            <label style={lbl}>Data</label>
            <input type="date" style={{ ...inp, width: "auto" }} value={form.data_evento || ""} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value || null }))} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={lbl}>Entregáveis</span>
            <button onClick={() => setForm(f => ({ ...f, entregaveis: [...f.entregaveis, { item: "", status: "pendente" }] }))}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.primary, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, fontWeight: 600 }}>
              <Plus size={13} /> Adicionar
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {form.entregaveis.length === 0 && <p style={{ fontSize: 12, color: T.cinza400, margin: 0 }}>Nenhum entregável ainda.</p>}
            {form.entregaveis.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={{ ...inp, flex: 1 }} value={e.item}
                  onChange={ev => setForm(f => ({ ...f, entregaveis: f.entregaveis.map((x, j) => j === i ? { ...x, item: ev.target.value } : x) }))}
                  placeholder="Descreva o entregável" />
                <select value={e.status}
                  onChange={ev => setForm(f => ({ ...f, entregaveis: f.entregaveis.map((x, j) => j === i ? { ...x, status: ev.target.value as EntregavelItem["status"] } : x) }))}
                  style={{ ...inp, width: 120 }}>
                  <option value="pendente">Pendente</option>
                  <option value="entregue">Entregue</option>
                  <option value="parcial">Parcial</option>
                </select>
                <button onClick={() => setForm(f => ({ ...f, entregaveis: f.entregaveis.filter((_, j) => j !== i) }))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0 4px", display: "flex" }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={lbl}>Resultado Esperado</label>
            <input style={inp} value={form.resultado_esperado} onChange={e => setForm(f => ({ ...f, resultado_esperado: e.target.value }))} placeholder="Ex: 50 leads" />
          </div>
          <div>
            <label style={lbl}>Resultado Entregue</label>
            <input style={inp} value={form.resultado_entregue} onChange={e => setForm(f => ({ ...f, resultado_entregue: e.target.value }))} placeholder="Ex: 38 leads" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={lbl}>Custo Previsto (R$)</label>
            <input type="number" style={inp} value={form.custo_previsto || ""} onChange={e => setForm(f => ({ ...f, custo_previsto: Number(e.target.value) || 0 }))} placeholder="0" />
          </div>
          <div>
            <label style={lbl}>Custo Realizado (R$)</label>
            <input type="number" style={inp} value={form.custo_realizado || ""} onChange={e => setForm(f => ({ ...f, custo_realizado: Number(e.target.value) || 0 }))} placeholder="0" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={cancel} style={{ padding: "8px 20px", fontSize: 13, borderRadius: 8, border: `1px solid ${T.border}`, background: T.cinza50, color: T.cinza600, cursor: "pointer", fontFamily: T.font }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving} style={{ padding: "8px 20px", fontSize: 13, borderRadius: 8, border: "none", background: T.primary, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: T.font, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando..." : editingId === "new" ? "Criar Evento" : "Salvar"}
          </button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ height: 120, background: T.cinza50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 13, color: T.cinza400 }}>Carregando eventos...</span>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {editingId === null && (
          <button onClick={startNew} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 13, borderRadius: 10, border: "none", background: T.primary, color: "#fff", cursor: "pointer", fontFamily: T.font, fontWeight: 600 }}>
            <Plus size={14} /> Novo Evento
          </button>
        )}
      </div>

      {editingId === "new" && renderForm()}

      {eventos.length === 0 && editingId !== "new" && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px 24px", textAlign: "center", boxShadow: T.elevSm }}>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Nenhum evento cadastrado ainda. Clique em "Novo Evento" para começar.</p>
        </div>
      )}

      {eventos.map(evento => (
        <div key={evento.id}>
          {editingId === evento.id ? renderForm() : (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, boxShadow: T.elevSm }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: T.fg, margin: "0 0 2px" }}>{evento.nome}</h3>
                  {evento.data_evento && (
                    <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
                      {new Date(evento.data_evento + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(evento)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: T.cinza50, color: T.cinza600, cursor: "pointer", fontFamily: T.font }}>
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={() => del(evento.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Entregáveis</p>
                  {evento.entregaveis.length === 0 ? <p style={{ fontSize: 13, color: T.cinza400, margin: 0 }}>—</p> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {evento.entregaveis.map((e, i) => {
                        const s = ENTREGAVEL_STYLE[e.status] || ENTREGAVEL_STYLE.pendente
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ fontSize: 13, color: T.fg }}>{e.item || "—"}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.fg, flexShrink: 0 }}>{s.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Resultados</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[["Esperado", evento.resultado_esperado], ["Entregue", evento.resultado_entregue]].map(([rotulo, val]) => (
                        <div key={rotulo} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: T.mutedFg }}>{rotulo}</span>
                          <span style={{ fontWeight: 600, color: T.fg }}>{val || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Custos</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: T.mutedFg }}>Previsto</span>
                        <span style={{ fontWeight: 600 }}>{fmt(evento.custo_previsto, "R$")}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: T.mutedFg }}>Realizado</span>
                        <span style={{ fontWeight: 600, color: evento.custo_previsto > 0 && evento.custo_realizado > evento.custo_previsto ? "#ef4444" : "#10b981" }}>
                          {fmt(evento.custo_realizado, "R$")}
                        </span>
                      </div>
                      {evento.custo_previsto > 0 && (
                        <div style={{ width: "100%", background: T.cinza100, borderRadius: 4, height: 5, marginTop: 4 }}>
                          <div style={{ width: `${Math.min((evento.custo_realizado / evento.custo_previsto) * 100, 100)}%`, height: 5, borderRadius: 4, background: evento.custo_realizado > evento.custo_previsto ? "#ef4444" : "#10b981" }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Helpers visuais ──────────────────────────────────────

function SectionHeader({ title, desc, color = T.primary }: { title: string; desc?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 4, height: 32, background: color, borderRadius: 2, flexShrink: 0 }} />
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.fg, margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {desc && <p style={{ fontSize: 13, color: T.mutedFg, margin: "4px 0 0" }}>{desc}</p>}
      </div>
    </div>
  )
}

function EmConstrucao({ label }: { label: string }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "36px 32px",
      textAlign: "center", boxShadow: T.elevSm,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>Em construção</p>
      <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Os artefatos de {label} aparecerão aqui.</p>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────

export default function MarketingGeral() {
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reais, setReais] = useState<Record<string, number | null>>({
    cacSzi: null, cacSzs: null,
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

      const [cacSzi, cacSzs] = await Promise.all([
        safe("cacSzi", `
          SELECT
            (SELECT SUM(spend) FROM nekt_silver.ads_unificado
             WHERE vertical = 'Investimentos'
               AND date >= CURRENT_DATE - INTERVAL '30' DAY)
            /
            NULLIF(
              (SELECT COUNT(DISTINCT id) FROM nekt_silver.deals_pipedrive_join_marketing
               WHERE status = 'won'
                 AND rd_campanha LIKE '%[SI]%'
                 AND ganho_em >= CURRENT_DATE - INTERVAL '30' DAY),
            0) AS valor
        `),
        safe("cacSzs", `
          SELECT
            (SELECT SUM(spend) FROM nekt_silver.ads_unificado
             WHERE vertical ILIKE '%serv%'
               AND date >= CURRENT_DATE - INTERVAL '30' DAY)
            /
            NULLIF(
              (SELECT COUNT(DISTINCT id) FROM nekt_silver.deals_pipedrive_join_marketing
               WHERE status = 'won'
                 AND rd_campanha LIKE '%[SS]%'
                 AND ganho_em >= CURRENT_DATE - INTERVAL '30' DAY),
            0) AS valor
        `),
      ])

      setReais({ cacSzi, cacSzs })
      setLoading(false)
    }
    load()
  }, [])

  const PENDING_SECTIONS = [
    { id: "growth-paga",     label: "Growth Mídia Paga",     color: T.laranja500 },
    { id: "growth-nao-paga", label: "Growth Mídia Não Paga", color: T.laranja500 },
  ]

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}>
            <ChevronLeft size={14} /> Menu
          </Link>
          <span style={{ color: T.border }}>|</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Visão Geral</span>
          {loading && (
            <span style={{ fontSize: 11, color: T.cinza400, marginLeft: "auto" }}>Carregando dados...</span>
          )}
        </div>
      </header>

      {/* Conteúdo em seções */}
      <main style={{ padding: "40px 24px 64px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 56 }}>

        <section>
          <SectionHeader title="Metas do Mês" desc="WON por vertical — mês corrente" color={T.primary} />
          <MetasAbril />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
            {Object.entries(METAS_CAC).map(([key, m]) => (
              <MetaCard key={key} label={m.label} meta={m.meta} real={reais[key] ?? null}
                unit={m.unit} tipo={m.tipo} loading={loading} />
            ))}
          </div>
          {Object.keys(errors).length > 0 && (
            <p style={{ fontSize: 12, color: T.mutedFg, marginTop: 8 }}>Alguns dados não puderam ser carregados.</p>
          )}
        </section>

        <section>
          <SectionHeader title="Mídias Sociais" desc="Calendário editorial e seguidores" color={T.teal600} />
          <MidiasSociais />
        </section>

        {SQUADS.map(squad => (
          <section key={squad.id}>
            <SectionHeader title={squad.label} desc="Design · PMM · Copy — meta de vendas compartilhada" color={squad.color} />
            <SquadSection squad={squad} />
          </section>
        ))}

        <section>
          <SectionHeader title="Marketing de Ativação" desc="Eventos, entregáveis e resultados" color={T.verde600} />
          <AtivacaoSection />
        </section>

        {PENDING_SECTIONS.map(s => (
          <section key={s.id}>
            <SectionHeader title={s.label} color={s.color} />
            <EmConstrucao label={s.label} />
          </section>
        ))}

      </main>
    </div>
  )
}
