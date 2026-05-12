"use client"
import { CalendarioConteudoVistas } from './_components/CalendarioConteudoVistas';
import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Check, Calendar, Link2, AlertTriangle, Pencil, TrendingUp, TrendingDown, RefreshCw, Sparkles, Copy, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { T } from "@/lib/constants"
import type { DayData } from "@/app/api/vistas-reservas/route"
import type { Task } from "@/app/api/vistas-checklist/route"

const META_DIA = 7
const META_MENSAL = 15000
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
      setRows(mapped); setCampaigns([...new Set(mapped.map(r => r.campaign_name))].filter(Boolean))
      setUltimaAtt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }))
    } catch (e) { setError(String(e)) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(dataInicio, dataFim) }, [])

  async function analisarIA() {
    setIaLoading(true); setIaAnalise("")
    try {
      const res = await fetch("/api/analyze-creatives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows, groupBy: "ad_name", dataInicio, dataFim, vistaMode: true }) })
      const data = await res.json()
      setIaAnalise(data.analysis || data.error || "Sem resposta")
    } catch (e) { setIaAnalise(String(e)) } finally { setIaLoading(false) }
  }

  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR")
  const inputStyle: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: T.cardFg, outline: "none" }

  return (
    <div>
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
      {iaAnalise && (
        <div style={{ background: `#7C3AED10`, border: `1px solid #7C3AED40`, borderRadius: 10, padding: "14px 16px", marginBottom: 14, fontSize: 13, color: T.cardFg, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, color: "#7C3AED", fontSize: 13 }}><Sparkles size={14} /> Análise IA</div>
          {iaAnalise}
        </div>
      )}
      {error && <div style={{ fontSize: 13, color: T.destructive, background: `${T.destructive}10`, padding: "10px 14px", borderRadius: 8, marginBottom: 10 }}>Erro: {error}</div>}
      {!loading && rows.length === 0 && !error && <div style={{ fontSize: 13, color: T.mutedFg, fontStyle: "italic", background: T.muted, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}` }}>Nenhum criativo [SH] ativo encontrado para o período.</div>}
      {rows.length > 0 && (
        <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: T.mutedFg }}>{rows.length} criativos ·</span>
          {campaigns.map(c => <span key={c} style={{ background: `${COR}15`, color: COR, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c}</span>)}
        </div>
      )}
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
                            {dGasto >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} R$ {fmt(Math.abs(dGasto))} gasto
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3, color: dImp >= 0 ? T.teal600 : T.destructive, fontSize: 11, fontFamily: "monospace" }}>
                            {dImp >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {fmtInt(Math.abs(dImp))} imp.
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

const INFLU_COLS: { key: keyof InfluRow; label: string; width: number; type?: string }[] = [
  { key: 'ano', label: 'Ano', width: 60 },
  { key: 'mes', label: 'Mês', width: 100 },
  { key: 'categoria', label: 'Categoria', width: 85 },
  { key: 'perfil', label: 'Perfil', width: 160 },
  { key: 'link_perfil', label: 'Link', width: 60, type: 'link' },
  { key: 'seguidores', label: 'Seguidores', width: 85 },
  { key: 'contato', label: 'Contato', width: 140 },
  { key: 'status', label: 'Status', width: 130 },
  { key: 'valor_trabalho', label: 'Vlr Trabalho', width: 95 },
  { key: 'valor_hospedagem', label: 'Vlr Hosp.', width: 85 },
  { key: 'data_visita', label: 'Data Visita', width: 105 },
  { key: 'cupom', label: 'Cupom', width: 85 },
  { key: 'validade_cupom', label: 'Val. Cupom', width: 95 },
  { key: 'data_contratacao', label: 'Dt Contrat.', width: 95 },
  { key: 'data_pagamento', label: 'Dt Pgto', width: 90 },
  { key: 'data_post', label: 'Data Post', width: 100 },
  { key: 'link_post', label: 'Link Post', width: 75, type: 'link' },
  { key: 'conversoes', label: 'Conversões', width: 85 },
  { key: 'valor_reservas', label: 'Vlr Reservas', width: 100 },
  { key: 'conteudo_orcado', label: 'Conteúdo Orçado', width: 180 },
  { key: 'observacoes', label: 'Observações', width: 180 },
]

const MES_NOMES: Record<number, string> = {
  1: '01. Janeiro', 2: '02. Fevereiro', 3: '03. Março', 4: '04. Abril',
  5: '05. Maio', 6: '06. Junho', 7: '07. Julho', 8: '08. Agosto',
  9: '09. Setembro', 10: '10. Outubro', 11: '11. Novembro', 12: '12. Dezembro',
}

function statusStyle(s: string): React.CSSProperties {
  const v = s?.toLowerCase() || ''
  if (v === 'contratado') return { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }
  if (v.includes('não') || v.includes('nao')) return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
  if (v.includes('aguard')) return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
  return { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }
}

function parseValor(v: string): number {
  if (!v) return 0
  const n = parseFloat(v.replace(/[^\d,.-]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function ColFilterPopup({ colKey, label, allRows, active, onApply, onClose }: {
  colKey: keyof InfluRow; label: string; allRows: InfluRow[]
  active: string[]; onApply: (vals: string[]) => void; onClose: () => void
}) {
  const allOpts = Array.from(new Set(allRows.map(r => r[colKey] || ''))).filter(Boolean)
  const [sortAZ, setSortAZ] = useState(true)
  const [searchVal, setSearchVal] = useState('')
  const [selected, setSelected] = useState<string[]>(active.length ? [...active] : [...allOpts])

  const sorted = [...allOpts].sort((a, b) => sortAZ ? a.localeCompare(b, 'pt-BR') : b.localeCompare(a, 'pt-BR'))
  const visible = sorted.filter(o => o.toLowerCase().includes(searchVal.toLowerCase()))
  const allSelected = selected.length === allOpts.length
  const someSelected = selected.length > 0 && !allSelected

  function toggle(v: string) {
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const GS = { border: '#dadce0', headerBg: '#f8f9fa', text: '#202124', textMuted: '#5f6368' }

  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: '#fff', border: `1px solid ${GS.border}`, borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 240, overflow: 'hidden' }}
      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div style={{ padding: '8px 12px', background: GS.headerBg, borderBottom: `1px solid ${GS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: GS.text }}>Filtrar: {label}</span>
        <button onMouseDown={e => { e.preventDefault(); onClose() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GS.textMuted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>✕</button>
      </div>
      <div style={{ padding: '6px 8px', borderBottom: `1px solid ${GS.border}`, display: 'flex', gap: 4 }}>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(true) }}
          style={{ flex: 1, padding: '5px 6px', fontSize: 11, border: `1px solid ${sortAZ ? COR : GS.border}`, borderRadius: 4, background: sortAZ ? `${COR}15` : '#fff', color: sortAZ ? COR : GS.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: sortAZ ? 700 : 400 }}>
          <ChevronUp size={11} /> A → Z
        </button>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(false) }}
          style={{ flex: 1, padding: '5px 6px', fontSize: 11, border: `1px solid ${!sortAZ ? COR : GS.border}`, borderRadius: 4, background: !sortAZ ? `${COR}15` : '#fff', color: !sortAZ ? COR : GS.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: !sortAZ ? 700 : 400 }}>
          <ChevronDown size={11} /> Z → A
        </button>
      </div>
      <div style={{ padding: '6px 8px', borderBottom: `1px solid ${GS.border}` }}>
        <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="🔍 Buscar..."
          style={{ width: '100%', padding: '5px 8px', fontSize: 11, border: `1px solid ${GS.border}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box' as const }} />
      </div>
      <div style={{ padding: '5px 12px', borderBottom: `1px solid ${GS.border}`, background: '#fafafa' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: GS.text, fontWeight: 600 }}>
          <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected }}
            onChange={() => setSelected(allSelected ? [] : [...allOpts])}
            style={{ width: 14, height: 14, accentColor: COR, cursor: 'pointer' }} />
          Selecionar tudo ({allOpts.length})
        </label>
      </div>
      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
        {visible.map(o => (
          <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: GS.text }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0f4ff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)}
              style={{ width: 14, height: 14, accentColor: COR, cursor: 'pointer' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o}</span>
          </label>
        ))}
        {visible.length === 0 && <p style={{ padding: '10px 12px', fontSize: 11, color: GS.textMuted, margin: 0 }}>Nenhum valor encontrado</p>}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${GS.border}`, display: 'flex', gap: 6, justifyContent: 'flex-end', background: '#fafafa' }}>
        <button onMouseDown={e => { e.preventDefault(); onClose() }}
          style={{ padding: '5px 14px', fontSize: 12, border: `1px solid ${GS.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', color: GS.text }}>
          Cancelar
        </button>
        <button onMouseDown={e => { e.preventDefault(); onApply(selected.length === allOpts.length ? [] : selected); onClose() }}
          style={{ padding: '5px 14px', fontSize: 12, border: 'none', borderRadius: 4, background: COR, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
          OK
        </button>
      </div>
    </div>
  )
}

function InfluenciadoresSection() {
  const tableRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tableRef.current; if (!el) return
    function onWheel(e: WheelEvent) { if (e.shiftKey) { e.preventDefault(); if (el) el.scrollLeft += e.deltaY } }
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const [rows, setRows] = useState<InfluRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editCell, setEditCell] = useState<{ id: string; key: keyof InfluRow } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [colFilters, setColFilters] = useState<Partial<Record<keyof InfluRow, string[]>>>({})
  const [openFilterCol, setOpenFilterCol] = useState<keyof InfluRow | null>(null)
  const [search, setSearch] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [editOrcamento, setEditOrcamento] = useState(false)
  const [filterAno, setFilterAno] = useState('Todos')
  const [filterMes, setFilterMes] = useState('Todos')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<keyof InfluRow | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetch('/api/vistas-influenciadores').then(r => r.json()).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
    try { const s = localStorage.getItem('vistas-orcamento-mensal'); if (s) setOrcamento(s) } catch {}
    const now = new Date()
    setFilterAno(String(now.getFullYear()))
    setFilterMes(MES_NOMES[now.getMonth() + 1] || 'Todos')
  }, [])

  const mesAtual = MES_NOMES[new Date().getMonth() + 1] || ''
  const anos = ['Todos', ...Array.from(new Set(rows.map(r => r.ano).filter(Boolean))).sort()]
  const meses = ['Todos', ...Array.from(new Set(rows.map(r => r.mes).filter(Boolean))).sort()]

  const rowsPeriodo = rows.filter(r => {
    if (filterAno !== 'Todos' && r.ano !== filterAno) return false
    if (filterMes !== 'Todos' && r.mes !== filterMes) return false
    return true
  })

  let filtered = rowsPeriodo.filter(r => {
    for (const [key, vals] of Object.entries(colFilters)) {
      if (vals && vals.length > 0 && !vals.includes(r[key as keyof InfluRow] || '')) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return r.perfil?.toLowerCase().includes(q) || r.observacoes?.toLowerCase().includes(q) || r.cupom?.toLowerCase().includes(q)
    }
    return true
  })

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] || ''; const vb = b[sortCol] || ''
      const cmp = va.localeCompare(vb, 'pt-BR', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const totalPeriodo = rowsPeriodo.length
  const contratadosPeriodo = rowsPeriodo.filter(r => r.status?.toLowerCase() === 'contratado').length
  const naoContratadosPeriodo = totalPeriodo - contratadosPeriodo
  const totalUtilizado = rowsPeriodo.filter(r => r.status?.toLowerCase() === 'contratado').reduce((s, r) => s + parseValor(r.valor_trabalho) + parseValor(r.valor_hospedagem), 0)
  const orcamentoNum = parseValor(orcamento)
  const saldo = orcamentoNum - totalUtilizado
  const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  async function commitEdit(id: string, key: keyof InfluRow, val: string) {
    setSaving(true)
    await fetch('/api/vistas-influenciadores', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [key]: val }) })
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
    setEditCell(null); setSaving(false)
  }

  async function addRow() {
    const now = new Date()
    const newRow: Omit<InfluRow, 'id'> = {
      ano: filterAno !== 'Todos' ? filterAno : String(now.getFullYear()),
      mes: filterMes !== 'Todos' ? filterMes : mesAtual,
      categoria: 'Influ', perfil: 'Novo influenciador', link_perfil: '', seguidores: '',
      contato: '', status: 'Aguardando', valor_trabalho: '', valor_hospedagem: '',
      data_visita: '', data_contratacao: '', data_pagamento: '', cupom: '',
      validade_cupom: '', data_post: '', link_post: '', conversoes: '',
      valor_reservas: '', conteudo_orcado: '', observacoes: '',
    }
    const res = await fetch('/api/vistas-influenciadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) })
    const row = await res.json()
    setRows(prev => [...prev, row]); setSelectedRow(row.id)
  }

  async function deleteRow(id: string) {
    if (!confirm('Remover esta linha?')) return
    await fetch('/api/vistas-influenciadores', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setRows(prev => prev.filter(r => r.id !== id)); setSelectedRow(null)
  }

  async function duplicateRow(row: InfluRow) {
    const { id, ...rest } = row
    const res = await fetch('/api/vistas-influenciadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rest) })
    const newRow = await res.json()
    setRows(prev => [...prev, newRow]); setSelectedRow(newRow.id)
  }

  function saveOrcamento(val: string) {
    setOrcamento(val)
    try { localStorage.setItem('vistas-orcamento-mensal', val) } catch {}
    setEditOrcamento(false)
  }

  function toggleSort(key: keyof InfluRow) {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(key); setSortDir('asc') }
  }

  const GS = {
    headerBg: '#f8f9fa', headerBorder: '#dadce0', cellBorder: '#e2e3e4',
    rowHover: '#f6f8ff', rowSelected: '#e8f0fe', rowAlt: '#fafbfc',
    text: '#202124', textMuted: '#5f6368', inputBorder: '#4285f4',
  }

  const cellBase: React.CSSProperties = {
    padding: '4px 6px', minHeight: 28, maxHeight: 80,
    borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`,
    fontSize: 12, color: GS.text, overflow: 'hidden', verticalAlign: 'top',
    cursor: 'cell', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '18px',
  }

  const activeFiltersCount = Object.values(colFilters).filter(v => v && v.length > 0).length

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.mutedFg, fontSize: 13 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando influenciadores...</div>

  return (
    <div>
      <div style={{ background: `${COR}08`, border: `1px solid ${COR}25`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: COR, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtrar por período</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: T.mutedFg, fontWeight: 600 }}>Ano</span>
            <select value={filterAno} onChange={e => setFilterAno(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, outline: 'none', background: '#fff', color: GS.text, minWidth: 80 }}>
              {anos.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: T.mutedFg, fontWeight: 600 }}>Mês</span>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)} style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, outline: 'none', background: '#fff', color: GS.text, minWidth: 130 }}>
              {meses.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <button onClick={() => { setFilterAno('Todos'); setFilterMes('Todos') }} style={{ marginTop: 14, padding: '4px 10px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', color: T.mutedFg }}>
            Todos
          </button>
          <span style={{ marginTop: 14, fontSize: 11, color: T.mutedFg }}>{rowsPeriodo.length} registros</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: String(totalPeriodo), color: GS.text },
          { label: 'Contratados', value: String(contratadosPeriodo), color: '#065f46' },
          { label: 'Não contratados', value: String(naoContratadosPeriodo), color: '#991b1b' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: `1px solid ${GS.cellBorder}`, borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 11, color: GS.textMuted }}>{k.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</span>
          </div>
        ))}
        <div style={{ background: '#fff', border: `1px solid ${GS.cellBorder}`, borderRadius: 6, padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontSize: 10, color: GS.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Orçamento</div>
            {editOrcamento ? (
              <input autoFocus defaultValue={orcamento} onBlur={e => saveOrcamento(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveOrcamento((e.target as HTMLInputElement).value) }}
                style={{ width: 100, padding: '2px 6px', fontSize: 13, border: `2px solid ${GS.inputBorder}`, borderRadius: 3, outline: 'none' }} placeholder="ex: 8200" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: COR }}>{orcamentoNum ? `R$ ${fmtBRL(orcamentoNum)}` : '—'}</span>
                <button onClick={() => setEditOrcamento(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: GS.textMuted, padding: 0 }}><Pencil size={11} /></button>
              </div>
            )}
          </div>
          <div style={{ borderLeft: `1px solid ${GS.cellBorder}`, paddingLeft: 12 }}>
            <div style={{ fontSize: 10, color: GS.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Utilizado</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#991b1b' }}>R$ {fmtBRL(totalUtilizado)}</span>
          </div>
          {orcamentoNum > 0 && (
            <div style={{ borderLeft: `1px solid ${GS.cellBorder}`, paddingLeft: 12 }}>
              <div style={{ fontSize: 10, color: GS.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Saldo</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: saldo >= 0 ? '#065f46' : '#991b1b' }}>R$ {fmtBRL(Math.abs(saldo))}{saldo < 0 ? ' ⚠️' : ''}</span>
            </div>
          )}
          {orcamentoNum > 0 && (
            <div style={{ borderLeft: `1px solid ${GS.cellBorder}`, paddingLeft: 12, minWidth: 120 }}>
              <div style={{ fontSize: 10, color: GS.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Utilização <span style={{ fontWeight: 700, color: saldo >= 0 ? '#065f46' : '#991b1b' }}>{((totalUtilizado / orcamentoNum) * 100).toFixed(0)}%</span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, (totalUtilizado / orcamentoNum) * 100)}%`, background: saldo >= 0 ? '#10b981' : '#ef4444' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: GS.headerBg, border: `1px solid ${GS.headerBorder}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar perfil, cupom..."
          style={{ padding: '4px 8px', fontSize: 12, border: `1px solid ${GS.headerBorder}`, borderRadius: 4, outline: 'none', background: '#fff', color: GS.text, width: 200 }} />
        <span style={{ fontSize: 11, color: GS.textMuted }}>{filtered.length} linha{filtered.length !== 1 ? 's' : ''}</span>
        {activeFiltersCount > 0 && (
          <button onClick={() => setColFilters({})} style={{ padding: '3px 8px', background: '#fff3cd', border: '1px solid #fcd34d', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#92400e' }}>
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''} ✕
          </button>
        )}
        {sortCol && (
          <button onClick={() => setSortCol(null)} style={{ padding: '3px 8px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#0369a1' }}>
            {INFLU_COLS.find(c => c.key === sortCol)?.label} {sortDir === 'asc' ? '↑ A-Z' : '↓ Z-A'} ✕
          </button>
        )}
        {selectedRow && (
          <>
            <button onClick={() => { const r = filtered.find(r => r.id === selectedRow); if (r) duplicateRow(r) }}
              style={{ padding: '3px 8px', background: '#fff', border: `1px solid ${GS.headerBorder}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', color: GS.text, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Copy size={11} /> Duplicar
            </button>
            <button onClick={() => deleteRow(selectedRow)}
              style={{ padding: '3px 8px', background: '#fff', border: '1px solid #fca5a5', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Trash2 size={11} /> Excluir
            </button>
          </>
        )}
        <button onClick={addRow} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: COR, color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={12} /> Nova linha
        </button>
      </div>

      <div ref={tableRef} style={{ overflowX: 'auto', border: `1px solid ${GS.headerBorder}`, borderRadius: '0 0 6px 6px', maxHeight: 560, overflowY: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 36 }} />
            {INFLU_COLS.map(c => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: GS.headerBg }}>
              <th style={{ width: 36, padding: '6px 4px', borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, textAlign: 'center', fontSize: 11, color: GS.textMuted, fontWeight: 600 }}>#</th>
              {INFLU_COLS.map(c => {
                const isFiltered = !!(colFilters[c.key] && colFilters[c.key]!.length > 0)
                const isSorted = sortCol === c.key
                const isOpen = openFilterCol === c.key
                return (
                  <th key={c.key} style={{ padding: 0, borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, background: isFiltered ? `${COR}08` : GS.headerBg, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch', height: 32 }}>
                      <button onClick={() => toggleSort(c.key)}
                        style={{ flex: 1, padding: '0 4px 0 8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11, color: isSorted ? COR : isFiltered ? COR : GS.textMuted, fontWeight: isSorted || isFiltered ? 700 : 600, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
                        {isFiltered && <span style={{ fontSize: 9, background: COR, color: '#fff', borderRadius: 10, padding: '1px 4px', flexShrink: 0 }}>●</span>}
                        {isSorted ? (sortDir === 'asc' ? <ChevronUp size={10} color={COR} /> : <ChevronDown size={10} color={COR} />) : <ArrowUpDown size={9} style={{ opacity: 0.25, flexShrink: 0 }} />}
                      </button>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpenFilterCol(isOpen ? null : c.key) }}
                          style={{ width: 24, height: 32, background: isOpen ? `${COR}20` : isFiltered ? `${COR}15` : 'none', border: 'none', borderLeft: `1px solid ${GS.headerBorder}`, cursor: 'pointer', color: isFiltered || isOpen ? COR : GS.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                          ▼
                        </button>
                        {isOpen && (
                          <ColFilterPopup colKey={c.key} label={c.label} allRows={rowsPeriodo}
                            active={colFilters[c.key] || []}
                            onApply={vals => setColFilters(prev => vals.length ? { ...prev, [c.key]: vals } : (({ [c.key]: _, ...rest }) => rest)(prev))}
                            onClose={() => setOpenFilterCol(null)} />
                        )}
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const isSelected = selectedRow === row.id
              const isAlt = i % 2 === 1
              const bg = isSelected ? GS.rowSelected : isAlt ? GS.rowAlt : '#fff'
              return (
                <tr key={row.id} onClick={() => setSelectedRow(isSelected ? null : row.id)}
                  style={{ background: bg, transition: 'background 0.05s' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = GS.rowHover }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = bg }}
                >
                  <td style={{ ...cellBase, width: 36, textAlign: 'center', color: GS.textMuted, fontSize: 11, cursor: 'default', whiteSpace: 'nowrap', background: bg, padding: '6px 4px' }}>{i + 1}</td>
                  {INFLU_COLS.map(col => {
                    const val = row[col.key] || ''
                    const isEditing = editCell?.id === row.id && editCell?.key === col.key
                    if (isEditing) return (
                      <td key={col.key} style={{ padding: 0, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, verticalAlign: 'top' }}>
                        <textarea autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                          onBlur={() => setTimeout(() => commitEdit(row.id, col.key, editVal), 100)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                            if (e.key === 'Escape') setEditCell(null)
                            if (e.key === 'Tab') { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                          }}
                          style={{ width: '100%', minHeight: 28, maxHeight: 120, padding: '4px 6px', fontSize: 12, border: `2px solid ${GS.inputBorder}`, outline: 'none', background: '#fff', color: GS.text, boxSizing: 'border-box', resize: 'vertical', lineHeight: '18px', fontFamily: 'inherit' }} />
                      </td>
                    )
                    if (col.key === 'status') return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: '3px 4px', whiteSpace: 'nowrap' }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ ...statusStyle(val), width: '100%', padding: '2px 6px', fontSize: 11, fontWeight: 600, borderRadius: 3, cursor: 'pointer', outline: 'none', height: 22 }}>
                          <option value="">—</option>
                          <option value="Contratado">Contratado</option>
                          <option value="Não contratado">Não contratado</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Sem resposta">Sem resposta</option>
                        </select>
                      </td>
                    )
                    if (col.key === 'categoria') return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: '3px 4px', whiteSpace: 'nowrap' }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ width: '100%', padding: '2px 4px', fontSize: 11, fontWeight: 600, borderRadius: 3, cursor: 'pointer', outline: 'none', height: 22, background: `${COR}12`, color: COR, border: `1px solid ${COR}30` }}>
                          <option value="">—</option>
                          <option value="Influ">Influ</option>
                          <option value="Perfil">Perfil</option>
                          <option value="Página">Página</option>
                        </select>
                      </td>
                    )
                    if (col.type === 'link' && val?.startsWith('http')) return (
                      <td key={col.key} style={{ ...cellBase, background: bg, textAlign: 'center', whiteSpace: 'nowrap' }}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        <a href={val.split('\n')[0]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ color: '#1a73e8', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <Link2 size={10} /> ver
                        </a>
                      </td>
                    )
                    return (
                      <td key={col.key} style={{ ...cellBase, background: bg }} title={val}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        {val ? <TextWithLinks text={val} style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} /> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr style={{ background: '#fafafa' }} onClick={addRow}>
              <td style={{ height: 28, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, textAlign: 'center', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>+</td>
              {INFLU_COLS.map(c => <td key={c.key} style={{ height: 28, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, cursor: 'pointer' }} />)}
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: GS.textMuted, marginTop: 4 }}>
        Clique para selecionar · Duplo clique para editar · Enter para confirmar · Shift+Enter para nova linha · Tab para próxima célula · ▼ para filtrar
      </p>
    </div>
  )
}

function SocialMediaSection() {
  const [data, setData] = useState<{
    total_seguidores: number | null; ganho_hoje: number | null; ganho_mes: number | null
    historico: { data: string; total_seguidores: number; ganho_dia: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<7 | 14 | 30 | 'mes'>('mes')
  const [filterMes, setFilterMes] = useState<string | null>(null)
  const [ganhoPeriodoReportei, setGanhoPeriodoReportei] = useState<number | null>(null)
  const [loadingGanho, setLoadingGanho] = useState(false)
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)

  useEffect(() => {
    fetch("/api/seguidores-vistas").then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Busca ganho direto do Reportei sempre que período ou mês mudar (exceto "mês atual" que já vem da rota principal)
  useEffect(() => {
    if (periodo === 'mes' && !filterMes) {
      setGanhoPeriodoReportei(null)
      return
    }
    setLoadingGanho(true)
    setGanhoPeriodoReportei(null)

    let url: string
    if (filterMes) {
      url = `/api/seguidores-vistas-mensal?mes=${filterMes}`
    } else {
      const fim = new Date().toISOString().split('T')[0]
      const ini = new Date(); ini.setDate(ini.getDate() - (periodo as number))
      url = `/api/seguidores-vistas-mensal?start=${ini.toISOString().split('T')[0]}&end=${fim}`
    }

    fetch(url)
      .then(r => r.json())
      .then(d => setGanhoPeriodoReportei(d.ganho ?? null))
      .catch(() => setGanhoPeriodoReportei(null))
      .finally(() => setLoadingGanho(false))
  }, [periodo, filterMes])

  const total = data?.total_seguidores ?? null
  const ganhoMes = data?.ganho_mes ?? null
  const ganhoHoje = data?.ganho_hoje ?? null
  const historicoCompleto = data?.historico ?? []

  const historicoFiltrado = (() => {
    if (filterMes) return historicoCompleto.filter(d => d.data.slice(0, 7) === filterMes)
    if (periodo === 'mes') {
      const inicioMes = new Date().toISOString().slice(0, 7) + '-01'
      return historicoCompleto.filter(d => d.data >= inicioMes)
    }
    const corte = new Date(); corte.setDate(corte.getDate() - (periodo as number))
    return historicoCompleto.filter(d => d.data >= corte.toISOString().split('T')[0])
  })()

  // Ganho: sempre do Reportei — para mês atual usa ganho_mes da rota principal
  const ganhoPeriodo = (() => {
    if (!filterMes && periodo === 'mes') return ganhoMes
    return ganhoPeriodoReportei
  })()

  const totalSeguidoresPeriodo = (() => {
    const ultimo = historicoFiltrado[historicoFiltrado.length - 1]
    if (ultimo?.total_seguidores) return ultimo.total_seguidores
    if (total === null || !ultimo?.data) return null
    const ganhoApos = historicoCompleto
      .filter(d => d.data > ultimo.data)
      .reduce((s, d) => s + (d.ganho_dia || 0), 0)
    return total - ganhoApos
  })()

  const faltaMeta = Math.max(0, META_MENSAL - (ganhoMes ?? 0))
  const progressoMeta = Math.min(100, ((ganhoMes ?? 0) / META_MENSAL) * 100)

  const maxGanho = Math.max(...historicoFiltrado.map(d => d.ganho_dia || 0), 1)
  const W = 680, H = 140, PL = 36, PB = 28, PT = 8, PR = 8
  const cW = W - PL - PR, cH = H - PT - PB
  const n = historicoFiltrado.length
  const barW = n > 1 ? Math.max(6, (cW / n) - 3) : 20
  const xs = (i: number) => n > 1 ? PL + (i / (n - 1)) * cW : PL + cW / 2
  const ys = (v: number) => PT + cH - (v / maxGanho) * cH

  const periodos: { label: string; val: 7 | 14 | 30 | 'mes' }[] = [
    { label: 'Mês atual', val: 'mes' }, { label: '7 dias', val: 7 }, { label: '14 dias', val: 14 }, { label: '30 dias', val: 30 },
  ]

  const MESES_PT: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  }

  const mesesDisponiveis = Array.from(new Set(historicoCompleto.map(d => d.data.slice(0, 7)))).sort()

  const periodoLabel = (() => {
    if (filterMes) return `${MESES_PT[filterMes.slice(5)]}/${filterMes.slice(2, 4)}`
    if (periodo === 'mes') {
      const hoje = new Date()
      const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      return `${fmt(ini)} — ${fmt(hoje)}`
    }
    const hoje = new Date()
    const ini = new Date(); ini.setDate(hoje.getDate() - (periodo as number))
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    return `${fmt(ini)} — ${fmt(hoje)}`
  })()

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 12px", borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Seguidores</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Total de Seguidores", value: loading ? "—" : total?.toLocaleString("pt-BR") ?? "—", color: COR },
          { label: "Ganho Hoje", value: loading ? "—" : ganhoHoje != null ? `+${ganhoHoje.toLocaleString("pt-BR")}` : "—", color: "#10b981" },
          { label: "Meta Mensal", value: `+${META_MENSAL.toLocaleString("pt-BR")}`, color: "#f59e0b" },
          { label: "Ganho no Mês", value: loading ? "—" : ganhoMes != null ? `+${ganhoMes.toLocaleString("pt-BR")}` : "—", color: COR },
          { label: "Falta para Meta", value: loading ? "—" : faltaMeta > 0 ? faltaMeta.toLocaleString("pt-BR") : "✅ Meta batida!", color: faltaMeta > 0 ? "#ef4444" : "#10b981" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, margin: 0 }}>
              {loading && kpi.label !== "Meta Mensal" ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {!loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.mutedFg, marginBottom: 4 }}>
            <span>Progresso para meta de +{META_MENSAL.toLocaleString("pt-BR")} no mês</span>
            <span style={{ fontWeight: 700, color: progressoMeta >= 100 ? "#10b981" : COR }}>{progressoMeta.toFixed(1)}%</span>
          </div>
          <div style={{ background: T.border, borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${progressoMeta}%`, background: progressoMeta >= 100 ? "#10b981" : COR, transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      <div style={{ background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ganho diário</p>
            {!loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                <div style={{ background: `${COR}12`, border: `1px solid ${COR}30`, borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: T.mutedFg }}>{periodoLabel}:</span>
                  {loadingGanho
                    ? <Loader2 size={13} color={COR} style={{ animation: "spin 1s linear infinite" }} />
                    : <span style={{ fontSize: 14, fontWeight: 800, color: COR }}>
                        {ganhoPeriodo != null ? `+${ganhoPeriodo.toLocaleString("pt-BR")}` : "—"}
                      </span>
                  }
                </div>
                {totalSeguidoresPeriodo !== null && (
                  <div style={{ background: `${COR}08`, border: `1px solid ${COR}20`, borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.mutedFg }}>Total no período:</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: COR }}>{totalSeguidoresPeriodo.toLocaleString("pt-BR")}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            {mesesDisponiveis.length > 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {mesesDisponiveis.map(m => {
                  const [ano, mes] = m.split('-')
                  const label = `${MESES_PT[mes]}/${ano.slice(2)}`
                  const ativo = filterMes === m
                  return (
                    <button key={m} onClick={() => { setFilterMes(ativo ? null : m); setTooltip(null) }}
                      style={{ padding: "3px 9px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", fontFamily: T.font, border: `1px solid ${ativo ? COR : T.border}`, background: ativo ? COR : "transparent", color: ativo ? "#fff" : T.mutedFg, transition: "all 0.12s" }}>
                      {label}
                    </button>
                  )
                })}
                {filterMes && (
                  <button onClick={() => { setFilterMes(null); setTooltip(null) }}
                    style={{ padding: "3px 7px", fontSize: 11, borderRadius: 6, cursor: "pointer", border: `1px solid ${T.border}`, background: "transparent", color: T.mutedFg, fontFamily: T.font }}>
                    ✕
                  </button>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              {periodos.map(p => (
                <button key={String(p.val)} onClick={() => { setPeriodo(p.val); setFilterMes(null); setTooltip(null) }}
                  style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: "pointer", fontFamily: T.font, border: `1px solid ${!filterMes && periodo === p.val ? COR : T.border}`, background: !filterMes && periodo === p.val ? COR : "transparent", color: !filterMes && periodo === p.val ? "#fff" : T.mutedFg }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {historicoFiltrado.length === 0 ? (
          <p style={{ fontSize: 12, color: T.mutedFg, fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
            Sem dados para o período. O histórico é preenchido automaticamente ao abrir a página.
          </p>
        ) : (
          <div style={{ overflow: "hidden", position: "relative" }} onMouseLeave={() => setTooltip(null)}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
              onMouseMove={e => {
                const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
                const mx = ((e.clientX - rect.left) / rect.width) * W
                let closest = 0; let minD = Infinity
                historicoFiltrado.forEach((_, i) => { const d = Math.abs(xs(i) - mx); if (d < minD) { minD = d; closest = i } })
                if (minD < barW * 2) setTooltip({ idx: closest, x: xs(closest), y: ys(historicoFiltrado[closest]?.ganho_dia || 0) })
                else setTooltip(null)
              }}>
              <defs><clipPath id="chart-clip"><rect x={PL} y={PT} width={cW} height={cH} /></clipPath></defs>
              {[0, Math.round(maxGanho / 2), maxGanho].map(v => (
                <g key={v}>
                  <line x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke={T.border} strokeWidth={0.5} />
                  <text x={PL - 4} y={ys(v) + 4} fontSize={9} fill={T.mutedFg ?? "#888"} textAnchor="end">{v}</text>
                </g>
              ))}
              <g clipPath="url(#chart-clip)">
                {historicoFiltrado.map((d, i) => {
                  const ganho = d.ganho_dia || 0
                  const bh = Math.max(2, (ganho / maxGanho) * cH)
                  const isHoje = d.data === new Date().toISOString().split("T")[0]
                  return (
                    <rect key={d.data} x={xs(i) - barW / 2} y={ys(ganho)} width={barW} height={bh}
                      fill={tooltip?.idx === i ? "#5B21B6" : isHoje ? COR : `${COR}60`} rx={2} style={{ transition: "fill 0.1s" }} />
                  )
                })}
              </g>
              {tooltip && <line x1={xs(tooltip.idx)} x2={xs(tooltip.idx)} y1={PT} y2={H - PB} stroke={COR} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />}
              {historicoFiltrado.length <= 20
                ? historicoFiltrado.map((d, i) => (
                  <text key={d.data} x={xs(i)} y={H - 6} fontSize={9} fill={tooltip?.idx === i ? COR : T.mutedFg ?? "#888"} fontWeight={tooltip?.idx === i ? 700 : 400} textAnchor="middle">{d.data.slice(8)}</text>
                ))
                : [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor(3 * n / 4), n - 1].map(i => (
                  <text key={i} x={xs(i)} y={H - 6} fontSize={9} fill={T.mutedFg ?? "#888"} textAnchor="middle">
                    {historicoFiltrado[i]?.data.slice(8)}/{historicoFiltrado[i]?.data.slice(5, 7)}
                  </text>
                ))
              }
            </svg>
            {tooltip && (() => {
              const d = historicoFiltrado[tooltip.idx]
              const ganho = d?.ganho_dia || 0
              const dataFmt = d?.data.split("-").reverse().join("/") ?? ""
              const isHoje = d?.data === new Date().toISOString().split("T")[0]
              return (
                <div style={{ position: "absolute", top: 4, left: `${(xs(tooltip.idx) / W) * 100}%`, transform: tooltip.idx > n * 0.65 ? "translateX(-110%)" : "translateX(10px)", background: T.card, border: `1.5px solid ${COR}50`, borderRadius: 10, padding: "10px 14px", pointerEvents: "none", zIndex: 10, boxShadow: "0 4px 20px rgba(124,58,237,0.15)", minWidth: 150 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: T.mutedFg, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {dataFmt}
                    {isHoje && <span style={{ background: COR, color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>hoje</span>}
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COR, lineHeight: 1 }}>+{ganho.toLocaleString("pt-BR")}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: T.mutedFg }}>seguidores ganhos</p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
      <div style={{ marginTop: 28 }}>
  <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 12px", borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>Influenciadores</p>
  <InfluenciadoresSection />
</div>
<div style={{ marginTop: 32 }}>
  <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 16px", borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
    Calendário de Conteúdo
  </p>
  <CalendarioConteudoVistas />
</div>
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
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: T.muted, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: T.mutedFg }}>⚠️ Dados de reservas não disponíveis no ambiente local.</span>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Hoje", value: loadingRes ? "—" : String(today), color: statusColor(today, META_DIA) },
                  { label: "Média 30 dias", value: loadingRes ? "—" : fmt2(avg30r), color: statusColor(avg30r, META_DIA) },
                  { label: "Meta diária", value: String(META_DIA), color: "#10b981" },
                  { label: "Status", value: loadingRes ? "—" : avg30r >= META_DIA ? "✔ Acima da meta" : "Abaixo da meta", color: statusColor(avg30r, META_DIA) },
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