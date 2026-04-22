"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { getSupabase } from "@/app/social-midia/calendario-seazone/_lib/supabase"

const NAVY  = "#0f1d4e"
const ACT_W = 70
const MIN_W = 40

const ROW_HEIGHTS = [
  { label: "Compacta",    value: 36  },
  { label: "Normal",      value: 52  },
  { label: "Confortável", value: 72  },
  { label: "Espaçosa",    value: 100 },
]
const DEFAULT_ROW_HEIGHT = 52

type Tab = "geral" | "expansao_sp" | "expansao_salvador" | "seazone"
type Row = Record<string, unknown>
type SortState = { key: string; dir: "asc" | "desc" } | null
type ActiveCell = { rowId: unknown; ci: number } | null
type HistEntry  = { rowId: unknown; colKey: string; oldVal: string; newVal: string }

const TABS = [
  { id: "geral"             as Tab, label: "Geral",             table: "" },
  { id: "expansao_sp"       as Tab, label: "Expansão SP",       table: "influencers_expansao_sp" },
  { id: "expansao_salvador" as Tab, label: "Expansão Salvador", table: "influencers_expansao_salvador" },
  { id: "seazone"           as Tab, label: "Seazone",           table: "influencers_seazone" },
]
const DATA_TABS = TABS.filter(t => t.id !== "geral")

type ColDef = { key: string; label: string; w: number; type?: string; filterType?: string }

const BASE_COLS: ColDef[] = [
  { key: "ano",                    label: "Ano",              w: 55,  filterType: "select" },
  { key: "mes",                    label: "Mês",              w: 85,  filterType: "select" },
  { key: "categoria",              label: "Categoria",        w: 90,  filterType: "select", type: "categoria" },
  { key: "perfil",                 label: "Perfil",           w: 120, filterType: "text" },
  { key: "link_perfil",            label: "Link perfil",      w: 80,  filterType: "text", type: "links" },
  { key: "seguidores",             label: "Seguidores",       w: 80,  filterType: "text" },
  { key: "contato",                label: "Contato",          w: 140, filterType: "text" },
  { key: "status_contrato",        label: "Status",           w: 130, filterType: "select", type: "status" },
  { key: "valor_trabalho",         label: "Valor trabalho",   w: 100, filterType: "text" },
  { key: "valor_hospedagem",       label: "Valor hospedagem", w: 100, filterType: "text" },
  { key: "data_contratacao",       label: "Data contratação", w: 105, filterType: "text" },
  { key: "data_pagamento",         label: "Data pagamento",   w: 105, filterType: "text" },
  { key: "conteudo_orcado",        label: "Conteúdo orçado",  w: 150, filterType: "text", type: "multiline" },
  { key: "observacoes",            label: "Observações",      w: 150, filterType: "text", type: "multiline" },
  { key: "cupom",                  label: "Cupom",            w: 85,  filterType: "text" },
  { key: "data_validade_cupom",    label: "Validade cupom",   w: 100, filterType: "text" },
  { key: "data_visita_hospedagem", label: "Data visita",      w: 100, filterType: "text" },
  { key: "data_hora_post",         label: "Data do post",     w: 100, filterType: "text" },
  { key: "link_publicacao",        label: "Link do post",     w: 80,  filterType: "text", type: "links" },
]

const COLS_BY_TAB: Record<string, ColDef[]> = {
  expansao_sp:       BASE_COLS,
  expansao_salvador: BASE_COLS,
  seazone: [
    BASE_COLS[0],
    { key: "cidade", label: "Cidade", w: 110, filterType: "select" },
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
  options: string[]; value: string
  onSelect: (v: string) => void; onClose: () => void
  getStyle?: (v: string) => { bg: string; color: string }
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [onClose])
  return (
    <div ref={ref} style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 500, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.14)", minWidth: 170, overflow: "hidden" }}>
      {options.map(opt => {
        const s = getStyle ? getStyle(opt) : { bg: "#eef1f8", color: NAVY }
        const active = (value || "").toLowerCase().trim() === opt.toLowerCase().trim()
        return (
          <div key={opt} onClick={() => { onSelect(opt); onClose() }}
            style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: s.color, background: active ? s.bg : "transparent", borderLeft: active ? `3px solid ${s.color}` : "3px solid transparent", display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = s.bg)}
            onMouseLeave={e => (e.currentTarget.style.background = active ? s.bg : "transparent")}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />{opt}
          </div>
        )
      })}
    </div>
  )
}

