"use client"

import { useEffect, useState, useRef } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { getSupabase } from "@/app/social-midia/calendario-seazone/_lib/supabase"

type Tab = "geral" | "expansao_sp" | "expansao_salvador" | "vistas" | "seazone"
type Row = Record<string, unknown>

const TABS = [
  { id: "geral"             as Tab, label: "Geral",             table: "" },
  { id: "expansao_sp"       as Tab, label: "Expansão SP",       table: "influencers_expansao_sp" },
  { id: "expansao_salvador" as Tab, label: "Expansão Salvador", table: "influencers_expansao_salvador" },
  { id: "vistas"            as Tab, label: "Vistas de Anitá",   table: "influencers_vistas" },
  { id: "seazone"           as Tab, label: "Seazone",           table: "influencers_seazone" },
]

const DATA_TABS = TABS.filter(t => t.id !== "geral")

type ColDef = {
  key: string
  label: string
  w: number
  type?: string
  filterType?: string
}

const BASE_COLS: ColDef[] = [
  { key: "ano",                    label: "Ano",                        w: 70,  filterType: "select" },
  { key: "mes",                    label: "Mês",                        w: 130, filterType: "select" },
  { key: "categoria",              label: "Categoria",                  w: 120, filterType: "select", type: "categoria" },
  { key: "perfil",                 label: "Perfil",                     w: 160, filterType: "text" },
  { key: "seguidores",             label: "Seguidores",                 w: 110, filterType: "text" },
  { key: "contato",                label: "Contato",                    w: 190, filterType: "text" },
  { key: "status_contrato",        label: "Status",                     w: 170, filterType: "select", type: "status" },
  { key: "valor_trabalho",         label: "Valor do trabalho",          w: 140, filterType: "text" },
  { key: "valor_hospedagem",       label: "Valor da hospedagem",        w: 140, filterType: "text" },
  { key: "data_contratacao",       label: "Data da contratação",        w: 150, filterType: "text" },
  { key: "data_pagamento",         label: "Data do pagamento",          w: 150, filterType: "text" },
  { key: "conteudo_orcado",        label: "Conteúdo orçado/contratado", w: 210, filterType: "text", type: "multiline" },
  { key: "observacoes",            label: "Observações",                w: 210, filterType: "text", type: "multiline" },
  { key: "cupom",                  label: "Cupom",                      w: 120, filterType: "text" },
  { key: "data_validade_cupom",    label: "Validade do cupom",          w: 150, filterType: "text" },
  { key: "data_visita_hospedagem", label: "Data da visita",             w: 150, filterType: "text" },
  { key: "data_hora_post",         label: "Data da publicação",         w: 160, filterType: "text" },
  { key: "link_publicacao",        label: "Link do conteúdo",           w: 130, filterType: "text", type: "links" },
  { key: "quantidade_conversoes",  label: "Qtd. de conversões",         w: 140, filterType: "text" },
  { key: "valor_total_reservas",   label: "Valor total de reservas",    w: 160, filterType: "text" },
]

const COLS_BY_TAB: Record<string, ColDef[]> = {
  expansao_sp:       BASE_COLS,
  expansao_salvador: BASE_COLS,
  vistas:            BASE_COLS.filter(c => c.key !== "conteudo_orcado"),
  seazone: [
    BASE_COLS[0],
    { key: "cidade", label: "Cidade", w: 120, filterType: "select" },
    ...BASE_COLS.slice(1),
  ],
}

const STATUS_OPTIONS    = ["Contratado", "Não contratado", "Aguardando", "Permuta"]
const CATEGORIA_OPTIONS = ["Perfil", "Página"]

function getStatusStyle(val: string) {
  const v = (val || "").toLowerCase().trim()
  if (v === "contratado")     return { bg: "#d1fae5", color: "#065f46" }
  if (v === "não contratado") return { bg: "#fee2e2", color: "#991b1b" }
  if (v === "aguardando")     return { bg: "#fef9c3", color: "#854d0e" }
  if (v === "permuta")        return { bg: "#e0e7ff", color: "#3730a3" }
  return { bg: "#f3f4f6", color: "#374151" }
}

