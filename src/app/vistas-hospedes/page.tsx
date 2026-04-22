"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Plus, Trash2, Check, Calendar, Link2, AlertTriangle, Pencil, TrendingUp, TrendingDown, RefreshCw, Sparkles } from "lucide-react"
import { T } from "@/lib/constants"
import type { DayData } from "@/app/api/vistas-reservas/route"
import type { Task } from "@/app/api/vistas-checklist/route"

const META_DIA = 7
const COR = "#7C3AED"

const fmt2 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
function fmtDate(iso: string | null) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}
function statusColor(v: number, meta: number) {
  if (v >= meta) return "#10b981"
  if (v >= meta * 0.7) return T.statusWarn ?? "#f59e0b"
  return T.destructive ?? "#ef4444"
}

function TextWithLinks({ text, style }: { text: string; style?: React.CSSProperties }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <span style={style}>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: COR, textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>🔗</a>
          : part
      )}
    </span>
  )
}

function ReservasChart({ days }: { days: DayData[] }) {
  const W = 680, H = 130, PL = 28, PB = 22, PT = 8, PR = 8
  const cW = W - PL - PR, cH = H - PT - PB
  const maxV = Math.max(...days.map(d => d.count), META_DIA) + 2
  const xs = (i: number) => PL + (i / (days.length - 1)) * cW
  const ys = (v: number) => PT + cH - (v / maxV) * cH
  const metaY = ys(META_DIA)
  const barW = Math.max(2, (cW / days.length) - 2)
  const avgPath = days.map((d, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(d.movingAvg)}`).join(" ")
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {[0, META_DIA / 2, META_DIA, META_DIA * 1.5].map(v => (
        <line key={v} x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke={T.border} strokeWidth={0.5} />
      ))}
      {days.map((d, i) => {
        const bh = Math.max(2, (d.count / maxV) * cH)
        const fill = d.count >= META_DIA ? "#10b98133" : `${T.destructive}22`
        const stroke = d.count >= META_DIA ? "#10b981" : T.destructive
        return (
          <rect key={i} x={xs(i) - barW / 2} y={ys(d.count)} width={barW} height={bh} fill={fill} stroke={stroke} strokeWidth={0.5} rx={1}>
            <title>{fmtDate(d.date)}: {d.count} reserva{d.count !== 1 ? "s" : ""}</title>
          </rect>
        )
      })}
      <line x1={PL} x2={W - PR} y1={metaY} y2={metaY} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={W - PR + 3} y={metaY + 4} fontSize={9} fill="#10b981" fontWeight={700}>7</text>
      <path d={avgPath} fill="none" stroke={COR} strokeWidth={2} strokeLinejoin="round" />
      {[0, 7, 14, 21, 29].map(i => (
        <text key={i} x={xs(i)} y={H - 4} fontSize={8} fill={T.mutedFg ?? "#888"} textAnchor="middle">{fmtDate(days[i]?.date ?? "")}</text>
      ))}
    </svg>
  )
}

const SECTION_META: Record<string, { label: string; live: string | null }> = {
  "midia-paga": { label: "Mídia Paga — Retargeting", live: "25 abr" },
  "website": { label: "Website — Melhorias de Conversão", live: "30 abr" },
  "geral": { label: "Geral", live: null },
}
const SECTION_ORDER = ["midia-paga", "website", "geral"]

const SEED: Omit<Task, "id" | "done" | "createdAt">[] = [
  { title: "Finalizar os 4 briefings de criativo", notes: "Urgência e Emocional", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Enviar briefings para a head aprovar", notes: "Sinalizar urgência de prazo", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Head aprova e abre chamado para criação", notes: "Sinalizar urgência de prazo", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Time de criação produz os 4 criativos", notes: "4 dias úteis — entrega prevista: 16/04", deadline: "2026-04-16", link: null, section: "midia-paga", isWarning: false },
  { title: "Aprovação dos criativos — responsável + head", notes: "Se houver ajustes, retorno em 22/04", deadline: "2026-04-17", link: null, section: "midia-paga", isWarning: false },
  { title: "FERIADO — Tiradentes", notes: "Próximo dia útil: 22/04", deadline: "2026-04-21", link: null, section: "midia-paga", isWarning: true },
  { title: "Enviar criativos aprovados para o growth publicar", notes: "Growth configura campanhas no Meta Ads com segmentações", deadline: "2026-04-22", link: null, section: "midia-paga", isWarning: false },
  { title: "Campanhas de retargeting no ar", notes: "Monitorar CTR e custo por clique nas primeiras 48h", deadline: "2026-04-25", link: null, section: "midia-paga", isWarning: false },
  { title: "Montar briefing das melhorias para o time de tech", notes: "4 itens: pop-up exit intent, filtro por ocasião, contador de disponibilidade, galeria de hóspedes", deadline: "2026-04-13", link: null, section: "website", isWarning: false },
  { title: "Reunião com time de tech — escopo e prazos", notes: "Definir o que entra até 30/04, responsável e data de entrega por item", deadline: "2026-04-14", link: null, section: "website", isWarning: false },
  { title: "Tech implementa pop-up exit intent", notes: "Quick win — menor esforço, maior impacto imediato", deadline: "2026-04-17", link: null, section: "website", isWarning: false },
  { title: "Testar e validar pop-up — aprovação para ir ao ar", notes: "Checar disparo, cupom ativo e link de reserva funcionando", deadline: "2026-04-17", link: null, section: "website", isWarning: false },
  { title: "FERIADO — Tiradentes", notes: "Próximo dia útil: 22/04", deadline: "2026-04-21", link: null, section: "website", isWarning: true },
  { title: "Tech implementa filtro por ocasião + contador de disponibilidade", notes: "4 botões de filtro (Romance / Família / Pet / Workcation) + contador dinâmico nas páginas de cabana", deadline: "2026-04-25", link: null, section: "website", isWarning: false },
  { title: "Review e testes de todas as implementações", notes: "Filtros, contador, responsividade mobile e links de reserva", deadline: "2026-04-29", link: null, section: "website", isWarning: false },
  { title: "Todas as melhorias do site no ar — DEADLINE", notes: "Pop-up, filtro por ocasião e contador funcionando", deadline: "2026-04-30", link: null, section: "website", isWarning: false },
]

interface AddForm { title: string; notes: string; deadline: string; link: string }
const EMPTY_ADD: AddForm = { title: "", notes: "", deadline: "", link: "" }
interface EditForm { title: string; notes: string; deadline: string; link: string }

function ChecklistSection() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingSection, setAddingSection] = useState<string | null>(null)
  const [form, setForm] = useState<AddForm>(EMPTY_ADD)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: "", notes: "", deadline: "", link: "" })

  useEffect(() => {
    fetch("/api/vistas-checklist").then(r => r.json()).then(async (data: Task[]) => {
      const list = Array.isArray(data) ? data : []
      if (list.length === 0) {
        const seeded: Task[] = []
        for (const t of SEED) {
          const res = await fetch("/api/vistas-checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) })
          if (res.ok) seeded.push(await res.json())
        }
        setTasks(seeded)
      } else { setTasks(list) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function sortAll(list: Task[]) {
    return [...list].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return (a.deadline || "9999").localeCompare(b.deadline || "9999")
    })
  }

  const grouped: Record<string, Task[]> = {}
  for (const s of SECTION_ORDER) {
    grouped[s] = sortAll(tasks.filter(t => s === "geral" ? (!t.section || t.section === "geral") : t.section === s))
  }

  async function addTask() {
    if (!form.title.trim() || !addingSection) return
    setSaving(true)
    const res = await fetch("/api/vistas-checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, section: addingSection }) })
    const task = await res.json()
    setTasks(prev => [...prev, task])
    setForm(EMPTY_ADD); setAddingSection(null); setSaving(false)
  }

  async function toggle(id: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    await fetch("/api/vistas-checklist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch("/api/vistas-checklist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editForm }) })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    setEditId(null); setSaving(false)
  }

  async function remove(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch("/api/vistas-checklist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
  }

  const totalDone = tasks.filter(t => t.done && !t.isWarning).length
  const totalReal = tasks.filter(t => !t.isWarning).length

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: T.mutedFg, fontSize: 13 }}>
      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Carregando plano de ação...
    </div>
  )

  const inputStyle = { padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, outline: "none" }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: T.mutedFg }}>Período: 10 a 30 de abril · Objetivo: todas as ações de mídia paga e website no ar</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.mutedFg }}><Check size={12} color={COR} style={{ display: "inline", marginRight: 4 }} />{totalDone} de {totalReal} concluídas</p>
        </div>
      </div>
      {SECTION_ORDER.map(sKey => {
        const secTasks = grouped[sKey]
        const meta = SECTION_META[sKey]
        if (secTasks.length === 0 && addingSection !== sKey) return null
        const doneCount = secTasks.filter(t => t.done && !t.isWarning).length
        const totalCount = secTasks.filter(t => !t.isWarning).length
        return (
          <div key={sKey} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${COR}30`, paddingBottom: 8, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>{meta.label}</span>
                {meta.live && <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "#10b98115", padding: "2px 8px", borderRadius: 20 }}>Live: {meta.live}</span>}
              </div>
              <span style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>{doneCount}/{totalCount}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {secTasks.map(task => {
                if (task.isWarning) return (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                    <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{task.title}</span>{task.notes && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.mutedFg }}>{task.notes}</p>}</div>
                    {task.deadline && <span style={{ fontSize: 11, color: "#f59e0b", whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDate(task.deadline)}</span>}
                  </div>
                )
                if (editId === task.id) return (
                  <div key={task.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, background: `${COR}06`, borderRadius: 6 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, padding: "0 4px" }}>
                      <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus style={{ ...inputStyle, flex: "1 1 200px" }} />
                      <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observação" style={{ ...inputStyle, flex: "1 1 180px" }} />
                      <input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} style={inputStyle} />
                      <input value={editForm.link} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))} placeholder="Link (opcional)" style={{ ...inputStyle, flex: "1 1 160px" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, padding: "0 4px" }}>
                      <button onClick={() => saveEdit(task.id)} style={{ padding: "5px 14px", background: COR, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>{saving ? "Salvando..." : "Salvar"}</button>
                      <button onClick={() => setEditId(null)} style={{ padding: "5px 12px", background: "transparent", color: T.mutedFg, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font }}>Cancelar</button>
                      <button onClick={() => remove(task.id)} style={{ marginLeft: "auto", padding: "5px 8px", background: "transparent", color: T.destructive, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
                return (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}`, opacity: task.done ? 0.5 : 1, transition: "opacity 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget.querySelector(".row-actions") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".row-actions") as HTMLElement).style.opacity = "1") }}
                    onMouseLeave={e => { (e.currentTarget.querySelector(".row-actions") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".row-actions") as HTMLElement).style.opacity = "0") }}
                  >
                    <button onClick={() => toggle(task.id, !task.done)} style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: "pointer", border: `2px solid ${task.done ? COR : T.border}`, background: task.done ? COR : "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, marginTop: 1 }}>
                      {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: T.cardFg, fontWeight: 500, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                        {task.link && <a href={task.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: COR, textDecoration: "none" }}><Link2 size={10} /> link</a>}
                      </div>
                      {task.notes && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.mutedFg }}>{task.notes}</p>}
                    </div>
                    {task.deadline && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: T.mutedFg, whiteSpace: "nowrap", flexShrink: 0 }}><Calendar size={10} /> {fmtDate(task.deadline)}</span>}
                    <div className="row-actions" style={{ display: "flex", gap: 4, flexShrink: 0, opacity: 0, transition: "opacity 0.1s" }}>
                      <button onClick={() => { setEditId(task.id); setEditForm({ title: task.title, notes: task.notes || "", deadline: task.deadline || "", link: task.link || "" }) }} style={{ padding: "3px 6px", background: "transparent", color: T.mutedFg, border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}><Pencil size={11} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
            {addingSection === sKey ? (
              <div style={{ padding: "12px 0 4px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Nome da tarefa..." style={{ ...inputStyle, flex: "1 1 200px" }} />
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observação (opcional)" style={{ ...inputStyle, flex: "1 1 200px" }} />
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addTask} disabled={saving || !form.title.trim()} style={{ padding: "6px 14px", background: COR, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font, opacity: !form.title.trim() ? 0.5 : 1 }}>{saving ? "Salvando..." : "Adicionar"}</button>
                  <button onClick={() => { setAddingSection(null); setForm(EMPTY_ADD) }} style={{ padding: "6px 12px", background: "transparent", color: T.mutedFg, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAddingSection(sKey); setForm(EMPTY_ADD); setEditId(null) }} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, background: "transparent", border: "none", cursor: "pointer", color: T.mutedFg, fontSize: 12, fontFamily: T.font, padding: "4px 0" }}>
                <Plus size={12} /> Adicionar tarefa
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface CriativoRow {
  campaign_name: string; ad_name: string; ad_id: string
  investimento: number; impressoes: number; leads: number; won: number
  gasto_hoje: number; gasto_ontem: number; imp_hoje: number; imp_ontem: number
}

function CriativosSection() {
  const toISO = (d: Date) => d.toISOString().split("T")[0]
  const today = new Date()
  const d30 = new Date(today); d30.setDate(today.getDate() - 30)

  const [dataInicio, setDataInicio] = useState(toISO(d30))
  const [dataFim, setDataFim] = useState(toISO(today))
  const [rows, setRows] = useState<CriativoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [ultimaAtt, setUltimaAtt] = useState("")
  const [iaAnalise, setIaAnalise] = useState("")
  const [iaLoading, setIaLoading] = useState(false)

  const load = useCallback(async (di: string, df: string) => {
    setLoading(true); setError("")
    try {
      const sql = `SELECT campaign_name, ad_name, ad_id,
        SUM(CASE WHEN date >= DATE '${di}' AND date <= DATE '${df}' THEN spend ELSE 0 END) AS investimento,
        SUM(CASE WHEN date >= DATE '${di}' AND date <= DATE '${df}' THEN impressions ELSE 0 END) AS impressoes,
        SUM(CASE WHEN date >= DATE '${di}' AND date <= DATE '${df}' THEN lead ELSE 0 END) AS leads,
        SUM(CASE WHEN date >= DATE '${di}' AND date <= DATE '${df}' THEN won ELSE 0 END) AS won,
        SUM(CASE WHEN date = CURRENT_DATE THEN spend ELSE 0 END) AS gasto_hoje,
        SUM(CASE WHEN date = CURRENT_DATE - INTERVAL '1' DAY THEN spend ELSE 0 END) AS gasto_ontem,
        SUM(CASE WHEN date = CURRENT_DATE THEN impressions ELSE 0 END) AS imp_hoje,
        SUM(CASE WHEN date = CURRENT_DATE - INTERVAL '1' DAY THEN impressions ELSE 0 END) AS imp_ontem
        FROM nekt_silver.ads_unificado_historico
        WHERE REGEXP_LIKE(campaign_name, '^\\[SH\\]')
          AND (LOWER(campaign_name) LIKE '%vistas%' OR LOWER(campaign_name) LIKE '%anit%' OR LOWER(campaign_name) LIKE '%vista%' OR LOWER(campaign_name) LIKE '%serra%')
          AND campaign_name IN (SELECT DISTINCT campaign_name FROM nekt_silver.ads_unificado_historico WHERE spend > 0 AND date >= CURRENT_DATE - INTERVAL '7' DAY)
        GROUP BY campaign_name, ad_name, ad_id ORDER BY investimento DESC`
      const res = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sql }) })
      const data = await res.json()
      const mapped: CriativoRow[] = (data.rows || []).map((r: Record<string, unknown>) => ({
        campaign_name: String(r.campaign_name || ""), ad_name: String(r.ad_name || ""), ad_id: String(r.ad_id || ""),
        investimento: Number(r.investimento) || 0, impressoes: Number(r.impressoes) || 0,
        leads: Number(r.leads) || 0, won: Number(r.won) || 0,
        gasto_hoje: Number(r.gasto_hoje) || 0, gasto_ontem: Number(r.gasto_ontem) || 0,
        imp_hoje: Number(r.imp_hoje) || 0, imp_ontem: Number(r.imp_ontem) || 0,
      }))
      setRows(mapped)
      setCampaigns([...new Set(mapped.map(r => r.campaign_name))].filter(Boolean))
      setUltimaAtt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
    } catch (e) { setError(String(e)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(dataInicio, dataFim) }, [])

  async function analisarIA() {
    setIaLoading(true); setIaAnalise("")
    try {
      const res = await fetch("/api/analyze-creatives", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, groupBy: "ad_name", dataInicio, dataFim, vistaMode: true }) })
      const data = await res.json()
      setIaAnalise(data.analysis || data.error || "Sem resposta")
    } catch (e) { setIaAnalise(String(e)) } finally { setIaLoading(false) }
  }

  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR")

  const inputStyle: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: T.cardFg, outline: "none" }

  return (
    <div>
      {/* Filtros + ações */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>Período</span>
        <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
        <span style={{ fontSize: 12, color: T.mutedFg }}>até</span>
        <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
        <button onClick={() => load(dataInicio, dataFim)} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 5, background: T.primary, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Buscar
        </button>
        {ultimaAtt && <span style={{ fontSize: 11, color: T.mutedFg }}>Atualizado às {ultimaAtt}</span>}
        <button onClick={analisarIA} disabled={iaLoading || rows.length === 0 || loading} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: "#7C3AED", color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: iaLoading ? 0.7 : 1 }}>
          <Sparkles size={12} /> {iaLoading ? "Analisando..." : "Analisar com IA"}
        </button>
      </div>

      {/* Painel IA */}
      {iaAnalise && (
        <div style={{ background: `#7C3AED10`, border: `1px solid #7C3AED40`, borderRadius: 10, padding: "14px 16px", marginBottom: 14, fontSize: 13, color: T.cardFg, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, color: "#7C3AED", fontSize: 13 }}><Sparkles size={14} /> Análise IA</div>
          {iaAnalise}
        </div>
      )}

      {/* Estado vazio / erro */}
      {error && <div style={{ fontSize: 13, color: T.destructive, background: `${T.destructive}10`, padding: "10px 14px", borderRadius: 8, marginBottom: 10 }}>Erro: {error}</div>}
      {!loading && rows.length === 0 && !error && <div style={{ fontSize: 13, color: T.mutedFg, fontStyle: "italic", background: T.muted, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}` }}>Nenhum criativo [SH] ativo encontrado para o período.</div>}

      {/* Badges de campanha + contador */}
      {rows.length > 0 && (
        <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.mutedFg }}>{rows.length} criativos ·</span>
          {campaigns.map(c => <span key={c} style={{ background: `${COR}15`, color: COR, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c}</span>)}
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.mutedFg, fontSize: 13, padding: "16px 0" }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Buscando criativos na Nekt...</div>
      ) : rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.muted }}>
                {["Anúncio", "Ad ID", "Campanha", "Investimento", "Impressões", "Variação D-1", "Leads", "WON"].map(col =>
                  <th key={col} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{col}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const dGasto = row.gasto_hoje - row.gasto_ontem
                const dImp = row.imp_hoje - row.imp_ontem
                const hasVar = row.gasto_hoje > 0 || row.gasto_ontem > 0
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = T.muted }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}>
                    <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.ad_name}>{row.ad_name || "—"}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{row.ad_id || "—"}</td>
                    <td style={{ padding: "7px 10px" }}><span style={{ background: `${COR}15`, color: COR, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{row.campaign_name}</span></td>
                    <td style={{ padding: "7px 10px", color: T.cardFg, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>R$ {fmt(row.investimento)}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmtInt(row.impressoes)}</td>
                    <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                      {!hasVar ? <span style={{ color: T.mutedFg, fontSize: 11 }}>—</span> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, color: dGasto >= 0 ? T.teal600 : T.destructive, fontSize: 11, fontFamily: "monospace" }}>
                            {dGasto >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            R$ {fmt(Math.abs(dGasto))} gasto
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, color: dImp >= 0 ? T.teal600 : T.destructive, fontSize: 11, fontFamily: "monospace" }}>
                            {dImp >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {fmtInt(Math.abs(dImp))} imp.
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "7px 10px", color: T.teal600, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{row.leads > 0 ? fmtInt(row.leads) : "—"}</td>
                    <td style={{ padding: "7px 10px", color: T.primary, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{row.won > 0 ? fmtInt(row.won) : "—"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Influenciadores ── */
interface InfluRow {
  id: string; ano: string; mes: string; categoria: string; perfil: string
  link_perfil: string; seguidores: string; contato: string; status: string
  valor_trabalho: string; valor_hospedagem: string; data_visita: string
  data_contratacao: string; data_pagamento: string; cupom: string
  validade_cupom: string; data_post: string; link_post: string
  conversoes: string; valor_reservas: string; conteudo_orcado: string; observacoes: string
}

const INFLU_COLS: { key: keyof InfluRow; label: string; width: number; type?: string; dropdown?: string[] }[] = [
  { key: 'ano', label: 'Ano', width: 70 },
  { key: 'mes', label: 'Mês', width: 110 },
  { key: 'categoria', label: 'Categoria', width: 90, dropdown: ['Influ', 'Perfil', 'Página'] },
  { key: 'perfil', label: 'Perfil', width: 160 },
  { key: 'link_perfil', label: 'Link Perfil', width: 80, type: 'link' },
  { key: 'seguidores', label: 'Seguidores', width: 90 },
  { key: 'contato', label: 'Contato', width: 130 },
  { key: 'status', label: 'Status', width: 120, dropdown: ['Contratado', 'Não contratado', 'Aguardando', 'Sem resposta'] },
  { key: 'valor_trabalho', label: 'Vlr Trabalho', width: 100 },
  { key: 'valor_hospedagem', label: 'Vlr Hosp.', width: 90 },
  { key: 'data_visita', label: 'Data Visita', width: 110 },
  { key: 'cupom', label: 'Cupom', width: 90 },
  { key: 'validade_cupom', label: 'Val. Cupom', width: 100 },
  { key: 'data_contratacao', label: 'Dt Contrat.', width: 100 },
  { key: 'data_pagamento', label: 'Dt Pgto', width: 100 },
  { key: 'data_post', label: 'Data Post', width: 110 },
  { key: 'link_post', label: 'Link Post', width: 80, type: 'link' },
  { key: 'conversoes', label: 'Conversões', width: 90 },
  { key: 'valor_reservas', label: 'Vlr Reservas', width: 100 },
  { key: 'conteudo_orcado', label: 'Conteúdo Orçado/Contratado', width: 200 },
  { key: 'observacoes', label: 'Observações', width: 200 },
]

const MES_NOMES: Record<number, string> = {
  1: '01. Janeiro', 2: '02. Fevereiro', 3: '03. Março', 4: '04. Abril',
  5: '05. Maio', 6: '06. Junho', 7: '07. Julho', 8: '08. Agosto',
  9: '09. Setembro', 10: '10. Outubro', 11: '11. Novembro', 12: '12. Dezembro',
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() || ''
  if (s === 'contratado') return { bg: '#10b98120', color: '#10b981', border: '#10b98140' }
  if (s.includes('não') || s.includes('nao')) return { bg: '#ef444420', color: '#ef4444', border: '#ef444440' }
  if (s.includes('aguard')) return { bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' }
  return { bg: '#88888815', color: '#888', border: '#88888830' }
}

function parseValor(v: string): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function InfluenciadoresSection() { const tableRef = useRef<HTMLDivElement>(null); useEffect(() => { const el = tableRef.current; if (!el) return; function onWheel(e: WheelEvent) { if (e.shiftKey) { e.preventDefault(); if (el) el.scrollLeft += e.deltaY } } el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel) }, []);
  const [rows, setRows] = useState<InfluRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editCell, setEditCell] = useState<{ id: string; key: keyof InfluRow } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [colFilters, setColFilters] = useState<Partial<Record<keyof InfluRow, string[]>>>({})
  const [search, setSearch] = useState('')
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [orcamento, setOrcamento] = useState('')
  const [editOrcamento, setEditOrcamento] = useState(false)
  const [filterAno, setFilterAno] = useState('Todos')
  const [filterMes, setFilterMes] = useState('Todos')

  useEffect(() => {
    fetch('/api/vistas-influenciadores').then(r => r.json()).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
    try { const s = localStorage.getItem('vistas-orcamento-mensal'); if (s) setOrcamento(s) } catch {}
    // Inicializa filtro com mês/ano atual
    const now = new Date()
    setFilterAno(String(now.getFullYear()))
    setFilterMes(MES_NOMES[now.getMonth() + 1] || 'Todos')
  }, [])

  const mesAtual = MES_NOMES[new Date().getMonth() + 1] || ''
  const anos = ['Todos', ...Array.from(new Set(rows.map(r => r.ano).filter(Boolean))).sort()]
  const meses = ['Todos', ...Array.from(new Set(rows.map(r => r.mes).filter(Boolean))).sort()]

  const colOptions = (key: keyof InfluRow) =>
    ['Todos', ...Array.from(new Set(rows.map(r => r[key] || ''))).filter(Boolean).sort()]

  // Rows filtradas por período para os KPIs
  const rowsPeriodo = rows.filter(r => {
    if (filterAno !== 'Todos' && r.ano !== filterAno) return false
    if (filterMes !== 'Todos' && r.mes !== filterMes) return false
    return true
  })

  // Rows filtradas para a tabela (período + col filters + search)
  const filtered = rowsPeriodo.filter(r => {
    for (const [key, vals] of Object.entries(colFilters)) { if (vals && vals.length > 0 && !vals.includes(r[key as keyof InfluRow] || '')) return false }
    if (search) {
      const q = search.toLowerCase()
      return r.perfil?.toLowerCase().includes(q) || r.observacoes?.toLowerCase().includes(q) || r.cupom?.toLowerCase().includes(q)
    }
    return true
  })

  const totalPeriodo = rowsPeriodo.length
  const contratadosPeriodo = rowsPeriodo.filter(r => r.status?.toLowerCase() === 'contratado').length
  const naoContratadosPeriodo = totalPeriodo - contratadosPeriodo

  const totalUtilizado = rowsPeriodo
    .filter(r => r.status?.toLowerCase() === 'contratado')
    .reduce((s, r) => s + parseValor(r.valor_trabalho) + parseValor(r.valor_hospedagem), 0)

  const orcamentoNum = parseValor(orcamento)
  const saldo = orcamentoNum - totalUtilizado
  const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  function startEdit(id: string, key: keyof InfluRow, val: string) {
    setEditCell({ id, key }); setEditVal(val || '')
  }

  async function commitEdit() {
    if (!editCell) return
    setSaving(true)
    await fetch('/api/vistas-influenciadores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editCell.id, [editCell.key]: editVal }) })
    setRows(prev => prev.map(r => r.id === editCell.id ? { ...r, [editCell.key]: editVal } : r))
    setEditCell(null); setSaving(false)
  }

  async function commitDropdown(id: string, key: keyof InfluRow, val: string) {
    await fetch('/api/vistas-influenciadores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [key]: val }) })
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  async function addRow() {
    const now = new Date()
    const newRow: Omit<InfluRow, 'id'> = {
      ano: filterAno !== 'Todos' ? filterAno : String(now.getFullYear()), mes: filterMes !== 'Todos' ? filterMes : mesAtual, categoria: 'Influ',
      perfil: 'Novo influenciador', link_perfil: '', seguidores: '', contato: '',
      status: 'Aguardando', valor_trabalho: '', valor_hospedagem: '', data_visita: '',
      data_contratacao: '', data_pagamento: '', cupom: '', validade_cupom: '',
      data_post: '', link_post: '', conversoes: '', valor_reservas: '',
      conteudo_orcado: '', observacoes: '',
    }
    const res = await fetch('/api/vistas-influenciadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) })
    const row = await res.json()
    setRows(prev => [...prev, row])
  }

  async function deleteRow(id: string) {
    if (!confirm('Remover esta linha?')) return
    await fetch('/api/vistas-influenciadores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function saveOrcamento(val: string) {
    setOrcamento(val)
    try { localStorage.setItem('vistas-orcamento-mensal', val) } catch {}
    setEditOrcamento(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '4px 8px', fontSize: 13, fontFamily: 'inherit', border: `1.5px solid ${COR}`, borderRadius: 4, outline: 'none', background: '#fff', color: '#111', minHeight: 28 }
  const selectStyle: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: 13, fontFamily: 'inherit', border: `1.5px solid ${COR}`, borderRadius: 4, outline: 'none', background: '#fff', color: '#111', cursor: 'pointer' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.mutedFg, fontSize: 13 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando influenciadores...</div>

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: '0 0 14px', borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Influenciadores</p>

      {/* Filtro de período */}
      <div style={{ background: `${COR}08`, border: `1px solid ${COR}25`, borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: COR, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtrar por período</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 10, color: T.mutedFg, fontWeight: 600 }}>Ano</span>
            <select value={filterAno} onChange={e => setFilterAno(e.target.value)} style={{ padding: '5px 10px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, outline: 'none', background: T.card, color: T.cardFg, minWidth: 90 }}>
              {anos.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 10, color: T.mutedFg, fontWeight: 600 }}>Mês</span>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)} style={{ padding: '5px 10px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, outline: 'none', background: T.card, color: T.cardFg, minWidth: 150 }}>
              {meses.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={() => { setFilterAno('Todos'); setFilterMes('Todos') }} style={{ marginTop: 18, padding: '5px 12px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', color: T.mutedFg, fontFamily: T.font }}>
            Todos os períodos
          </button>
          <span style={{ marginTop: 18, fontSize: 12, color: T.mutedFg }}>{rowsPeriodo.length} registros</span>
        </div>
      </div>

      {/* KPIs do período */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: totalPeriodo, color: T.cardFg },
          { label: 'Contratados', value: contratadosPeriodo, color: '#10b981' },
          { label: 'Não contratados', value: naoContratadosPeriodo, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: T.mutedFg }}>{k.label}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</span>
          </div>
        ))}

        {/* Orçamento */}
        <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 10, color: T.mutedFg, textTransform: 'uppercase', fontWeight: 700 }}>Orçamento Total</span>
            {editOrcamento ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <input autoFocus defaultValue={orcamento} onBlur={e => saveOrcamento(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveOrcamento((e.target as HTMLInputElement).value) }} style={{ ...inputStyle, width: 110 }} placeholder="ex: 5000" />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: COR }}>{orcamentoNum ? `R$ ${fmtBRL(orcamentoNum)}` : '—'}</span>
                <button onClick={() => setEditOrcamento(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.mutedFg, padding: 0 }}><Pencil size={12} /></button>
              </div>
            )}
          </div>
          <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 14 }}>
            <span style={{ fontSize: 10, color: T.mutedFg, textTransform: 'uppercase', fontWeight: 700 }}>Já utilizado</span>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ef4444' }}>R$ {fmtBRL(totalUtilizado)}</p>
          </div>
          {orcamentoNum > 0 && (
            <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 14 }}>
              <span style={{ fontSize: 10, color: T.mutedFg, textTransform: 'uppercase', fontWeight: 700 }}>Saldo livre</span>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: saldo >= 0 ? '#10b981' : '#ef4444' }}>
                R$ {fmtBRL(Math.abs(saldo))} {saldo < 0 ? '⚠️' : ''}
              </p>
            </div>
          )}
          {orcamentoNum > 0 && (
            <div style={{ borderLeft: `1px solid ${T.border}`, paddingLeft: 14, minWidth: 140 }}>
              <span style={{ fontSize: 10, color: T.mutedFg, textTransform: 'uppercase', fontWeight: 700 }}>Utilização</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ background: T.border, borderRadius: 99, height: 8, flex: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, (totalUtilizado / orcamentoNum) * 100)}%`, background: saldo >= 0 ? '#10b981' : '#ef4444', transition: 'width 0.5s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: saldo >= 0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                  {((totalUtilizado / orcamentoNum) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Busca + botões */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar perfil, cupom, obs..."
          style={{ padding: '6px 12px', fontSize: 13, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.font, outline: 'none', background: T.muted, color: T.cardFg, width: 220 }} />
        <span style={{ fontSize: 12, color: T.mutedFg }}>{filtered.length} linhas</span>
        <button onClick={() => setColFilters({})} style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', color: T.mutedFg, fontFamily: T.font }}>Limpar filtros</button>
        <button onClick={addRow} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: COR, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
          <Plus size={13} /> Nova linha
        </button>
      </div>

      {/* Tabela */}
      <div ref={tableRef} style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 30 }} />
            {INFLU_COLS.map(c => <col key={c.key} style={{ width: c.width }} />)}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr style={{ background: `${COR}12`, borderBottom: `1px solid ${COR}30` }}>
              <th style={{ padding: '8px 4px', color: T.mutedFg, fontWeight: 700, fontSize: 11, textAlign: 'center' }}>#</th>
              {INFLU_COLS.map(c => <th key={c.key} style={{ padding: '8px 10px', color: T.mutedFg, fontWeight: 700, fontSize: 11, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</th>)}
              <th style={{ padding: '8px 4px', color: T.mutedFg, fontWeight: 700, fontSize: 11, textAlign: 'center' }}>⋯</th>
            </tr>
            {/* Filtros por coluna */}
            <tr style={{ background: `${COR}06`, borderBottom: `2px solid ${COR}40` }}>
              <th />
              {INFLU_COLS.map(c => {
                const opts = colOptions(c.key).sort((a, b) => a === 'Todos' ? -1 : b === 'Todos' ? 1 : a.localeCompare(b, 'pt-BR'))
                const hasFilter = !!(colFilters[c.key] && colFilters[c.key]!.length > 0)
                return (
                  <th key={c.key} style={{ padding: '3px 4px', position: 'relative' }}>
                    <select value="" onChange={e => { const v = e.target.value; if (v === 'Todos') { setColFilters(prev => { const n = {...prev}; delete n[c.key as keyof InfluRow]; return n }); } else { setColFilters(prev => { const cur = prev[c.key as keyof InfluRow] || []; const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]; return {...prev, [c.key as keyof InfluRow]: next} }) } }}
                      style={{ width: '100%', padding: '3px 4px', fontSize: 11, border: `1px solid ${hasFilter ? COR : T.border}`, borderRadius: 4, fontFamily: T.font, outline: 'none', background: hasFilter ? `${COR}15` : T.muted, color: hasFilter ? COR : T.mutedFg, fontWeight: hasFilter ? 700 : 400 }}>
                      {opts.map(o => <option key={o} value={o}>{o === 'Todos' ? '— todos —' : o}</option>)}
                    </select>
                  </th>
                )
              })}
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? 'transparent' : `${T.muted}80` }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = `${COR}08`}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : `${T.muted}80`}
              >
                <td style={{ padding: '5px 4px', color: T.mutedFg, fontSize: 11, textAlign: 'center' }}>{i + 1}</td>
                {INFLU_COLS.map(col => {
                  const val = row[col.key] || ''
                  const isEditing = editCell?.id === row.id && editCell?.key === col.key

                  if (isEditing) return (
                    <td key={col.key} style={{ padding: '3px 4px' }}>
                      <textarea autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => setTimeout(() => commitEdit(), 150)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() } if (e.key === 'Escape') setEditCell(null) }}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 32 }} rows={val.includes('\n') ? 3 : 1} />
                    </td>
                  )

                  // Dropdown de status inline
                  if (col.key === 'status') {
                    const badge = statusBadge(val)
                    return (
                      <td key={col.key} style={{ padding: '5px 8px' }}>
                        <select value={val} onChange={e => commitDropdown(row.id, col.key, e.target.value)}
                          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: T.font }}>
                          <option value="">—</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Não contratado">Não contratado</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Sem resposta">Sem resposta</option>
                        </select>
                      </td>
                    )
                  }

                  // Dropdown de categoria inline
                  if (col.key === 'categoria') {
                    return (
                      <td key={col.key} style={{ padding: '5px 8px' }}>
                        <select value={val} onChange={e => commitDropdown(row.id, col.key, e.target.value)}
                          style={{ background: `${COR}10`, color: COR, border: `1px solid ${COR}30`, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: T.font }}>
                          <option value="">—</option>
                          <option value="Influ">Influ</option>
                          <option value="Perfil">Perfil</option>
                          <option value="Página">Página</option>
                        </select>
                      </td>
                    )
                  }

                  // Link Post e Link Perfil
                  if (col.type === 'link' && val && val.startsWith('http')) return (
                    <td key={col.key} style={{ padding: '5px 8px', cursor: 'cell' }} onDoubleClick={() => startEdit(row.id, col.key, val)}>
                      <a href={val.split('\n')[0]} target="_blank" rel="noopener noreferrer" style={{ color: COR, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>🔗 ver</a>
                    </td>
                  )

                  return (
                    <td key={col.key} style={{ padding: '5px 8px', cursor: 'cell', maxWidth: col.width, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: T.cardFg, fontSize: 13 }} title={val} onDoubleClick={() => startEdit(row.id, col.key, val)}>
                      {val ? <TextWithLinks text={val} style={{ fontSize: 13 }} /> : <span style={{ color: T.mutedFg, fontSize: 12 }}>—</span>}
                    </td>
                  )
                })}
                <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                  <button onClick={() => deleteRow(row.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.mutedFg, padding: 2, opacity: 0.4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.4'}
                  ><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: T.mutedFg, marginTop: 6 }}>💡 Clique duplo para editar texto · Dropdowns de Categoria e Status clicáveis direto · Cole URLs e viram links 🔗</p>
    </div>
  )
}

