"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronLeft, Plus, Trash2, Loader2, Sparkles, X, TrendingUp, Users, FileImage, Zap,
} from "lucide-react"
import { T } from "@/lib/constants"
import type { ResultadoEntry, ResultadoArea } from "@/app/api/vistas-resultados/route"

const COR = "#7C3AED"

/* ── helpers ── */
function fmtDate(iso: string) {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

/* ── Area config ── */
const AREAS: { id: ResultadoArea; label: string; color: string; icon: React.ReactNode }[] = [
  { id: "midia-paga", label: "Mídia Paga", color: COR, icon: <FileImage size={16} /> },
  { id: "influenciadores", label: "Influenciadores", color: "#f59e0b", icon: <Users size={16} /> },
  { id: "social", label: "Social / Orgânico", color: "#0ea5e9", icon: <TrendingUp size={16} /> },
  { id: "automacao", label: "Automação", color: "#10b981", icon: <Zap size={16} /> },
]

/* ── AI Analysis types ── */
interface Destaque { area: string; insight: string }
interface Analise {
  destaques: Destaque[]
  recomendacoes: {
    midia_paga: { tema: string; justificativa: string }[]
    influenciadores: { acao: string; justificativa: string }[]
    social: { tema: string; formato: string; justificativa: string }[]
  }
  padrao_geral: string
}

/* ── Forms per area ── */
function MidiaPagaForm({ onSave, onCancel }: { onSave: (data: Partial<ResultadoEntry>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ date: "", tema: "", criativos: "", campanha: "" })
  const [saving, setSaving] = useState(false)
  const inputStyle = { padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, outline: "none", width: "100%" }

  async function save() {
    if (!form.tema.trim()) return
    setSaving(true)
    await onSave({ area: "midia-paga", date: form.date, tema: form.tema, criativos: Number(form.criativos) || undefined, campanha: form.campanha || undefined })
    setSaving(false)
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Tema do criativo *</label>
          <input value={form.tema} onChange={e => setForm(f => ({ ...f, tema: e.target.value }))} autoFocus placeholder="Ex: Urgência fim de semana" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 120px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Nº de criativos</label>
          <input type="number" min="1" value={form.criativos} onChange={e => setForm(f => ({ ...f, criativos: e.target.value }))} placeholder="4" style={inputStyle} />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Campanha</label>
          <input value={form.campanha} onChange={e => setForm(f => ({ ...f, campanha: e.target.value }))} placeholder="Retargeting abr" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Data</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      <FormActions onSave={save} onCancel={onCancel} saving={saving} disabled={!form.tema.trim()} />
    </div>
  )
}

function InfluenciadoresForm({ onSave, onCancel }: { onSave: (data: Partial<ResultadoEntry>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ semana: "", qtdInflus: "", cuponsUsados: "", date: "" })
  const [saving, setSaving] = useState(false)
  const inputStyle = { padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, outline: "none", width: "100%" }

  async function save() {
    if (!form.semana.trim()) return
    setSaving(true)
    await onSave({ area: "influenciadores", date: form.date, semana: form.semana, qtdInflus: Number(form.qtdInflus) || undefined, cuponsUsados: Number(form.cuponsUsados) || undefined })
    setSaving(false)
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Semana *</label>
          <input value={form.semana} onChange={e => setForm(f => ({ ...f, semana: e.target.value }))} autoFocus placeholder="Ex: Semana 1 — 14 a 20/abr" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 130px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Qtd. influencers</label>
          <input type="number" min="0" value={form.qtdInflus} onChange={e => setForm(f => ({ ...f, qtdInflus: e.target.value }))} placeholder="3" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 130px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Cupons usados</label>
          <input type="number" min="0" value={form.cuponsUsados} onChange={e => setForm(f => ({ ...f, cuponsUsados: e.target.value }))} placeholder="12" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Data de registro</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      <FormActions onSave={save} onCancel={onCancel} saving={saving} disabled={!form.semana.trim()} />
    </div>
  )
}

function SocialForm({ onSave, onCancel }: { onSave: (data: Partial<ResultadoEntry>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ date: "", temaPost: "", formato: "Reel", qtdPosts: "" })
  const [saving, setSaving] = useState(false)
  const inputStyle = { padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, outline: "none", width: "100%" }

  async function save() {
    if (!form.temaPost.trim()) return
    setSaving(true)
    await onSave({ area: "social", date: form.date, temaPost: form.temaPost, formato: form.formato, qtdPosts: Number(form.qtdPosts) || 1 })
    setSaving(false)
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Tema do post *</label>
          <input value={form.temaPost} onChange={e => setForm(f => ({ ...f, temaPost: e.target.value }))} autoFocus placeholder="Ex: Natureza e trilhas" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 130px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Formato</label>
          <select value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))} style={inputStyle}>
            {["Reel", "Carrossel", "Story", "Feed"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ flex: "0 0 100px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Nº de posts</label>
          <input type="number" min="1" value={form.qtdPosts} onChange={e => setForm(f => ({ ...f, qtdPosts: e.target.value }))} placeholder="1" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Data</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      <FormActions onSave={save} onCancel={onCancel} saving={saving} disabled={!form.temaPost.trim()} />
    </div>
  )
}