// ── ColFilter ─────────────────────────────────────────────────────────────────
function ColFilter({ col, label, rows, filter, setFilter, sort, setSort, onLabelSave }: {
  col: ColDef; label: string; rows: Row[]
  filter: string[]; setFilter: (v: string[]) => void
  sort: "asc" | "desc" | null; setSort: (v: "asc" | "desc" | null) => void
  onLabelSave: (v: string) => void
}) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState("")
  const [editingLabel, setEditing] = useState(false)
  const [labelVal, setLabelVal]   = useState(label)
  const ref      = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLabelVal(label) }, [label])
  useEffect(() => { if (editingLabel) labelRef.current?.focus() }, [editingLabel])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch("") } }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [])

  const uniqueVals = Array.from(new Set(rows.map(r => String(r[col.key] ?? "")).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"))
  const hasActive  = filter.length > 0 || sort !== null
  const visible    = uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 4, width: "100%" }}>
      {editingLabel ? (
        <input ref={labelRef} value={labelVal} onChange={e => setLabelVal(e.target.value)}
          onBlur={() => { onLabelSave(labelVal); setEditing(false) }}
          onKeyDown={e => { if (e.key === "Enter") { onLabelSave(labelVal); setEditing(false) } if (e.key === "Escape") { setLabelVal(label); setEditing(false) } }}
          onClick={e => e.stopPropagation()}
          style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 4, padding: "2px 5px", outline: "none", minWidth: 0 }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Duplo clique para renomear"
          style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.35, flex: 1, cursor: "default", userSelect: "none", wordBreak: "break-word" }}>
          {label}{sort && <span style={{ marginLeft: 4, opacity: 0.8 }}>{sort === "asc" ? "↑" : "↓"}</span>}
        </span>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ background: hasActive ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 4, padding: "2px 5px", cursor: "pointer", fontSize: 10, color: "#fff", lineHeight: 1.4, flexShrink: 0, marginTop: 1 }}>▾</button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 6px 28px rgba(0,0,0,0.16)", minWidth: 240, maxHeight: 380, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 10px 8px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.mutedFg, margin: "0 0 7px", textTransform: "uppercase", letterSpacing: ".04em" }}>Ordenar</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => { setSort(sort === "asc" ? null : "asc"); setOpen(false) }} style={{ flex: 1, padding: "6px 8px", borderRadius: 7, fontSize: 13, cursor: "pointer", background: sort === "asc" ? NAVY : T.bg, color: sort === "asc" ? "#fff" : T.cardFg, border: `1px solid ${sort === "asc" ? NAVY : T.border}`, fontWeight: 600 }}>A → Z ↑</button>
              <button onClick={() => { setSort(sort === "desc" ? null : "desc"); setOpen(false) }} style={{ flex: 1, padding: "6px 8px", borderRadius: 7, fontSize: 13, cursor: "pointer", background: sort === "desc" ? NAVY : T.bg, color: sort === "desc" ? "#fff" : T.cardFg, border: `1px solid ${sort === "desc" ? NAVY : T.border}`, fontWeight: 600 }}>Z → A ↓</button>
            </div>
          </div>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar valor…"
              style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, padding: "7px 12px", borderBottom: `1px solid ${T.border}` }}>
            <button onClick={() => setFilter(uniqueVals)} style={{ fontSize: 12, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Todos</button>
            <span style={{ color: T.border }}>|</span>
            <button onClick={() => { setFilter([]); setSort(null); setOpen(false); setSearch("") }} style={{ fontSize: 12, color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>Limpar</button>
          </div>
          <div style={{ overflowY: "auto", padding: "4px 0" }}>
            {visible.map(v => {
              const checked = filter.includes(v); const isStatus = col.key === "status_contrato"; const s = isStatus ? getStatusStyle(v) : null
              return (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", cursor: "pointer", fontSize: 14, background: checked ? "#eef1f8" : "transparent" }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = T.bg }}
                  onMouseLeave={e => { e.currentTarget.style.background = checked ? "#eef1f8" : "transparent" }}>
                  <input type="checkbox" checked={checked} onChange={() => setFilter(checked ? filter.filter(f => f !== v) : [...filter, v])} style={{ accentColor: NAVY, width: 15, height: 15, flexShrink: 0 }} />
                  {isStatus && s && <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.cardFg }}>{v}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── EditableCell ──────────────────────────────────────────────────────────────
function EditableCell({
  value, colKey, type, rowHeight,
  isActive, isEditing, editValue, isFindMatch, isFindActive,
  onChange, onEditKeyDown, onActivate, onStartEdit, onBlurCommit,
  onSaveOption,
}: {
  value: string; colKey: string; type?: string; rowHeight: number
  isActive: boolean; isEditing: boolean; editValue: string
  isFindMatch: boolean; isFindActive: boolean
  onChange: (v: string) => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
  onActivate: () => void
  onStartEdit: (initialChar?: string) => void
  onBlurCommit: () => void
  onSaveOption: (v: string) => void
}) {
  const inputRef  = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => { if (isEditing) { inputRef.current?.focus(); inputRef.current?.select?.() } }, [isEditing])

  // Highlight style
  const bgStyle: React.CSSProperties = isFindActive
    ? { background: "#fde68a" }
    : isFindMatch
      ? { background: "#fef9c3" }
      : {}

  const taRows = rowHeight <= 36 ? 1 : rowHeight <= 52 ? 2 : rowHeight <= 72 ? 3 : 4

  function handleInputKeyDown(e: React.KeyboardEvent) {
    // Ctrl+Enter adds newline in textarea
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      const ta = inputRef.current as HTMLTextAreaElement | null
      if (ta && ta.tagName === "TEXTAREA") {
        const s = ta.selectionStart ?? editValue.length
        const end = ta.selectionEnd ?? s
        const nv = editValue.slice(0, s) + "\n" + editValue.slice(end)
        onChange(nv)
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1 })
      }
      return
    }
    onEditKeyDown(e)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff", border: `2px solid ${NAVY}`,
    borderRadius: 4, padding: "4px 7px", fontSize: 14, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  }

  // STATUS
  if (type === "status") {
    const s = getStatusStyle(value)
    return (
      <div style={{ position: "relative", width: "100%", ...bgStyle }}
        onClick={onActivate} onDoubleClick={() => onStartEdit()}>
        <span onClick={e => { e.stopPropagation(); onActivate(); setShowMenu(v => !v) }}
          style={{ background: s.bg, color: s.color, borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", userSelect: "none" }}>
          {value || "—"} <span style={{ fontSize: 9 }}>▾</span>
        </span>
        {showMenu && <OptionMenu options={STATUS_OPTIONS} value={value} onSelect={v => { onSaveOption(v); setShowMenu(false) }} onClose={() => setShowMenu(false)} getStyle={getStatusStyle} />}
      </div>
    )
  }

  // CATEGORIA
  if (type === "categoria") {
    return (
      <div style={{ position: "relative", width: "100%", ...bgStyle }}
        onClick={onActivate} onDoubleClick={() => onStartEdit()}>
        <span onClick={e => { e.stopPropagation(); onActivate(); setShowMenu(v => !v) }}
          style={{ background: value ? "#f0f9ff" : "#f3f4f6", color: value ? "#0369a1" : T.mutedFg, borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", userSelect: "none" }}>
          {value || "—"} <span style={{ fontSize: 9 }}>▾</span>
        </span>
        {showMenu && <OptionMenu options={CATEGORIA_OPTIONS} value={value} onSelect={v => { onSaveOption(v); setShowMenu(false) }} onClose={() => setShowMenu(false)} getStyle={() => ({ bg: "#f0f9ff", color: "#0369a1" })} />}
      </div>
    )
  }

  // LINKS
  if (type === "links") {
    const links = (value || "").split(/\n/).map(l => l.trim()).filter(l => l.startsWith("http"))
    if (isEditing) {
      return <textarea ref={inputRef} value={editValue} onChange={e => onChange(e.target.value)} onKeyDown={handleInputKeyDown} onBlur={onBlurCommit} placeholder="Um link por linha" rows={taRows}
        style={{ ...inputStyle, resize: "none", height: "100%" }} />
    }
    return (
      <div style={{ width: "100%", height: "100%", ...bgStyle }} onClick={onActivate} onDoubleClick={() => onStartEdit()}>
        {links.length === 0
          ? <span style={{ color: T.mutedFg, fontSize: 14, cursor: "text" }}>—</span>
          : links.map((l, i) => (
            <a key={i} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: "block", color: NAVY, fontSize: 14, lineHeight: 1.8, fontWeight: 600 }}>
              {links.length > 1 ? `Link ${i + 1} ↗` : "Ver ↗"}
            </a>
          ))}
      </div>
    )
  }

  // MULTILINE
  if (type === "multiline") {
    if (isEditing) {
      return <textarea ref={inputRef} value={editValue} onChange={e => onChange(e.target.value)} onKeyDown={handleInputKeyDown} onBlur={onBlurCommit} rows={taRows}
        style={{ ...inputStyle, resize: "none", height: "100%", whiteSpace: "pre-wrap" }} />
    }
    return (
      <div onClick={onActivate} onDoubleClick={() => onStartEdit()} style={{ cursor: "text", fontSize: 14, color: value ? T.cardFg : T.mutedFg, overflowY: "auto", lineHeight: 1.5, width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word", ...bgStyle }}>
        {value || "—"}
      </div>
    )
  }

  // PLAIN TEXT
  if (isEditing) {
    return <input ref={inputRef} value={editValue} onChange={e => onChange(e.target.value)} onKeyDown={handleInputKeyDown} onBlur={onBlurCommit}
      style={inputStyle} />
  }
  return (
    <div onClick={onActivate} onDoubleClick={() => onStartEdit()} style={{ cursor: "text", minHeight: 22, fontSize: 14, color: value ? T.cardFg : T.mutedFg, overflowY: "auto", lineHeight: 1.5, width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-word", ...bgStyle }}>
      {value || "—"}
    </div>
  )
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function CtxMenu({ x, y, items, onClose }: {
  x: number; y: number; onClose: () => void
  items: { label: string; icon: string; action: () => void; danger?: boolean }[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k)
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k) }
  }, [onClose])

  // Adjust position to not go off screen
  const style: React.CSSProperties = {
    position: "fixed", left: Math.min(x, window.innerWidth - 220),
    top: Math.min(y, window.innerHeight - items.length * 44 - 20),
    zIndex: 1000, background: "#fff", border: `1px solid ${T.border}`,
    borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    minWidth: 210, overflow: "hidden", padding: "4px 0",
  }
  return (
    <div ref={ref} style={style}>
      {items.map((item, i) => (
        <div key={i} onClick={() => { item.action(); onClose() }}
          style={{ padding: "10px 16px", fontSize: 14, cursor: "pointer", color: item.danger ? "#ef4444" : T.cardFg, display: "flex", alignItems: "center", gap: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = item.danger ? "#fee2e2" : T.bg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
        </div>
      ))}
    </div>
  )
}

// ── InlineNewRow ──────────────────────────────────────────────────────────────
function InlineNewRow({ cols, colWidths, tableName, onClose, onSaved }: {
  cols: ColDef[]; colWidths: Record<string, number>
  tableName: string; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState<Record<string, string>>(() => { const i: Record<string, string> = {}; cols.forEach(c => { i[c.key] = "" }); return i })
  const [saving, setSaving] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  async function save() {
    setSaving(true)
    const payload: Record<string, unknown> = {}
    cols.forEach(c => { const v = form[c.key]?.trim() || null; payload[c.key] = c.key === "ano" && v ? Number(v) : v })
    await getSupabase().from(tableName).insert(payload)
    setSaving(false); onSaved(); onClose()
  }
  const inp: React.CSSProperties = { width: "100%", border: `1px solid ${T.border}`, borderRadius: 5, padding: "4px 7px", fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box", color: T.cardFg }
  return (
    <div style={{ display: "flex", width: "100%", background: "#eef3ff", borderBottom: `2px solid ${NAVY}`, borderTop: `2px solid ${NAVY}` }}>
      {cols.map((col, idx) => {
        const w = colWidths[col.key] ?? col.w
        return (
          <div key={col.key} style={{ flex: `${w} 0 ${w}px`, minWidth: 0, padding: "6px 8px", borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center" }}>
            {col.type === "status" ? (
              <select value={form[col.key]} onChange={e => setForm(p => ({ ...p, [col.key]: e.target.value }))} style={inp}><option value="">—</option>{STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
            ) : col.type === "categoria" ? (
              <select value={form[col.key]} onChange={e => setForm(p => ({ ...p, [col.key]: e.target.value }))} style={inp}><option value="">—</option>{CATEGORIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
            ) : col.type === "multiline" || col.type === "links" ? (
              <textarea value={form[col.key]} onChange={e => setForm(p => ({ ...p, [col.key]: e.target.value }))} placeholder={col.type === "links" ? "Um link por linha" : ""} rows={2} style={{ ...inp, fontFamily: "inherit", resize: "vertical" }} />
            ) : (
              <input ref={idx === 0 ? firstRef : undefined} value={form[col.key]} onChange={e => setForm(p => ({ ...p, [col.key]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") onClose() }} style={inp} />
            )}
          </div>
        )
      })}
      <div style={{ flex: `${ACT_W} 0 ${ACT_W}px`, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: "4px" }}>
        <button onClick={save} disabled={saving} style={{ background: NAVY, border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 14, color: "#fff", cursor: "pointer", fontWeight: 700, width: "100%" }}>✓</button>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 14, color: T.mutedFg, cursor: "pointer", width: "100%" }}>✗</button>
      </div>
    </div>
  )
}

// ── GeralTab ──────────────────────────────────────────────────────────────────
function GeralTab() {
  const [orcamento, setOrcamento]           = useState("")
  const [orcamentoInput, setOrcamentoInput] = useState("")
  const [allRows, setAllRows]               = useState<Record<string, Row[]>>({})
  const [loading, setLoading]               = useState(true)
  const [filterAno, setFilterAno]           = useState("todos")
  const [filterMes, setFilterMes]           = useState("todos")

  useEffect(() => { const s = localStorage.getItem("influencers_orcamento_total") || ""; setOrcamento(s); setOrcamentoInput(s) }, [])
  useEffect(() => {
    async function loadAll() {
      setLoading(true); const results: Record<string, Row[]> = {}
      for (const t of DATA_TABS) { const { data } = await getSupabase().from(t.table).select("status_contrato,valor_trabalho,valor_hospedagem,ano,mes"); results[t.id] = data ?? [] }
      setAllRows(results); setLoading(false)
    }
    loadAll()
  }, [])

  function saveOrcamento() { setOrcamento(orcamentoInput); localStorage.setItem("influencers_orcamento_total", orcamentoInput) }
  const todosAnos  = Array.from(new Set(Object.values(allRows).flat().map(r => String(r.ano ?? "")).filter(Boolean))).sort().reverse()
  const todosMeses = Array.from(new Set(Object.values(allRows).flat().filter(r => filterAno === "todos" || String(r.ano) === filterAno).map(r => String(r.mes ?? "")).filter(Boolean))).sort()
  function rowPassFilter(r: Row) { return (filterAno === "todos" || String(r.ano) === filterAno) && (filterMes === "todos" || String(r.mes) === filterMes) }

  const totalBudget = parseBRL(orcamento)
  const breakdown = DATA_TABS.map(t => {
    const rs = (allRows[t.id] ?? []).filter(rowPassFilter)
    const contratados = rs.filter(r => String(r.status_contrato ?? "").toLowerCase().trim() === "contratado")
    const gasto = contratados.reduce((acc, r) => acc + parseBRL(r.valor_trabalho) + parseBRL(r.valor_hospedagem), 0)
    return { id: t.id, label: t.label, contratados: contratados.length, gasto }
  })
  const totalGasto = breakdown.reduce((acc, b) => acc + b.gasto, 0)
  const saldoLivre = totalBudget - totalGasto
  const pct = totalBudget > 0 ? Math.min(100, Math.round((totalGasto / totalBudget) * 100)) : 0
  const barColor = pct > 85 ? "#ef4444" : pct > 60 ? "#f59e0b" : NAVY
  const CAMPAIGN_COLORS: Record<string, string> = { expansao_sp: "#185FA5", expansao_salvador: "#B45309", seazone: "#2563eb" }
  const periodoLabel = filterAno === "todos" ? "Todos os períodos" : filterMes === "todos" ? `Ano ${filterAno}` : `${filterMes.replace(/^\d+\.\s*/, "")} de ${filterAno}`

  return (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>Filtrar por período</p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, color: T.mutedFg, fontWeight: 600 }}>Ano</label>
            <select value={filterAno} onChange={e => { setFilterAno(e.target.value); setFilterMes("todos") }} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 14, color: T.cardFg, outline: "none", minWidth: 110 }}>
              <option value="todos">Todos</option>{todosAnos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 13, color: T.mutedFg, fontWeight: 600 }}>Mês</label>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 14, color: T.cardFg, outline: "none", minWidth: 170 }}>
              <option value="todos">Todos os meses</option>{todosMeses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {(filterAno !== "todos" || filterMes !== "todos") && <button onClick={() => { setFilterAno("todos"); setFilterMes("todos") }} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 14, color: "#991b1b", fontWeight: 600, cursor: "pointer" }}>✕ Limpar</button>}
          <div style={{ flex: 1 }} />
          <div style={{ background: "#eef1f8", border: `1px solid ${NAVY}30`, borderRadius: 8, padding: "9px 16px" }}><span style={{ fontSize: 14, color: NAVY, fontWeight: 600 }}>{periodoLabel}</span></div>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: ".05em" }}>Orçamento total de marketing</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={orcamentoInput} onChange={e => setOrcamentoInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveOrcamento() }} placeholder="Ex: R$ 50.000,00" style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 15, color: T.cardFg, outline: "none", width: 240 }} />
          <button onClick={saveOrcamento} style={{ background: NAVY, border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 14, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Salvar</button>
          <span style={{ fontSize: 13, color: T.mutedFg }}>Pressione Enter ou clique em Salvar</span>
        </div>
      </div>
      {loading ? <div style={{ padding: 48, textAlign: "center", color: T.mutedFg }}>Carregando…</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
            {[{ label: "Orçamento total", value: formatBRL(totalBudget), color: T.cardFg }, { label: "Já utilizado", value: formatBRL(totalGasto), color: "#185FA5" }, { label: "Saldo livre", value: formatBRL(saldoLivre), color: saldoLivre < 0 ? "#991b1b" : "#065f46" }].map(c => (
              <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", boxShadow: T.elevSm }}>
                <p style={{ fontSize: 12, color: T.mutedFg, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>{c.label}</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: T.mutedFg, fontWeight: 600 }}>Utilização do orçamento</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ height: 12, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 20, transition: "width .4s ease" }} />
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: T.elevSm, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}` }}><p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: 0 }}>Breakdown por campanha</p></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.bg }}>{["Campanha", "Contratados", "Gasto", "% do orçamento"].map(h => <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {breakdown.map((b, i) => {
                  const campPct = totalBudget > 0 ? Math.min(100, Math.round((b.gasto / totalBudget) * 100)) : 0
                  const color = CAMPAIGN_COLORS[b.id] ?? NAVY
                  return (
                    <tr key={b.id} style={{ borderBottom: i < breakdown.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <td style={{ padding: "14px 20px" }}><span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 14, fontWeight: 600, background: color + "18", color }}>{b.label}</span></td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: T.cardFg }}>{b.contratados} influencer{b.contratados !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: T.cardFg }}>{formatBRL(b.gasto)}</td>
                      <td style={{ padding: "14px 20px" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}><div style={{ height: "100%", width: `${campPct}%`, background: color, borderRadius: 20 }} /></div><span style={{ fontSize: 14, color: T.mutedFg, minWidth: 38, textAlign: "right" }}>{campPct}%</span></div></td>
                    </tr>
                  )
                })}
                <tr style={{ background: T.bg, borderTop: `2px solid ${T.border}` }}>
                  <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: T.cardFg }}>Total</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: T.cardFg }}>{breakdown.reduce((a, b) => a + b.contratados, 0)} influencers</td>
                  <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: "#185FA5" }}>{formatBRL(totalGasto)}</td>
                  <td style={{ padding: "14px 20px" }}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}><div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 20 }} /></div><span style={{ fontSize: 14, color: T.mutedFg, minWidth: 38, textAlign: "right" }}>{pct}%</span></div></td>
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
  const [activeTab, setActiveTab]   = useState<Tab>("geral")
  const [rows, setRows]             = useState<Row[]>([])
  const [loading, setLoading]       = useState(false)
  const [filters, setFilters]       = useState<Record<string, string[]>>({})
  const [sort, setSort]             = useState<SortState>(null)
  const [showNewRow, setShowNewRow] = useState(false)
  const [rowHeight, setRowHeight]   = useState<number>(DEFAULT_ROW_HEIGHT)
  const [colWidths, setColWidths]   = useState<Record<string, number>>({})
  const [colLabels, setColLabels]   = useState<Record<string, string>>({})

  // ── Google Sheets-like state ──────────────────────────────────────────────
  const [activeCell, setActiveCell]     = useState<ActiveCell>(null)
  const [editingCell, setEditingCell]   = useState<ActiveCell>(null)
  const [editValue, setEditValue]       = useState("")
  const [preEditValue, setPreEditValue] = useState("")
  const [history, setHistory]           = useState<HistEntry[]>([])
  const [historyIdx, setHistoryIdx]     = useState(-1)
  const [clipboard, setClipboard]       = useState("")
  const [contextMenu, setContextMenu]   = useState<{ x: number; y: number; rowId: unknown } | null>(null)
  const [showFind, setShowFind]         = useState(false)
  const [findQuery, setFindQuery]       = useState("")
  const [findMatchIdx, setFindMatchIdx] = useState(0)

  const tabInfo      = TABS.find(t => t.id === activeTab)!
  const cols         = activeTab !== "geral" ? (COLS_BY_TAB[activeTab] ?? []) : []
  const activeTabRef = useRef(activeTab)
  const tableRef     = useRef<HTMLDivElement>(null)
  const gridRef      = useRef<HTMLDivElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)
  // Refs para evitar stale closures no commitEdit (crítico para blur)
  const editingCellRef  = useRef<ActiveCell>(null)
  const editValueRef    = useRef("")
  const preEditValueRef = useRef("")
  const rowsRef         = useRef<Row[]>([])
  const colsRef         = useRef<ColDef[]>([])
  const tabInfoRef2     = useRef(TABS.find(t => t.id === activeTab)!)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { editingCellRef.current = editingCell }, [editingCell])
  useEffect(() => { editValueRef.current = editValue }, [editValue])
  useEffect(() => { preEditValueRef.current = preEditValue }, [preEditValue])
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { colsRef.current = cols }, [cols])
  useEffect(() => { tabInfoRef2.current = TABS.find(t => t.id === activeTab)! }, [activeTab])

  function getW(key: string, fallback: number) { return colWidths[key] ?? fallback }
  const totalW = cols.reduce((s, c) => s + getW(c.key, c.w), 0) + ACT_W

  // ── Derived: sorted + filtered rows ──────────────────────────────────────
  const sortedFiltered = useMemo(() => {
    const f = rows.filter(r => Object.entries(filters).every(([k, vals]) => !vals.length || vals.includes(String(r[k] ?? ""))))
    if (!sort) return f
    return [...f].sort((a, b) => {
      const va = String(a[sort.key] ?? "").toLowerCase()
      const vb = String(b[sort.key] ?? "").toLowerCase()
      return sort.dir === "asc" ? va.localeCompare(vb, "pt-BR") : vb.localeCompare(va, "pt-BR")
    })
  }, [rows, filters, sort])

  // ── Find matches ──────────────────────────────────────────────────────────
  const findMatches = useMemo(() => {
    if (!findQuery.trim()) return []
    const q = findQuery.toLowerCase()
    const res: { rowId: unknown; ci: number }[] = []
    sortedFiltered.forEach(row => {
      cols.forEach((col, ci) => {
        if (String(row[col.key] ?? "").toLowerCase().includes(q)) res.push({ rowId: row.id, ci })
      })
    })
    return res
  }, [findQuery, sortedFiltered, cols])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function updateLocalCell(rowId: unknown, colKey: string, value: string | null) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: value } : r))
  }
  function pushHistory(entry: HistEntry) {
    setHistory(h => { const next = [...h.slice(0, historyIdx + 1), entry]; return next })
    setHistoryIdx(h => h + 1)
  }
  function getCurrentRi(rowId: unknown) { return sortedFiltered.findIndex(r => r.id === rowId) }

  // ── Cell navigation ───────────────────────────────────────────────────────
  function navigateTo(rowId: unknown, ci: number) {
    const ri = getCurrentRi(rowId)
    const clampedCi = Math.max(0, Math.min(ci, cols.length - 1))
    if (ri < 0) { setActiveCell({ rowId: sortedFiltered[0]?.id, ci: clampedCi }); return }
    setActiveCell({ rowId, ci: clampedCi })
  }
  function navigateDelta(dri: number, dci: number, currentRowId: unknown, currentCi: number) {
    const ri = getCurrentRi(currentRowId)
    const newRi = Math.max(0, Math.min(ri + dri, sortedFiltered.length - 1))
    const newCi = Math.max(0, Math.min(currentCi + dci, cols.length - 1))
    const newRowId = sortedFiltered[newRi]?.id
    if (newRowId !== undefined) setActiveCell({ rowId: newRowId, ci: newCi })
    gridRef.current?.focus()
  }

  // ── Edit operations ───────────────────────────────────────────────────────
  function startEdit(rowId: unknown, ci: number, initialChar?: string) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return
    const col = cols[ci]
    const currentVal = String(row[col.key] ?? "")
    const initialVal = initialChar !== undefined ? initialChar : currentVal
    editingCellRef.current  = { rowId, ci }
    editValueRef.current    = initialVal
    preEditValueRef.current = currentVal
    setEditingCell({ rowId, ci })
    setActiveCell({ rowId, ci })
    setPreEditValue(currentVal)
    setEditValue(initialVal)
  }

  async function commitEdit(dir?: "down" | "right" | "left" | "up") {
    // Usa refs para garantir valores atuais mesmo em stale closures (blur event)
    const ec  = editingCellRef.current
    const ev  = editValueRef.current
    const pev = preEditValueRef.current
    if (!ec) return
    // Zera o ref IMEDIATAMENTE para evitar chamada recursiva via blur→focus
    editingCellRef.current = null
    const { rowId, ci } = ec
    const row = rowsRef.current.find(r => r.id === rowId)
    const col = colsRef.current[ci]
    const table = tabInfoRef2.current?.table
    if (!row || !col || !table) { setEditingCell(null); return }
    const newVal = ev.trim()
    const oldVal = pev
    if (newVal !== oldVal) {
      updateLocalCell(rowId, col.key, newVal || null)
      await getSupabase().from(table).update({ [col.key]: newVal || null }).eq("id", rowId)
      pushHistory({ rowId, colKey: col.key, oldVal, newVal })
    }
    setEditingCell(null); setEditValue("")
    if (dir) { const deltas = { down: [1,0], up: [-1,0], right: [0,1], left: [0,-1] }; navigateDelta(deltas[dir][0], deltas[dir][1], rowId, ci) }
    else { gridRef.current?.focus() }
  }

  function abortEdit() {
    setEditValue(preEditValueRef.current)
    setEditingCell(null)
    editingCellRef.current = null
    gridRef.current?.focus()
  }

  async function clearActiveCell() {
    if (!activeCell) return
    const { rowId, ci } = activeCell
    const row = rows.find(r => r.id === rowId)
    const col = cols[ci]
    if (!row || !col) return
    const oldVal = String(row[col.key] ?? "")
    if (!oldVal) return
    updateLocalCell(rowId, col.key, null)
    await getSupabase().from(tabInfo.table).update({ [col.key]: null }).eq("id", rowId)
    pushHistory({ rowId, colKey: col.key, oldVal, newVal: "" })
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────
  function copyActiveCell() {
    if (!activeCell) return
    const row = rows.find(r => r.id === activeCell.rowId)
    const col = cols[activeCell.ci]
    if (!row || !col) return
    const val = String(row[col.key] ?? "")
    setClipboard(val)
    navigator.clipboard?.writeText(val).catch(() => {})
  }

  async function pasteToActiveCell() {
    if (!activeCell) return
    const row = rows.find(r => r.id === activeCell.rowId)
    const col = cols[activeCell.ci]
    if (!row || !col) return
    let val = clipboard
    try { val = await navigator.clipboard.readText() } catch {}
    if (val === undefined || val === null) return
    const oldVal = String(row[col.key] ?? "")
    updateLocalCell(activeCell.rowId, col.key, val || null)
    await getSupabase().from(tabInfo.table).update({ [col.key]: val || null }).eq("id", activeCell.rowId)
    if (val !== oldVal) pushHistory({ rowId: activeCell.rowId, colKey: col.key, oldVal, newVal: val })
  }

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  async function undo() {
    if (historyIdx < 0) return
    const entry = history[historyIdx]
    updateLocalCell(entry.rowId, entry.colKey, entry.oldVal || null)
    await getSupabase().from(tabInfo.table).update({ [entry.colKey]: entry.oldVal || null }).eq("id", entry.rowId)
    setHistoryIdx(h => h - 1)
  }
  async function redo() {
    if (historyIdx >= history.length - 1) return
    const entry = history[historyIdx + 1]
    updateLocalCell(entry.rowId, entry.colKey, entry.newVal || null)
    await getSupabase().from(tabInfo.table).update({ [entry.colKey]: entry.newVal || null }).eq("id", entry.rowId)
    setHistoryIdx(h => h + 1)
  }

  // ── Option save (status/categoria) ────────────────────────────────────────
  async function handleSaveOption(rowId: unknown, colKey: string, newVal: string) {
    const row = rows.find(r => r.id === rowId)
    const oldVal = String(row?.[colKey] ?? "")
    updateLocalCell(rowId, colKey, newVal)
    await getSupabase().from(tabInfo.table).update({ [colKey]: newVal }).eq("id", rowId)
    if (oldVal !== newVal) pushHistory({ rowId, colKey, oldVal, newVal })
  }

  // ── Grid keyboard handler (navigate mode) ─────────────────────────────────
  function handleGridKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return
    if (!activeCell) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); setShowFind(true); setTimeout(() => findInputRef.current?.focus(), 50) }
      return
    }
    const { rowId, ci } = activeCell
    const isEditing = editingCell?.rowId === rowId && editingCell?.ci === ci

    if (!isEditing) {
      if (e.key === "ArrowDown")  { e.preventDefault(); navigateDelta(1, 0, rowId, ci); return }
      if (e.key === "ArrowUp")    { e.preventDefault(); navigateDelta(-1, 0, rowId, ci); return }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateDelta(0, 1, rowId, ci); return }
      if (e.key === "ArrowLeft")  { e.preventDefault(); navigateDelta(0, -1, rowId, ci); return }
      if (e.key === "Tab")   { e.preventDefault(); navigateDelta(0, e.shiftKey ? -1 : 1, rowId, ci); return }
      if (e.key === "Enter") { e.preventDefault(); startEdit(rowId, ci); return }
      if (e.key === "F2")    { e.preventDefault(); startEdit(rowId, ci); return }
      if (e.key === "Escape") { setActiveCell(null); return }
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); clearActiveCell(); return }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === "c") { e.preventDefault(); copyActiveCell(); return }
        if (e.key === "v") { e.preventDefault(); pasteToActiveCell(); return }
        if (e.key === "z") { e.preventDefault(); undo(); return }
        if (e.key === "y") { e.preventDefault(); redo(); return }
        if (e.key === "f") { e.preventDefault(); setShowFind(true); setTimeout(() => findInputRef.current?.focus(), 50); return }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") { e.preventDefault(); redo(); return }
      // Printable char → start editing with that char
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        startEdit(rowId, ci, e.key)
      }
    }
  }

  // ── Keyboard inside editing cell ──────────────────────────────────────────
  function makeEditKeyDown(rowId: unknown, ci: number) {
    return (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") return // handled in cell for newline
      if (e.key === "Escape") { e.preventDefault(); abortEdit() }
      else if (e.key === "Tab") { e.preventDefault(); commitEdit(e.shiftKey ? "left" : "right") }
      else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit("down") }
    }
  }

  // ── Context menu actions ──────────────────────────────────────────────────
  async function insertEmptyRow() {
    const payload: Record<string, unknown> = {}; cols.forEach(c => { payload[c.key] = null })
    await getSupabase().from(tabInfo.table).insert(payload); loadRows()
  }
  async function duplicateRowById(rowId: unknown) {
    const row = rows.find(r => r.id === rowId)
    if (!row) return
    const payload: Record<string, unknown> = {}; cols.forEach(c => { payload[c.key] = row[c.key] ?? null })
    await getSupabase().from(tabInfo.table).insert(payload); loadRows()
  }
  async function deleteRowById(rowId: unknown) {
    if (!confirm("Excluir este influencer?")) return
    await getSupabase().from(tabInfo.table).delete().eq("id", rowId)
    if (activeCell?.rowId === rowId) setActiveCell(null)
    loadRows()
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  async function loadRows() {
    if (activeTab === "geral" || !tabInfo.table) return
    setLoading(true)
    const { data } = await getSupabase().from(tabInfo.table).select("*").order("ano", { ascending: false }).order("mes")
    setRows(data ?? []); setLoading(false)
  }

  // ── Labels, widths, row height ────────────────────────────────────────────
  async function loadLabels(tabId: string) {
    const { data } = await getSupabase().from("influencers_column_labels").select("col_key,label").eq("tab_id", tabId)
    const map: Record<string, string> = {}; data?.forEach(r => { map[String(r.col_key)] = String(r.label) }); setColLabels(map)
  }
  async function saveLabel(colKey: string, newLabel: string) {
    setColLabels(p => ({ ...p, [colKey]: newLabel }))
    await getSupabase().from("influencers_column_labels").upsert({ tab_id: activeTab, col_key: colKey, label: newLabel }, { onConflict: "tab_id,col_key" })
  }
  function getLabel(col: ColDef) { return colLabels[col.key] ?? col.label }

  function loadWidths(tabId: string, tabCols: ColDef[]) {
    const saved = localStorage.getItem(`influencers_col_widths_${tabId}`)
    const parsed = saved ? (() => { try { return JSON.parse(saved) } catch { return {} } })() : {}
    const result: Record<string, number> = {}; tabCols.forEach(c => { result[c.key] = parsed[c.key] ?? c.w }); setColWidths(result)
  }
  useEffect(() => { const s = localStorage.getItem("influencers_row_height"); if (s) setRowHeight(Number(s)) }, [])
  function changeRowHeight(h: number) { setRowHeight(h); localStorage.setItem("influencers_row_height", String(h)) }

  useEffect(() => {
    setFilters({}); setSort(null); setRows([]); setShowNewRow(false)
    setActiveCell(null); setEditingCell(null); setHistory([]); setHistoryIdx(-1)
    setShowFind(false); setFindQuery(""); setContextMenu(null)
    if (activeTab !== "geral") { const tc = COLS_BY_TAB[activeTab] ?? []; loadLabels(activeTab); loadWidths(activeTab, tc); loadRows() }
  }, [activeTab])

  // ── Column resize ─────────────────────────────────────────────────────────
  const resizeRef = useRef<{ colKey: string; startX: number; startW: number } | null>(null)
  function startResize(e: React.MouseEvent, colKey: string, currentW: number) {
    e.preventDefault(); e.stopPropagation()
    resizeRef.current = { colKey, startX: e.clientX, startW: currentW }
    document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"
  }
  useEffect(() => {
    function onMove(e: MouseEvent) { if (!resizeRef.current) return; const { colKey, startX, startW } = resizeRef.current; setColWidths(p => ({ ...p, [colKey]: Math.max(MIN_W, startW + (e.clientX - startX)) })) }
    function onUp() { if (!resizeRef.current) return; resizeRef.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; setColWidths(p => { localStorage.setItem(`influencers_col_widths_${activeTabRef.current}`, JSON.stringify(p)); return p }) }
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp)
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
  }, [])

  // ── Shift+scroll horizontal ───────────────────────────────────────────────
  useEffect(() => {
    const el = tableRef.current; if (!el) return
    function onWheel(e: WheelEvent) { if (e.shiftKey) { e.preventDefault(); if (el) el.scrollLeft += e.deltaY } }
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel)
  }, [activeTab])

  const activeFiltersCount = Object.values(filters).filter(v => v.length > 0).length
  function setColSort(colKey: string, dir: "asc" | "desc" | null) { setSort(dir === null ? null : { key: colKey, dir }) }
  function getColSort(colKey: string): "asc" | "desc" | null { return (!sort || sort.key !== colKey) ? null : sort.dir }

  // ── Find navigation ───────────────────────────────────────────────────────
  useEffect(() => { setFindMatchIdx(0) }, [findQuery])
  function findNext() { if (findMatches.length === 0) return; const next = (findMatchIdx + 1) % findMatches.length; setFindMatchIdx(next); setActiveCell(findMatches[next]) }
  function findPrev() { if (findMatches.length === 0) return; const prev = (findMatchIdx - 1 + findMatches.length) % findMatches.length; setFindMatchIdx(prev); setActiveCell(findMatches[prev]) }

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 19, fontWeight: 700, color: T.cardFg, margin: "0 0 3px" }}>Controle de Influencers</p>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
          Clique para selecionar · Duplo clique ou F2 para editar · Setas para navegar · Ctrl+Enter para nova linha na célula · Ctrl+Z/Y desfaz/refaz · Ctrl+C/V copia/cola · Ctrl+F buscar · Shift+scroll rola horizontalmente
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", background: activeTab === t.id ? NAVY : T.card, color: activeTab === t.id ? "#fff" : T.mutedFg, boxShadow: activeTab === t.id ? "none" : T.elevSm }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "geral" && <GeralTab />}

      {activeTab !== "geral" && (
        <>
          {/* Barra de controles */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
            {(activeFiltersCount > 0 || sort) && (
              <button onClick={() => { setFilters({}); setSort(null) }} style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 14, color: "#991b1b", fontWeight: 600, cursor: "pointer" }}>
                ✕ Limpar filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
              </button>
            )}
            {/* Undo/Redo */}
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={undo} disabled={historyIdx < 0} title="Desfazer (Ctrl+Z)"
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 14, cursor: historyIdx < 0 ? "not-allowed" : "pointer", opacity: historyIdx < 0 ? 0.4 : 1, boxShadow: T.elevSm }}>↩</button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Refazer (Ctrl+Y)"
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 14, cursor: historyIdx >= history.length - 1 ? "not-allowed" : "pointer", opacity: historyIdx >= history.length - 1 ? 0.4 : 1, boxShadow: T.elevSm }}>↪</button>
            </div>
            {/* Altura */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "5px 10px", boxShadow: T.elevSm }}>
              <span style={{ fontSize: 12, color: T.mutedFg, fontWeight: 600 }}>Altura:</span>
              {ROW_HEIGHTS.map(h => (
                <button key={h.value} onClick={() => changeRowHeight(h.value)} title={h.label}
                  style={{ padding: "4px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: rowHeight === h.value ? NAVY : T.bg, color: rowHeight === h.value ? "#fff" : T.mutedFg }}>{h.label}</button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <p style={{ margin: 0, fontSize: 14, color: T.mutedFg }}>{loading ? "Carregando…" : `${sortedFiltered.length} influencer${sortedFiltered.length !== 1 ? "s" : ""}`}</p>
            <button onClick={() => setShowNewRow(v => !v)} style={{ background: showNewRow ? "#fee2e2" : NAVY, border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 15, color: showNewRow ? "#991b1b" : "#fff", fontWeight: 600, cursor: "pointer" }}>
              {showNewRow ? "✗ Cancelar" : "+ Novo"}
            </button>
          </div>

          {/* Find bar */}
          {showFind && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", boxShadow: T.elevSm }}>
              <span style={{ fontSize: 14, color: T.mutedFg }}>🔍</span>
              <input ref={findInputRef} value={findQuery} onChange={e => setFindQuery(e.target.value)}
                placeholder="Buscar na tabela…"
                onKeyDown={e => { if (e.key === "Enter") { e.shiftKey ? findPrev() : findNext() } if (e.key === "Escape") { setShowFind(false); setFindQuery(""); gridRef.current?.focus() } }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: T.cardFg }} />
              <span style={{ fontSize: 13, color: T.mutedFg, minWidth: 60 }}>
                {findMatches.length === 0 ? (findQuery ? "Nenhum" : "") : `${findMatchIdx + 1} / ${findMatches.length}`}
              </span>
              <button onClick={findPrev} disabled={findMatches.length === 0} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 13 }}>↑</button>
              <button onClick={findNext} disabled={findMatches.length === 0} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 13 }}>↓</button>
              <button onClick={() => { setShowFind(false); setFindQuery(""); gridRef.current?.focus() }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: T.mutedFg, padding: "2px 4px" }}>✕</button>
            </div>
          )}

          {/* Tabela */}
          <div ref={tableRef} style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.card, boxShadow: T.elevSm, overflowX: "auto", width: "100%" }}>
            <div ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}
              style={{ minWidth: totalW, width: "100%", outline: "none" }}>

              {/* Cabeçalho */}
              <div style={{ display: "flex", borderBottom: `2px solid ${T.border}`, background: NAVY, position: "sticky", top: 0, zIndex: 10 }}>
                {cols.map(col => {
                  const w = getW(col.key, col.w)
                  return (
                    <div key={col.key} style={{ flex: `${w} 0 ${w}px`, minWidth: 0, padding: "0 8px", height: rowHeight, boxSizing: "border-box", display: "flex", alignItems: "center", borderRight: `1px solid rgba(255,255,255,0.12)`, position: "relative" }}>
                      <ColFilter col={col} label={getLabel(col)} rows={rows} filter={filters[col.key] ?? []} setFilter={v => setFilters(p => ({ ...p, [col.key]: v }))} sort={getColSort(col.key)} setSort={v => setColSort(col.key, v)} onLabelSave={v => saveLabel(col.key, v)} />
                      <div onMouseDown={e => startResize(e, col.key, w)}
                        style={{ position: "absolute", right: 0, top: "10%", bottom: "10%", width: 5, cursor: "col-resize", borderRadius: 3, background: "rgba(255,255,255,0.12)", zIndex: 20 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.5)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"} />
                    </div>
                  )
                })}
                <div style={{ flex: `${ACT_W} 0 ${ACT_W}px`, minWidth: 0 }} />
              </div>

              {/* Nova linha inline */}
              {showNewRow && <InlineNewRow cols={cols} colWidths={colWidths} tableName={tabInfo.table} onClose={() => setShowNewRow(false)} onSaved={loadRows} />}

              {/* Linhas de dados */}
              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: T.mutedFg, fontSize: 15 }}>Carregando…</div>
              ) : sortedFiltered.length === 0 ? (
                <div style={{ padding: 48, textAlign: "center", color: T.mutedFg, fontSize: 15 }}>Nenhum resultado.</div>
              ) : sortedFiltered.map((row, i) => (
                <div key={String(row.id)}
                  onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, rowId: row.id }) }}
                  style={{ display: "flex", transition: "background .1s", borderBottom: i < sortedFiltered.length - 1 ? `1px solid ${T.border}` : "none", minHeight: rowHeight }}
                  onMouseEnter={e => { if (!editingCell) e.currentTarget.style.background = T.bg }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                >
                  {cols.map((col, j) => {
                    const w = getW(col.key, col.w)
                    const isAct  = activeCell?.rowId === row.id && activeCell?.ci === j
                    const isEdit = editingCell?.rowId === row.id && editingCell?.ci === j
                    const isFM   = findMatches.some(m => m.rowId === row.id && m.ci === j)
                    const isFA   = findMatches[findMatchIdx]?.rowId === row.id && findMatches[findMatchIdx]?.ci === j
                    return (
                      <div key={col.key} style={{
                        flex: `${w} 0 ${w}px`, minWidth: 0,
                        padding: "8px 8px", borderRight: `1px solid ${T.border}`,
                        display: "flex", alignItems: "flex-start",
                        height: rowHeight, boxSizing: "border-box", overflow: "hidden",
                        outline: isAct ? `2px solid ${NAVY}` : "none",
                        outlineOffset: "-1px",
                        zIndex: isAct ? 2 : "auto",
                        position: "relative",
                      }}>
                        <EditableCell
                          value={String(row[col.key] ?? "")}
                          colKey={col.key} type={col.type} rowHeight={rowHeight}
                          isActive={isAct} isEditing={isEdit}
                          editValue={editValue}
                          isFindMatch={isFM} isFindActive={isFA}
                          onChange={(v) => { editValueRef.current = v; setEditValue(v) }}
                          onEditKeyDown={makeEditKeyDown(row.id, j)}
                          onActivate={() => { setActiveCell({ rowId: row.id, ci: j }); setEditingCell(null); gridRef.current?.focus() }}
                          onStartEdit={(initialChar) => startEdit(row.id, j, initialChar)}
                          onBlurCommit={commitEdit}
                          onSaveOption={v => handleSaveOption(row.id, col.key, v)}
                        />
                      </div>
                    )
                  })}
                  <div style={{ flex: `${ACT_W} 0 ${ACT_W}px`, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: rowHeight, boxSizing: "border-box" }}>
                    <button onClick={() => duplicateRowById(row.id)} title="Duplicar linha" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: T.mutedFg, padding: "5px 6px", borderRadius: 4 }}>⧉</button>
                    <button onClick={() => deleteRowById(row.id)} title="Excluir" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "#ef4444", padding: "5px 6px", borderRadius: 4 }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context Menu */}
          {contextMenu && (
            <CtxMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} items={[
              { label: "Inserir linha vazia", icon: "⊕", action: insertEmptyRow },
              { label: "Duplicar linha", icon: "⧉", action: () => duplicateRowById(contextMenu.rowId) },
              { label: "Copiar célula ativa", icon: "📋", action: copyActiveCell },
              { label: "Colar na célula ativa", icon: "📌", action: pasteToActiveCell },
              { label: "Limpar célula", icon: "🗑", action: clearActiveCell },
              { label: "Excluir linha", icon: "✕", danger: true, action: () => deleteRowById(contextMenu.rowId) },
            ]} />
          )}
        </>
      )}
    </TeamLayout>
  )
}