const METAS_SEGUIDORES: Record<string, number> = { '04': 170000 }

function SocialMediaSection() {
  const [data, setData] = useState<{ total_seguidores: number | null; ganho_hoje: number | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/seguidores-vistas").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const mesAtualNum = String(new Date().getMonth() + 1).padStart(2, '0')
  const metaMes = METAS_SEGUIDORES[mesAtualNum] ?? null
  const total = data?.total_seguidores ?? null
  const faltam = metaMes && total ? Math.max(0, metaMes - total) : null
  const progresso = metaMes && total ? Math.min(100, (total / metaMes) * 100) : null

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 12px", borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Seguidores</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total de Seguidores", value: loading ? "—" : total?.toLocaleString("pt-BR") ?? "—", color: COR },
          { label: "Ganho Hoje", value: loading ? "—" : data?.ganho_hoje != null ? `+${data.ganho_hoje.toLocaleString("pt-BR")}` : "—", color: "#10b981" },
          ...(metaMes ? [{ label: "Meta do Mês", value: metaMes.toLocaleString("pt-BR"), color: "#f59e0b" }] : []),
          ...(faltam !== null ? [{ label: "Faltam para a Meta", value: faltam > 0 ? faltam.toLocaleString("pt-BR") : "✓ Meta batida!", color: faltam > 0 ? "#ef4444" : "#10b981" }] : []),
        ].map(kpi => (
          <div key={kpi.label} style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, margin: 0 }}>
              {loading && kpi.label !== "Meta do Mês" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : kpi.value}
            </p>
          </div>
        ))}
      </div>
      {progresso !== null && !loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.mutedFg, marginBottom: 4 }}>
            <span>Progresso para meta de {metaMes!.toLocaleString('pt-BR')}</span>
            <span style={{ fontWeight: 700, color: progresso >= 100 ? '#10b981' : COR }}>{progresso.toFixed(1)}%</span>
          </div>
          <div style={{ background: T.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${progresso}%`, background: progresso >= 100 ? '#10b981' : COR, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}
      <div style={{ marginTop: 8 }}><InfluenciadoresSection /></div>
    </div>
  )
}

export default function VistasHospedesPage() {
  const [days, setDays] = useState<DayData[]>([])
  const [loadingRes, setLoadingRes] = useState(true)
  const [errorRes, setErrorRes] = useState("")

  const fetchReservas = useCallback(async () => {
    setLoadingRes(true); setErrorRes("")
    try {
      const res = await fetch("/api/vistas-reservas", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro")
      setDays(data.days || [])
    } catch (e) { setErrorRes(String(e)) } finally { setLoadingRes(false) }
  }, [])

  useEffect(() => { fetchReservas() }, [fetchReservas])

  const today = days[days.length - 1]?.count ?? 0
  const avg30 = days.length > 0 ? (days.reduce((s, d) => s + d.count, 0) / days.length) : 0
  const avg30r = Math.round(avg30 * 10) / 10

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <header style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 52, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500 }}><ChevronLeft size={14} /> Menu</Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Vistas de Anitá — Hóspedes</span>
      </header>
      <main style={{ padding: "24px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>Metabase · Reservas Pagas</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Meta de Reservas — Anitápolis</h2>
            </div>
            <button onClick={fetchReservas} disabled={loadingRes} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, color: T.mutedFg, cursor: "pointer", fontFamily: T.font }}>
              {loadingRes ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "↻"} Atualizar
            </button>
          </div>
          {errorRes ? (
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: `${T.destructive}10`, border: `1px solid ${T.destructive}30`, borderRadius: 10 }}>
              <AlertCircle size={16} color={T.destructive} /><span style={{ fontSize: 13, color: T.destructive }}>{errorRes}</span>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Hoje", value: loadingRes ? "—" : String(today), color: statusColor(today, META_DIA) },
                  { label: "Média 30 dias", value: loadingRes ? "—" : fmt2(avg30r), color: statusColor(avg30r, META_DIA) },
                  { label: "Meta diária", value: String(META_DIA), color: "#10b981" },
                  { label: "Status", value: loadingRes ? "—" : avg30r >= META_DIA ? "✓ Acima da meta" : "Abaixo da meta", color: statusColor(avg30r, META_DIA) },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", boxShadow: T.elevSm }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              {!loadingRes && days.length > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: T.elevSm }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, fontSize: 11, color: T.mutedFg }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, background: `${COR}88`, borderRadius: 2, display: "inline-block" }} /> Reservas/dia</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 2, background: COR, display: "inline-block" }} /> Média móvel 30d</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 14, height: 2, background: "#10b981", borderTop: "2px dashed #10b981", display: "inline-block" }} /> Meta (7/dia)</span>
                  </div>
                  <ReservasChart days={days} />
                </div>
              )}
              {loadingRes && <div style={{ textAlign: "center", padding: 32, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}><Loader2 size={20} color={COR} style={{ animation: "spin 1s linear infinite" }} /></div>}
            </>
          )}
        </section>

        {/* ── Navegação ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            <Link href="/vistas-hospedes/plano-de-acao" style={{ textDecoration: "none" }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${COR}` }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: COR, margin: "0 0 4px" }}>Plano de Ação</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>To do&apos;s por sub-área</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Mídia paga · Website · Social · Automação</p>
                </div>
                <ChevronRight size={20} color={T.mutedFg} />
              </div>
            </Link>
            <Link href="/vistas-hospedes/resumo-resultados" style={{ textDecoration: "none" }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: "4px solid #10b981" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10b981", margin: "0 0 4px" }}>Resultados</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>Resumo e resultado das ações</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Métricas · Análise estratégica por IA</p>
                </div>
                <ChevronRight size={20} color={T.mutedFg} />
              </div>
            </Link>
            <Link href="/vistas-hospedes/midia-paga" style={{ textDecoration: "none" }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${T.primary}` }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.primary, margin: "0 0 4px" }}>Mídia Paga</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>Análise de desempenho</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Meta Ads · Gastos · ROI · Metabase</p>
                </div>
                <ChevronRight size={20} color={T.mutedFg} />
              </div>
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>Nekt · Meta Ads</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Criativos Ativos</h2>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm }}><CriativosSection /></div>
        </section>
        <section>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>Instagram</p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Social Media</h2>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm }}><SocialMediaSection /></div>
        </section>
      </main>
    </div>
  )
}