function AutomacaoForm({ onSave, onCancel }: { onSave: (data: Partial<ResultadoEntry>) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ date: "", descricao: "" })
  const [saving, setSaving] = useState(false)
  const inputStyle = { padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.cardFg, background: T.muted, outline: "none", width: "100%" }

  async function save() {
    if (!form.descricao.trim()) return
    setSaving(true)
    await onSave({ area: "automacao", date: form.date, descricao: form.descricao })
    setSaving(false)
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Descrição *</label>
          <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} autoFocus placeholder="Ex: Fluxo de e-mail para abandono de carrinho ativado" style={inputStyle} />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 3 }}>Data</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
        </div>
      </div>
      <FormActions onSave={save} onCancel={onCancel} saving={saving} disabled={!form.descricao.trim()} />
    </div>
  )
}

function FormActions({ onSave, onCancel, saving, disabled }: { onSave: () => void; onCancel: () => void; saving: boolean; disabled: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onSave} disabled={saving || disabled} style={{
        padding: "6px 14px", background: COR, color: "#fff", border: "none",
        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
        opacity: disabled ? 0.5 : 1,
      }}>
        {saving ? "Salvando..." : "Registrar"}
      </button>
      <button onClick={onCancel} style={{
        padding: "6px 12px", background: "transparent", color: T.mutedFg,
        border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer",
        fontFamily: T.font, display: "flex", alignItems: "center", gap: 4,
      }}>
        <X size={12} /> Cancelar
      </button>
    </div>
  )
}

