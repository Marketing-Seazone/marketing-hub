"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2, AlertCircle, Plus, Trash2, Check, Calendar, Link2, AlertTriangle, Pencil } from "lucide-react"
import { T } from "@/lib/constants"
import type { DayData } from "@/app/api/vistas-reservas/route"
import type { Task } from "@/app/api/vistas-checklist/route"

const META_DIA = 7
const COR = "#7C3AED" // roxo Vistas

/* ── helpers ── */
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

/* ── Mini gráfico SVG ── */
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
      {/* Grid */}
      {[0, META_DIA / 2, META_DIA, META_DIA * 1.5].map(v => (
        <line key={v} x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)}
          stroke={T.border} strokeWidth={0.5} />
      ))}
      {/* Bars */}
      {days.map((d, i) => {
        const bh = Math.max(2, (d.count / maxV) * cH)
        const fill = d.count >= META_DIA ? "#10b98133" : `${T.destructive}22`
        const stroke = d.count >= META_DIA ? "#10b981" : T.destructive
        return (
          <rect key={i}
            x={xs(i) - barW / 2} y={ys(d.count)} width={barW} height={bh}
            fill={fill} stroke={stroke} strokeWidth={0.5} rx={1}>
            <title>{fmtDate(d.date)}: {d.count} reserva{d.count !== 1 ? "s" : ""}</title>
          </rect>
        )
      })}
      {/* Meta line */}
      <line x1={PL} x2={W - PR} y1={metaY} y2={metaY}
        stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={W - PR + 3} y={metaY + 4} fontSize={9} fill="#10b981" fontWeight={700}>7</text>
      {/* Moving avg line */}
      <path d={avgPath} fill="none" stroke={COR} strokeWidth={2} strokeLinejoin="round" />
      {/* Axis labels */}
      {[0, 7, 14, 21, 29].map(i => (
        <text key={i} x={xs(i)} y={H - 4} fontSize={8} fill={T.mutedFg ?? "#888"} textAnchor="middle">
          {fmtDate(days[i]?.date ?? "")}
        </text>
      ))}
    </svg>
  )
}

/* ── Checklist ── */
const SECTION_META: Record<string, { label: string; live: string | null }> = {
  "midia-paga": { label: "Mídia Paga — Retargeting", live: "25 abr" },
  "website":    { label: "Website — Melhorias de Conversão", live: "30 abr" },
  "geral":      { label: "Geral", live: null },
}
const SECTION_ORDER = ["midia-paga", "website", "geral"]