function parseBRL(val: unknown): number {
  if (!val || val === "—") return 0
  const s = String(val).replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  return parseFloat(s) || 0
}
function formatBRL(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Dropdown genérico ─────────────────────────────────────────────────────────
function OptionMenu({ options, value, onSelect, onClose, getStyle }: {
  options: string[]
  value: string
  onSelect: (v: string) => void
  onClose: () => void
  getStyle?: (v: string) => { bg: string; color: string }
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [onClose])
  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 300,
      background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
      boxShadow: "0 6px 24px rgba(0,0,0,0.14)", minWidth: 170, overflow: "hidden",
    }}>
      {options.map(opt => {
        const s = getStyle ? getStyle(opt) : { bg: "#f0fdf4", color: "#065f46" }
        const active = (value || "").toLowerCase().trim() === opt.toLowerCase().trim()
        return (
          <div key={opt} onClick={() => { onSelect(opt); onClose() }} style={{
            padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            color: s.color, background: active ? s.bg : "transparent",
            borderLeft: active ? `3px solid ${s.color}` : "3px solid transparent",
            display: "flex", alignItems: "center", gap: 8,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = s.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = active ? s.bg : "transparent")}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            {opt}
          </div>
        )
      })}
    </div>
  )
}

// ── Filtro por coluna ─────────────────────────────────────────────────────────
function ColFilter({ col, rows, filter, setFilter }: {
  col: ColDef; rows: Row[]; filter: string; setFilter: (v: string) => void
}) {
  const [open, setOpen]   = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const uniqueVals = Array.from(
    new Set(rows.map(r => String(r[col.key] ?? "")).filter(Boolean))
  ).sort()

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch("") }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const hasFilter = Boolean(filter)

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {col.label}
      </span>
      <button onClick={() => setOpen(v => !v)} style={{
        background: hasFilter ? "#0d9488" : "transparent",
        border: hasFilter ? "none" : `1px solid ${T.border}`,
        borderRadius: 4, padding: "2px 5px", cursor: "pointer",
        fontSize: 9, color: hasFilter ? "#fff" : T.mutedFg, lineHeight: 1.4, flexShrink: 0,
      }}>▾</button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 210,
          maxHeight: 280, display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 9px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ overflowY: "auto", padding: "4px 0" }}>
            <div onClick={() => { setFilter(""); setOpen(false); setSearch("") }} style={{
              padding: "8px 14px", fontSize: 12, cursor: "pointer",
              color: !filter ? "#0d9488" : T.mutedFg, fontWeight: !filter ? 700 : 400,
            }}>Todos</div>
            {uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase())).map(v => {
              const isStatus = col.key === "status_contrato"
              const s = isStatus ? getStatusStyle(v) : null
              return (
                <div key={v} onClick={() => { setFilter(v); setOpen(false); setSearch("") }} style={{
                  padding: "8px 14px", fontSize: 12, cursor: "pointer",
                  color: filter === v ? "#0d9488" : T.cardFg,
                  fontWeight: filter === v ? 700 : 400,
                  background: filter === v ? "#f0fdf4" : "transparent",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {isStatus && s && <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Célula editável inline ────────────────────────────────────────────────────
function EditableCell({ value, colKey, rowId, tableName, type, onSaved }: {
  value: string; colKey: string; rowId: unknown
  tableName: string; type?: string; onSaved: () => void
}) {
  const [editing, setEditing]   = useState(false)
  const [val, setVal]           = useState(value)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setVal(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  async function save(newVal: string) {
    if (newVal.trim() === (value ?? "").trim()) { setEditing(false); return }
    await getSupabase().from(tableName).update({ [colKey]: newVal.trim() || null }).eq("id", rowId)
    setEditing(false)
    onSaved()
  }

  async function saveOption(newVal: string) {
    setVal(newVal)
    await getSupabase().from(tableName).update({ [colKey]: newVal }).eq("id", rowId)
    onSaved()
  }

  if (type === "links") {
    const links = (val || "").split(/[\n\s]+/).filter(l => l.startsWith("http"))
    return (
      <div style={{ width: "100%" }}>
        {editing ? (
          <textarea ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={() => save(val)}
            placeholder="Um link por linha" rows={3}
            style={{ width: "100%", background: "#fff", border: `2px solid #0d9488`, borderRadius: 6, padding: "5px 7px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
        ) : (
          <div onClick={() => setEditing(true)} style={{ cursor: "pointer", minHeight: 22 }}>
            {links.length === 0
              ? <span style={{ color: T.mutedFg, fontSize: 13 }}>—</span>
              : links.map((l, i) => (
                <a key={i} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ display: "block", color: "#0d9488", fontSize: 13, lineHeight: 1.7 }}>
                  {links.length > 1 ? `Post ${i + 1} ↗` : "Ver ↗"}
                </a>
              ))}
          </div>
        )}
      </div>
    )
  }

  if (type === "multiline") {
    return editing ? (
      <textarea ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={() => save(val)} rows={3}
        style={{ width: "100%", background: "#fff", border: `2px solid #0d9488`, borderRadius: 6, padding: "5px 7px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
      />
    ) : (
      <div onClick={() => setEditing(true)} title={val || undefined} style={{
        cursor: "text", fontSize: 13, color: val ? T.cardFg : T.mutedFg,
        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", lineHeight: 1.5,
      }}>
        {val || "—"}
      </div>
    )
  }

  if (type === "status") {
    const s = getStatusStyle(val)
    return (
      <div style={{ position: "relative" }}>
        <span onClick={() => setShowMenu(v => !v)} style={{
          background: s.bg, color: s.color, borderRadius: 6,
          padding: "5px 11px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          gap: 5, whiteSpace: "nowrap", userSelect: "none",
        }}>
          {val || "—"} <span style={{ fontSize: 9 }}>▾</span>
        </span>
        {showMenu && (
          <OptionMenu options={STATUS_OPTIONS} value={val} onSelect={saveOption}
            onClose={() => setShowMenu(false)} getStyle={getStatusStyle} />
        )}
      </div>
    )
  }

  if (type === "categoria") {
    return (
      <div style={{ position: "relative" }}>
        <span onClick={() => setShowMenu(v => !v)} style={{
          background: val ? "#f0f9ff" : "#f3f4f6",
          color: val ? "#0369a1" : T.mutedFg,
          borderRadius: 6, padding: "5px 11px", fontSize: 12, fontWeight: 600,
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          gap: 5, whiteSpace: "nowrap", userSelect: "none",
        }}>
          {val || "—"} <span style={{ fontSize: 9 }}>▾</span>
        </span>
        {showMenu && (
          <OptionMenu options={CATEGORIA_OPTIONS} value={val} onSelect={saveOption}
            onClose={() => setShowMenu(false)}
            getStyle={() => ({ bg: "#f0f9ff", color: "#0369a1" })} />
        )}
      </div>
    )
  }

  return editing ? (
    <input ref={inputRef} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => save(val)}
      onKeyDown={e => { if (e.key === "Enter") save(val); if (e.key === "Escape") { setVal(value); setEditing(false) } }}
      style={{ width: "100%", background: "#fff", border: `2px solid #0d9488`, borderRadius: 6, padding: "5px 7px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
    />
  ) : (
    <div onClick={() => setEditing(true)} title={val || undefined} style={{
      cursor: "text", minHeight: 22, fontSize: 13,
      color: val ? T.cardFg : T.mutedFg,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {val || "—"}
    </div>
  )
}

// ── Modal novo influencer ─────────────────────────────────────────────────────
function NewModal({ cols, tableName, onClose, onSaved }: {
  cols: ColDef[]; tableName: string; onClose: () => void; onSaved: () => void
}) {
  const multiline = ["link_publicacao", "conteudo_orcado", "observacoes"]
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    cols.forEach(c => { init[c.key] = "" })
    return init
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const payload: Record<string, unknown> = {}
    cols.forEach(c => {
      const v = form[c.key]?.trim() || null
      payload[c.key] = c.key === "ano" && v ? Number(v) : v
    })
    await getSupabase().from(tableName).insert(payload)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}>
      <div style={{ background: T.card, borderRadius: 16, padding: 30, width: "min(660px, 96vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: "0 0 22px" }}>Novo influencer</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {cols.map(c => (
            <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: multiline.includes(c.key) ? "1 / -1" : undefined }}>
              <label style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>{c.label}</label>
              {c.type === "status" ? (
                <select value={form[c.key] ?? ""} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: T.cardFg, outline: "none" }}>
                  <option value="">Selecionar…</option>
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : c.type === "categoria" ? (
                <select value={form[c.key] ?? ""} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: T.cardFg, outline: "none" }}>
                  <option value="">Selecionar…</option>
                  {CATEGORIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : multiline.includes(c.key) ? (
                <textarea value={form[c.key] ?? ""} rows={3} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: T.cardFg, fontFamily: "inherit", resize: "vertical", outline: "none" }}
                />
              ) : (
                <input value={form[c.key] ?? ""} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: T.cardFg, outline: "none" }}
                />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 22px", fontSize: 13, color: T.mutedFg, cursor: "pointer" }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ background: "#0d9488", border: "none", borderRadius: 8, padding: "10px 26px", fontSize: 13, color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Aba Geral ─────────────────────────────────────────────────────────────────
function GeralTab() {
  const [orcamento, setOrcamento]           = useState("")
  const [orcamentoInput, setOrcamentoInput] = useState("")
  const [allRows, setAllRows]               = useState<Record<string, Row[]>>({})
  const [loading, setLoading]               = useState(true)
  const [filterAno, setFilterAno]           = useState<string>("todos")
  const [filterMes, setFilterMes]           = useState<string>("todos")

  useEffect(() => {
    const saved = localStorage.getItem("influencers_orcamento_total") || ""
    setOrcamento(saved)
    setOrcamentoInput(saved)
  }, [])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const results: Record<string, Row[]> = {}
      for (const t of DATA_TABS) {
        const { data } = await getSupabase().from(t.table).select("status_contrato,valor_trabalho,ano,mes")
        results[t.id] = data ?? []
      }
      setAllRows(results)
      setLoading(false)
    }
    loadAll()
  }, [])

  function saveOrcamento() {
    setOrcamento(orcamentoInput)
    localStorage.setItem("influencers_orcamento_total", orcamentoInput)
  }

  const todosAnos = Array.from(new Set(
    Object.values(allRows).flat().map(r => String(r.ano ?? "")).filter(Boolean)
  )).sort().reverse()

  const todosMeses = Array.from(new Set(
    Object.values(allRows).flat()
      .filter(r => filterAno === "todos" || String(r.ano) === filterAno)
      .map(r => String(r.mes ?? "")).filter(Boolean)
  )).sort()

  function rowPassFilter(r: Row): boolean {
    if (filterAno !== "todos" && String(r.ano) !== filterAno) return false
    if (filterMes !== "todos" && String(r.mes) !== filterMes) return false
    return true
  }

  const totalBudget = parseBRL(orcamento)

  const breakdown = DATA_TABS.map(t => {
    const rows = (allRows[t.id] ?? []).filter(rowPassFilter)
    const contratados = rows.filter(r => String(r.status_contrato ?? "").toLowerCase().trim() === "contratado")
    const gasto = contratados.reduce((acc, r) => acc + parseBRL(r.valor_trabalho), 0)
    return { id: t.id, label: t.label, contratados: contratados.length, gasto }
  })

  const totalGasto = breakdown.reduce((acc, b) => acc + b.gasto, 0)
  const saldoLivre = totalBudget - totalGasto
  const pct        = totalBudget > 0 ? Math.min(100, Math.round((totalGasto / totalBudget) * 100)) : 0
  const barColor   = pct > 85 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#0d9488"

  const CAMPAIGN_COLORS: Record<string, string> = {
    expansao_sp: "#185FA5", expansao_salvador: "#B45309", vistas: "#7C3D8F", seazone: "#0d9488",
  }

  const periodoLabel = filterAno === "todos"
    ? "Todos os períodos"
    : filterMes === "todos"
      ? `Ano ${filterAno}`
      : `${filterMes.replace(/^\d+\.\s*/, "")} de ${filterAno}`

  return (
    <div>
      {/* Filtro de período */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Filtrar por período
        </p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>Ano</label>
            <select value={filterAno} onChange={e => { setFilterAno(e.target.value); setFilterMes("todos") }}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 13, color: T.cardFg, outline: "none", minWidth: 110 }}>
              <option value="todos">Todos</option>
              {todosAnos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>Mês</label>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 13, color: T.cardFg, outline: "none", minWidth: 170 }}>
              <option value="todos">Todos os meses</option>
              {todosMeses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {(filterAno !== "todos" || filterMes !== "todos") && (
            <button onClick={() => { setFilterAno("todos"); setFilterMes("todos") }}
              style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, color: "#991b1b", fontWeight: 600, cursor: "pointer", marginBottom: 0 }}>
              ✕ Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ background: "#f0fdf4", border: `1px solid #86efac`, borderRadius: 8, padding: "9px 16px" }}>
            <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>{periodoLabel}</span>
          </div>
        </div>
      </div>

      {/* Orçamento input */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Orçamento total de marketing
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={orcamentoInput} onChange={e => setOrcamentoInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveOrcamento() }}
            placeholder="Ex: R$ 50.000,00"
            style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 14, color: T.cardFg, outline: "none", width: 240 }}
          />
          <button onClick={saveOrcamento} style={{ background: "#0d9488", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Salvar
          </button>
          <span style={{ fontSize: 12, color: T.mutedFg }}>Pressione Enter ou clique em Salvar</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: T.mutedFg, fontSize: 14 }}>Carregando dados…</div>
      ) : (
        <>
          {/* Cards métricas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
            {[
              { label: "Orçamento total", value: formatBRL(totalBudget), color: T.cardFg },
              { label: "Já utilizado",     value: formatBRL(totalGasto),  color: "#185FA5" },
              { label: "Saldo livre",      value: formatBRL(saldoLivre),  color: saldoLivre < 0 ? "#991b1b" : "#065f46" },
            ].map(card => (
              <div key={card.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", boxShadow: T.elevSm }}>
                <p style={{ fontSize: 11, color: T.mutedFg, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>{card.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Barra de progresso */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: T.mutedFg, fontWeight: 600 }}>Utilização do orçamento</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ height: 12, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 20, transition: "width .4s ease" }} />
            </div>
          </div>

          {/* Breakdown por campanha */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: T.elevSm, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Breakdown por campanha</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Campanha", "Contratados", "Gasto", "% do orçamento"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b, i) => {
                  const campPct = totalBudget > 0 ? Math.min(100, Math.round((b.gasto / totalBudget) * 100)) : 0
                  const color = CAMPAIGN_COLORS[b.id] ?? "#0d9488"
                  return (
                    <tr key={b.id} style={{ borderBottom: i < breakdown.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: color + "18", color }}>{b.label}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 13, color: T.cardFg }}>{b.contratados} influencer{b.contratados !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: T.cardFg }}>{formatBRL(b.gasto)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
                            <div style={{ height: "100%", width: `${campPct}%`, background: color, borderRadius: 20 }} />
                          </div>
                          <span style={{ fontSize: 13, color: T.mutedFg, minWidth: 38, textAlign: "right" }}>{campPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: T.bg, borderTop: `2px solid ${T.border}` }}>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, color: T.cardFg }}>Total</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: T.cardFg }}>{breakdown.reduce((a, b) => a + b.contratados, 0)} influencers</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "#185FA5" }}>{formatBRL(totalGasto)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 20 }} />
                      </div>
                      <span style={{ fontSize: 13, color: T.mutedFg, minWidth: 38, textAlign: "right" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("geral")
  const [rows, setRows]           = useState<Row[]>([])
  const [loading, setLoading]     = useState(false)
  const [filters, setFilters]     = useState<Record<string, string>>({})
  const [showNew, setShowNew]     = useState(false)

  const tabInfo = TABS.find(t => t.id === activeTab)!
  const cols    = activeTab !== "geral" ? (COLS_BY_TAB[activeTab] ?? []) : []

  async function load() {
    if (activeTab === "geral" || !tabInfo.table) return
    setLoading(true)
    const { data } = await getSupabase()
      .from(tabInfo.table)
      .select("*")
      .order("ano", { ascending: false })
      .order("mes")
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => { setFilters({}); setRows([]); load() }, [activeTab])

  async function deleteRow(id: unknown) {
    if (!confirm("Excluir este influencer?")) return
    await getSupabase().from(tabInfo.table).delete().eq("id", id)
    load()
  }

  const filtered = rows.filter(r =>
    Object.entries(filters).every(([k, v]) =>
      !v || String(r[k] ?? "").toLowerCase().includes(v.toLowerCase())
    )
  )

  const activeFiltersCount = Object.values(filters).filter(Boolean).length
  const totalW = cols.reduce((s, c) => s + c.w, 0) + 60

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: "0 0 3px" }}>Controle de Influencers</p>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>Clique em qualquer célula para editar. Use ▾ em cada coluna para filtrar.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all .15s",
            background: activeTab === t.id ? "#0d9488" : T.card,
            color:      activeTab === t.id ? "#fff"     : T.mutedFg,
            boxShadow:  activeTab === t.id ? "none"     : T.elevSm,
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "geral" && <GeralTab />}

      {activeTab !== "geral" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            {activeFiltersCount > 0 && (
              <button onClick={() => setFilters({})} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, color: "#991b1b", fontWeight: 600, cursor: "pointer" }}>
                ✕ Limpar filtros ({activeFiltersCount})
              </button>
            )}
            <div style={{ flex: 1 }} />
            <p style={{ margin: 0, fontSize: 13, color: T.mutedFg }}>
              {loading ? "Carregando…" : `${filtered.length} influencer${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <button onClick={() => setShowNew(true)} style={{ background: "#0d9488", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              + Novo
            </button>
          </div>

          <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, boxShadow: T.elevSm, overflowX: "auto" }}>
            <div style={{ minWidth: totalW }}>
              {/* Cabeçalho */}
              <div style={{ display: "flex", borderBottom: `2px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 10 }}>
                {cols.map(col => (
                  <div key={col.key} style={{ width: col.w, flexShrink: 0, padding: "12px 12px", borderRight: `1px solid ${T.border}` }}>
                    <ColFilter col={col} rows={rows} filter={filters[col.key] ?? ""} setFilter={v => setFilters(p => ({ ...p, [col.key]: v }))} />
                  </div>
                ))}
                <div style={{ width: 60, flexShrink: 0 }} />
              </div>

              {/* Linhas */}
              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: T.mutedFg, fontSize: 14 }}>Carregando…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: T.mutedFg, fontSize: 14 }}>Nenhum resultado.</div>
              ) : filtered.map((row, i) => (
                <div key={String(row.id)} style={{
                  display: "flex", transition: "background .1s",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {cols.map(col => (
                    <div key={col.key} style={{ width: col.w, flexShrink: 0, padding: "10px 12px", borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center", minHeight: 50 }}>
                      <EditableCell value={String(row[col.key] ?? "")} colKey={col.key} rowId={row.id} tableName={tabInfo.table} type={col.type} onSaved={load} />
                    </div>
                  ))}
                  <div style={{ width: 60, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <button onClick={() => deleteRow(row.id)} title="Excluir" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 15, color: "#ef4444", padding: "5px 7px", borderRadius: 4 }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showNew && <NewModal cols={cols} tableName={tabInfo.table} onClose={() => setShowNew(false)} onSaved={load} />}
        </>
      )}
    </TeamLayout>
  )
}