/* ── Area Section ── */
function AreaSection({
  area, entries, onAdd, onDelete,
}: {
  area: typeof AREAS[number]
  entries: ResultadoEntry[]
  onAdd: (data: Partial<ResultadoEntry>) => Promise<void>
  onDelete: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)

  async function handleSave(data: Partial<ResultadoEntry>) {
    await onAdd(data)
    setAdding(false)
  }

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${area.color}`,
      borderRadius: 12, padding: "18px 20px", boxShadow: T.elevSm,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: area.color }}>{area.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.cardFg }}>{area.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: area.color,
            background: `${area.color}15`, padding: "2px 8px", borderRadius: 20,
          }}>
            {entries.length} {entries.length === 1 ? "registro" : "registros"}
          </span>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
            background: `${area.color}15`, border: `1px solid ${area.color}40`,
            borderRadius: 7, cursor: "pointer", color: area.color,
            fontSize: 12, fontFamily: T.font, fontWeight: 600,
          }}>
            <Plus size={12} /> Registrar
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{
          background: `${area.color}08`, border: `1px solid ${area.color}25`,
          borderRadius: 8, padding: "14px 16px", marginBottom: 14,
        }}>
          {area.id === "midia-paga" && <MidiaPagaForm onSave={handleSave} onCancel={() => setAdding(false)} />}
          {area.id === "influenciadores" && <InfluenciadoresForm onSave={handleSave} onCancel={() => setAdding(false)} />}
          {area.id === "social" && <SocialForm onSave={handleSave} onCancel={() => setAdding(false)} />}
          {area.id === "automacao" && <AutomacaoForm onSave={handleSave} onCancel={() => setAdding(false)} />}
        </div>
      )}

      {/* Entries */}
      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: T.mutedFg, fontStyle: "italic", margin: 0 }}>
          Nenhum registro ainda. Clique em &quot;Registrar&quot; para adicionar.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          {area.id === "midia-paga" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.muted }}>
                  {["Tema do criativo", "Criativos", "Campanha", "Data", ""].map(col => (
                    <th key={col} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "7px 10px", color: T.cardFg, fontWeight: 500 }}>{e.tema}</td>
                    <td style={{ padding: "7px 10px", color: area.color, fontWeight: 700 }}>{e.criativos ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg }}>{e.campanha ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg, whiteSpace: "nowrap" }}>{e.date ? fmtDate(e.date) : "—"}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.destructive, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {area.id === "influenciadores" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.muted }}>
                  {["Semana", "Influencers", "Cupons usados", "Data", ""].map(col => (
                    <th key={col} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "7px 10px", color: T.cardFg, fontWeight: 500 }}>{e.semana}</td>
                    <td style={{ padding: "7px 10px", color: area.color, fontWeight: 700 }}>{e.qtdInflus ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: "#10b981", fontWeight: 700 }}>{e.cuponsUsados ?? "—"}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg, whiteSpace: "nowrap" }}>{e.date ? fmtDate(e.date) : "—"}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.destructive, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {area.id === "social" && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.muted }}>
                  {["Tema", "Formato", "Posts", "Data", ""].map(col => (
                    <th key={col} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "7px 10px", color: T.cardFg, fontWeight: 500 }}>{e.temaPost}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{ background: `${area.color}15`, color: area.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{e.formato}</span>
                    </td>
                    <td style={{ padding: "7px 10px", color: area.color, fontWeight: 700 }}>{e.qtdPosts ?? 1}</td>
                    <td style={{ padding: "7px 10px", color: T.mutedFg, whiteSpace: "nowrap" }}>{e.date ? fmtDate(e.date) : "—"}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.destructive, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {area.id === "automacao" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {entries.map(e => (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0", borderBottom: `1px solid ${T.border}`,
                }}>
                  <Zap size={13} color={area.color} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: T.cardFg }}>{e.descricao}</span>
                  {e.date && <span style={{ fontSize: 11, color: T.mutedFg, whiteSpace: "nowrap" }}>{fmtDate(e.date)}</span>}
                  <button onClick={() => onDelete(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.destructive, display: "flex", alignItems: "center" }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── AI Analysis Panel ── */
function AnaliseIAPanel({ entries }: { entries: ResultadoEntry[] }) {
  const [analise, setAnalise] = useState<Analise | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [raw, setRaw] = useState("")

  async function runAnalise() {
    if (entries.length === 0) {
      setError("Registre pelo menos uma métrica antes de gerar a análise.")
      return
    }
    setLoading(true)
    setError("")
    setAnalise(null)
    setRaw("")
    try {
      const res = await fetch("/api/vistas-analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados: entries }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro desconhecido"); return }
      if (data.analise) setAnalise(data.analise)
      else { setRaw(data.raw || "Resposta inválida da IA"); setError("Erro no parsing da resposta") }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const areaCores: Record<string, string> = {
    "Mídia Paga": COR, "Influenciadores": "#f59e0b", "Social": "#0ea5e9",
  }

  return (
    <div>
      {/* Trigger */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: "20px 24px", boxShadow: T.elevSm, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Análise estratégica por IA
          </p>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            O Claude analisa seus registros e sugere temas e derivações para cada frente — mídia paga, influenciadores e social.
          </p>
        </div>
        <button
          onClick={runAnalise}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            background: COR, color: "#fff", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
            fontFamily: T.font, opacity: loading ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {loading
            ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analisando...</>
            : <><Sparkles size={14} /> Gerar análise</>
          }
        </button>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", background: `${T.destructive}10`,
          border: `1px solid ${T.destructive}30`, borderRadius: 10, marginBottom: 16,
          fontSize: 13, color: T.destructive,
        }}>
          {error}
          {raw && <pre style={{ marginTop: 8, fontSize: 11, whiteSpace: "pre-wrap" }}>{raw}</pre>}
        </div>
      )}

      {analise && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Padrão geral */}
          <div style={{
            background: `${COR}08`, border: `1px solid ${COR}30`, borderRadius: 12, padding: "16px 20px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: COR, margin: "0 0 6px" }}>
              Padrão geral
            </p>
            <p style={{ fontSize: 14, color: T.cardFg, margin: 0, lineHeight: 1.6 }}>
              {analise.padrao_geral}
            </p>
          </div>

          {/* Destaques */}
          {analise.destaques?.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: T.elevSm }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, margin: "0 0 12px" }}>
                Destaques
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analise.destaques.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                      background: `${areaCores[d.area] ?? COR}15`,
                      color: areaCores[d.area] ?? COR,
                    }}>{d.area}</span>
                    <span style={{ fontSize: 13, color: T.cardFg, lineHeight: 1.5 }}>{d.insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>

            {/* Mídia Paga */}
            {analise.recomendacoes?.midia_paga?.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${COR}`, borderRadius: 12, padding: "16px 18px", boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <FileImage size={14} color={COR} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: COR }}>Mídia Paga</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analise.recomendacoes.midia_paga.map((r, i) => (
                    <div key={i}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.cardFg, margin: "0 0 2px" }}>{r.tema}</p>
                      <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>{r.justificativa}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Influenciadores */}
            {analise.recomendacoes?.influenciadores?.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: "4px solid #f59e0b", borderRadius: 12, padding: "16px 18px", boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Users size={14} color="#f59e0b" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Influenciadores</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analise.recomendacoes.influenciadores.map((r, i) => (
                    <div key={i}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.cardFg, margin: "0 0 2px" }}>{r.acao}</p>
                      <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>{r.justificativa}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social */}
            {analise.recomendacoes?.social?.length > 0 && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: "4px solid #0ea5e9", borderRadius: 12, padding: "16px 18px", boxShadow: T.elevSm }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <TrendingUp size={14} color="#0ea5e9" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0369a1" }}>Social / Orgânico</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analise.recomendacoes.social.map((r, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.cardFg, margin: 0 }}>{r.tema}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", background: "#0ea5e915", padding: "1px 6px", borderRadius: 10 }}>{r.formato}</span>
                      </div>
                      <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.5 }}>{r.justificativa}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function ResumoResultadosPage() {
  const [entries, setEntries] = useState<ResultadoEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"metricas" | "ia">("metricas")

  useEffect(() => {
    fetch("/api/vistas-resultados")
      .then(r => r.json())
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function addEntry(data: Partial<ResultadoEntry>) {
    const res = await fetch("/api/vistas-resultados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const entry = await res.json()
    setEntries(prev => [...prev, entry])
  }

  async function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    await fetch("/api/vistas-resultados", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  // KPI summary
  const totalCreativos = entries.filter(e => e.area === "midia-paga").reduce((s, e) => s + (e.criativos ?? 0), 0)
  const totalInflus = entries.filter(e => e.area === "influenciadores").reduce((s, e) => s + (e.qtdInflus ?? 0), 0)
  const totalCupons = entries.filter(e => e.area === "influenciadores").reduce((s, e) => s + (e.cuponsUsados ?? 0), 0)
  const totalPosts = entries.filter(e => e.area === "social").reduce((s, e) => s + (e.qtdPosts ?? 1), 0)

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
        <Link href="/vistas-hospedes" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} /> Vistas de Anitá
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Resumo e Resultado das Ações</span>
      </header>

      <main style={{ padding: "24px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Criativos feitos", value: String(totalCreativos), color: COR },
            { label: "Influencers ativados", value: String(totalInflus), color: "#f59e0b" },
            { label: "Cupons usados", value: String(totalCupons), color: "#10b981" },
            { label: "Posts publicados", value: String(totalPosts), color: "#0ea5e9" },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: "12px 16px", boxShadow: T.elevSm,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{kpi.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: kpi.color, margin: 0 }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {([["metricas", "Métricas por frente"], ["ia", "Análise IA"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "7px 18px", borderRadius: 8, cursor: "pointer", fontFamily: T.font,
              fontSize: 13, fontWeight: 600, border: "none",
              background: tab === key ? COR : T.card,
              color: tab === key ? "#fff" : T.mutedFg,
              boxShadow: tab === key ? "none" : T.elevSm,
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.mutedFg, padding: 32 }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            Carregando registros...
          </div>
        ) : tab === "metricas" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {AREAS.map(area => (
              <AreaSection
                key={area.id}
                area={area}
                entries={entries.filter(e => e.area === area.id)}
                onAdd={addEntry}
                onDelete={deleteEntry}
              />
            ))}
          </div>
        ) : (
          <AnaliseIAPanel entries={entries} />
        )}
      </main>
    </div>
  )
}