const SEED: Omit<Task, "id" | "done" | "createdAt">[] = [
  // Mídia Paga
  { title: "Finalizar os 4 briefings de criativo", notes: "Urgência e Emocional", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Enviar briefings para a head aprovar", notes: "Sinalizar urgência de prazo", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Head aprova e abre chamado para criação", notes: "Sinalizar urgência de prazo", deadline: "2026-04-10", link: null, section: "midia-paga", isWarning: false },
  { title: "Time de criação produz os 4 criativos", notes: "4 dias úteis — entrega prevista: 16/04", deadline: "2026-04-16", link: null, section: "midia-paga", isWarning: false },
  { title: "Aprovação dos criativos — responsável + head", notes: "Se houver ajustes, retorno em 22/04", deadline: "2026-04-17", link: null, section: "midia-paga", isWarning: false },
  { title: "FERIADO — Tiradentes", notes: "Próximo dia útil: 22/04", deadline: "2026-04-21", link: null, section: "midia-paga", isWarning: true },
  { title: "Enviar criativos aprovados para o growth publicar", notes: "Growth configura campanhas no Meta Ads com segmentações", deadline: "2026-04-22", link: null, section: "midia-paga", isWarning: false },
  { title: "Campanhas de retargeting no ar", notes: "Monitorar CTR e custo por clique nas primeiras 48h", deadline: "2026-04-25", link: null, section: "midia-paga", isWarning: false },
  // Website
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
        // Seed automático na primeira vez
        const seeded: Task[] = []
        for (const t of SEED) {
          const res = await fetch("/api/vistas-checklist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t),
          })
          if (res.ok) seeded.push(await res.json())
        }
        setTasks(seeded)
      } else {
        setTasks(list)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function sortAll(list: Task[]) {
    return [...list].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const da = a.deadline || "9999"
      const db = b.deadline || "9999"
      return da.localeCompare(db)
    })
  }

  const grouped: Record<string, Task[]> = {}
  for (const s of SECTION_ORDER) {
    grouped[s] = sortAll(
      tasks.filter(t => s === "geral" ? (!t.section || t.section === "geral") : t.section === s)
    )
  }

  async function addTask() {
    if (!form.title.trim() || !addingSection) return
    setSaving(true)
    const res = await fetch("/api/vistas-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, section: addingSection }),
    })
    const task = await res.json()
    setTasks(prev => [...prev, task])
    setForm(EMPTY_ADD)
    setAddingSection(null)
    setSaving(false)
  }

  async function toggle(id: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    await fetch("/api/vistas-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done }),
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch("/api/vistas-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    })
    const updated = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    setEditId(null)
    setSaving(false)
  }

  async function remove(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch("/api/vistas-checklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const totalDone = tasks.filter(t => t.done && !t.isWarning).length
  const totalReal = tasks.filter(t => !t.isWarning).length

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: T.mutedFg, fontSize: 13 }}>
      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
      Carregando plano de ação...
    </div>
  )

  const inputStyle = {
    padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
    fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted,
    outline: "none",
  }

  return (
    <div>
      {/* Cabeçalho global */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: T.mutedFg }}>
            Período: 10 a 30 de abril · Objetivo: todas as ações de mídia paga e website no ar
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.mutedFg }}>
            <Check size={12} color={COR} style={{ display: "inline", marginRight: 4 }} />
            {totalDone} de {totalReal} concluídas
          </p>
        </div>
      </div>

      {/* Seções */}
      {SECTION_ORDER.map(sKey => {
        const secTasks = grouped[sKey]
        const meta = SECTION_META[sKey]
        if (secTasks.length === 0 && addingSection !== sKey) return null
        const doneCount = secTasks.filter(t => t.done && !t.isWarning).length
        const totalCount = secTasks.filter(t => !t.isWarning).length

        return (
          <div key={sKey} style={{ marginBottom: 28 }}>
            {/* Header da seção */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: `2px solid ${COR}30`, paddingBottom: 8, marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.cardFg }}>{meta.label}</span>
                {meta.live && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: "#10b981",
                    background: "#10b98115", padding: "2px 8px", borderRadius: 20,
                  }}>
                    Live: {meta.live}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>{doneCount}/{totalCount}</span>
            </div>

            {/* Tarefas */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {secTasks.map(task => {
                if (task.isWarning) {
                  return (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "8px 0", borderBottom: `1px solid ${T.border}`,
                    }}>
                      <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{task.title}</span>
                        {task.notes && (
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: T.mutedFg }}>{task.notes}</p>
                        )}
                      </div>
                      {task.deadline && (
                        <span style={{ fontSize: 11, color: "#f59e0b", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {fmtDate(task.deadline)}
                        </span>
                      )}
                    </div>
                  )
                }

                if (editId === task.id) {
                  return (
                    <div key={task.id} style={{
                      padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                      background: `${COR}06`, borderRadius: 6,
                    }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, padding: "0 4px" }}>
                        <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          autoFocus style={{ ...inputStyle, flex: "1 1 200px" }} />
                        <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Observação" style={{ ...inputStyle, flex: "1 1 180px" }} />
                        <input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                          style={inputStyle} />
                        <input value={editForm.link} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))}
                          placeholder="Link (opcional)" style={{ ...inputStyle, flex: "1 1 160px" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8, padding: "0 4px" }}>
                        <button onClick={() => saveEdit(task.id)} style={{
                          padding: "5px 14px", background: COR, color: "#fff", border: "none",
                          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                        }}>{saving ? "Salvando..." : "Salvar"}</button>
                        <button onClick={() => setEditId(null)} style={{
                          padding: "5px 12px", background: "transparent", color: T.mutedFg,
                          border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font,
                        }}>Cancelar</button>
                        <button onClick={() => remove(task.id)} style={{
                          marginLeft: "auto", padding: "5px 8px", background: "transparent",
                          color: T.destructive, border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "9px 0", borderBottom: `1px solid ${T.border}`,
                    opacity: task.done ? 0.5 : 1, transition: "opacity 0.15s",
                  }}
                    onMouseEnter={e => { (e.currentTarget.querySelector(".row-actions") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".row-actions") as HTMLElement).style.opacity = "1") }}
                    onMouseLeave={e => { (e.currentTarget.querySelector(".row-actions") as HTMLElement | null)?.style && ((e.currentTarget.querySelector(".row-actions") as HTMLElement).style.opacity = "0") }}
                  >
                    {/* Checkbox */}
                    <button onClick={() => toggle(task.id, !task.done)} style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                      border: `2px solid ${task.done ? COR : T.border}`,
                      background: task.done ? COR : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0, marginTop: 1,
                    }}>
                      {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
                    </button>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 13, color: T.cardFg, fontWeight: 500,
                          textDecoration: task.done ? "line-through" : "none",
                        }}>{task.title}</span>
                        {task.link && (
                          <a href={task.link} target="_blank" rel="noopener noreferrer" style={{
                            display: "flex", alignItems: "center", gap: 3, fontSize: 11,
                            color: COR, textDecoration: "none",
                          }}>
                            <Link2 size={10} /> link
                          </a>
                        )}
                      </div>
                      {task.notes && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: T.mutedFg }}>{task.notes}</p>
                      )}
                    </div>

                    {/* Prazo */}
                    {task.deadline && (
                      <span style={{
                        display: "flex", alignItems: "center", gap: 3,
                        fontSize: 11, color: T.mutedFg, whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        <Calendar size={10} /> {fmtDate(task.deadline)}
                      </span>
                    )}

                    {/* Ações (visíveis só no hover) */}
                    <div className="row-actions" style={{
                      display: "flex", gap: 4, flexShrink: 0, opacity: 0, transition: "opacity 0.1s",
                    }}>
                      <button onClick={() => {
                        setEditId(task.id)
                        setEditForm({ title: task.title, notes: task.notes || "", deadline: task.deadline || "", link: task.link || "" })
                      }} style={{
                        padding: "3px 6px", background: "transparent", color: T.mutedFg,
                        border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer",
                        display: "flex", alignItems: "center",
                      }}>
                        <Pencil size={11} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Formulário inline de adição */}
            {addingSection === sKey ? (
              <div style={{ padding: "12px 0 4px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    autoFocus onKeyDown={e => e.key === "Enter" && addTask()}
                    placeholder="Nome da tarefa..."
                    style={{ ...inputStyle, flex: "1 1 200px" }} />
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Observação (opcional)"
                    style={{ ...inputStyle, flex: "1 1 200px" }} />
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addTask} disabled={saving || !form.title.trim()} style={{
                    padding: "6px 14px", background: COR, color: "#fff", border: "none",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                    opacity: !form.title.trim() ? 0.5 : 1,
                  }}>
                    {saving ? "Salvando..." : "Adicionar"}
                  </button>
                  <button onClick={() => { setAddingSection(null); setForm(EMPTY_ADD) }} style={{
                    padding: "6px 12px", background: "transparent", color: T.mutedFg,
                    border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: T.font,
                  }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAddingSection(sKey); setForm(EMPTY_ADD); setEditId(null) }} style={{
                display: "flex", alignItems: "center", gap: 5, marginTop: 10,
                background: "transparent", border: "none", cursor: "pointer",
                color: T.mutedFg, fontSize: 12, fontFamily: T.font, padding: "4px 0",
              }}>
                <Plus size={12} /> Adicionar tarefa
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Criativos Ativos ── */
interface CriativoRow { campaign_name: string; ad_name: string; investimento: number; leads: number; won: number; vertical: string }

function CriativosSection() {
  const [rows, setRows] = useState<CriativoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [campaigns, setCampaigns] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        // Descobre campanhas com "vistas" ou "anita" no nome
        const discRes = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sql: `SELECT DISTINCT campaign_name, vertical FROM nekt_silver.ads_unificado WHERE (LOWER(campaign_name) LIKE '%vistas%' OR LOWER(campaign_name) LIKE '%anit%') AND date >= DATE '2026-01-01' ORDER BY campaign_name`,
          }),
        })
        const discData = await discRes.json()
        const found: string[] = (discData.rows || []).map((r: Record<string, unknown>) => String(r.campaign_name || ""))
        setCampaigns(found)

        if (found.length === 0) { setLoading(false); return }

        // Busca métricas das campanhas encontradas
        const names = found.map(n => `'${n.replace(/'/g, "''")}'`).join(", ")
        const metRes = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sql: `SELECT campaign_name, ad_name, SUM(spend) AS investimento, SUM(lead) AS leads, SUM(won) AS won FROM nekt_silver.ads_unificado WHERE campaign_name IN (${names}) AND date >= DATE '2026-01-01' GROUP BY campaign_name, ad_name ORDER BY investimento DESC`,
          }),
        })
        const metData = await metRes.json()
        setRows((metData.rows || []).map((r: Record<string, unknown>) => ({
          campaign_name: String(r.campaign_name || ""),
          ad_name: String(r.ad_name || ""),
          investimento: Number(r.investimento) || 0,
          leads: Number(r.leads) || 0,
          won: Number(r.won) || 0,
          vertical: "",
        })))
      } catch (e) { setError(String(e)) } finally { setLoading(false) }
    }
    load()
  }, [])

  const fmt = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n: number) => Math.round(n).toLocaleString("pt-BR")

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.mutedFg, fontSize: 13 }}>
      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Buscando criativos na Nekt...
    </div>
  )

  if (error) return (
    <div style={{ fontSize: 13, color: T.destructive, background: `${T.destructive}10`, padding: "10px 14px", borderRadius: 8 }}>
      Erro: {error}
    </div>
  )

  if (campaigns.length === 0) return (
    <div style={{ fontSize: 13, color: T.mutedFg, fontStyle: "italic", background: T.muted, padding: "12px 16px", borderRadius: 8, border: `1px solid ${T.border}` }}>
      Nenhuma campanha com "vistas" ou "anita" encontrada na Nekt ainda. Confirme o nome da campanha no Meta para ajustar o filtro.
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {campaigns.map(c => (
          <span key={c} style={{ background: `${COR}15`, color: COR, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c}</span>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.muted }}>
              {["Anúncio", "Campanha", "Investimento", "Leads", "WON", "CAC"].map(col => (
                <th key={col} style={{ padding: "7px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = T.muted }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" }}
              >
                <td style={{ padding: "7px 10px", color: T.cardFg, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.ad_name}>{row.ad_name || "—"}</td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{ background: `${COR}15`, color: COR, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{row.campaign_name}</span>
                </td>
                <td style={{ padding: "7px 10px", color: T.cardFg, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>R$ {fmt(row.investimento)}</td>
                <td style={{ padding: "7px 10px", color: T.teal600, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtInt(row.leads)}</td>
                <td style={{ padding: "7px 10px", color: T.primary, fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtInt(row.won)}</td>
                <td style={{ padding: "7px 10px", color: T.destructive, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {row.won > 0 ? `R$ ${fmt(row.investimento / row.won)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function VistasHospedesPage() {
  const [days, setDays] = useState<DayData[]>([])
  const [loadingRes, setLoadingRes] = useState(true)
  const [errorRes, setErrorRes] = useState("")

  const fetchReservas = useCallback(async () => {
    setLoadingRes(true)
    setErrorRes("")
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
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: COR, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Vistas de Anitá — Hóspedes</span>
      </header>

      <main style={{ padding: "24px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── SEÇÃO 1: Meta de Reservas ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>
                Metabase · Reservas Pagas
              </p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Meta de Reservas — Anitápolis</h2>
            </div>
            <button onClick={fetchReservas} disabled={loadingRes} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 7,
              fontSize: 12, color: T.mutedFg, cursor: "pointer", fontFamily: T.font,
            }}>
              {loadingRes ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "↻"} Atualizar
            </button>
          </div>

          {errorRes ? (
            <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: `${T.destructive}10`, border: `1px solid ${T.destructive}30`, borderRadius: 10 }}>
              <AlertCircle size={16} color={T.destructive} />
              <span style={{ fontSize: 13, color: T.destructive }}>{errorRes}</span>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Hoje", value: loadingRes ? "—" : String(today), color: statusColor(today, META_DIA) },
                  { label: "Média 30 dias", value: loadingRes ? "—" : fmt2(avg30r), color: statusColor(avg30r, META_DIA) },
                  { label: "Meta diária", value: String(META_DIA), color: "#10b981" },
                  { label: "Status", value: loadingRes ? "—" : avg30r >= META_DIA ? "✓ Acima da meta" : "Abaixo da meta", color: statusColor(avg30r, META_DIA) },
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

              {/* Chart */}
              {!loadingRes && days.length > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: T.elevSm }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10, fontSize: 11, color: T.mutedFg }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 10, background: `${COR}88`, borderRadius: 2, display: "inline-block" }} /> Reservas/dia
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 2, background: COR, display: "inline-block" }} /> Média móvel 30d
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 14, height: 2, background: "#10b981", borderTop: "2px dashed #10b981", display: "inline-block" }} /> Meta (7/dia)
                    </span>
                  </div>
                  <ReservasChart days={days} />
                </div>
              )}
              {loadingRes && (
                <div style={{ textAlign: "center", padding: 32, background: T.card, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <Loader2 size={20} color={COR} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              )}
            </>
          )}
        </section>

        {/* ── SEÇÃO 2: Plano de Ação ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>
              Plano de Ação
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Vistas de Anitá — 10 a 30 de abril</h2>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm }}>
            <ChecklistSection />
          </div>
        </section>

        {/* ── SEÇÃO 3: Criativos Ativos ── */}
        <section>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 2px" }}>
              Nekt · Meta Ads
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.cardFg, margin: 0 }}>Criativos Ativos</h2>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm }}>
            <CriativosSection />
          </div>
        </section>

      </main>
    </div>
  )
}
