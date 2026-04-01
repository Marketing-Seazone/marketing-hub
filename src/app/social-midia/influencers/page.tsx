"use client"

import { useEffect, useState, useRef } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { getSupabase } from "@/app/social-midia/calendario-seazone/_lib/supabase"

// ── Tipos ────────────────────────────────────────────────────────────────────
type Tab = "expansao_sp" | "expansao_salvador" | "vistas" | "seazone"
type Row = Record<string, unknown>

const TABS = [
  { id: "expansao_sp"       as Tab, label: "Expansão SP",       table: "influencers_expansao_sp" },
  { id: "expansao_salvador" as Tab, label: "Expansão Salvador", table: "influencers_expansao_salvador" },
  { id: "vistas"            as Tab, label: "Vistas de Anitá",   table: "influencers_vistas" },
  { id: "seazone"           as Tab, label: "Seazone",           table: "influencers_seazone" },
]

type ColDef = {
  key: string
  label: string
  w: number          // largura mínima em px
  type?: string      // "status" | "links" | "multiline"
  filterType?: string // "select" | "text"
}

// Colunas por aba — todas visíveis na tabela
const COLS_BY_TAB: Record<Tab, ColDef[]> = {
  expansao_sp: [
    { key: "ano",                    label: "Ano",          w: 52,  filterType: "select" },
    { key: "mes",                    label: "Mês",          w: 100, filterType: "select" },
    { key: "categoria",              label: "Cat.",         w: 64,  filterType: "select" },
    { key: "perfil",                 label: "Perfil",       w: 140, filterType: "text" },
    { key: "seguidores",             label: "Seg.",         w: 62,  filterType: "text" },
    { key: "contato",                label: "Contato",      w: 140, filterType: "text" },
    { key: "status_contrato",        label: "Status",       w: 130, filterType: "select", type: "status" },
    { key: "valor_trabalho",         label: "Vl. Trab.",    w: 90,  filterType: "text" },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",    w: 84,  filterType: "text" },
    { key: "data_contratacao",       label: "Contratação",  w: 90,  filterType: "text" },
    { key: "data_pagamento",         label: "Pagamento",    w: 90,  filterType: "text" },
    { key: "conteudo_orcado",        label: "Conteúdo",     w: 140, filterType: "text", type: "multiline" },
    { key: "observacoes",            label: "Obs.",         w: 140, filterType: "text", type: "multiline" },
    { key: "cupom",                  label: "Cupom",        w: 84,  filterType: "text" },
    { key: "data_validade_cupom",    label: "Val. Cupom",   w: 90,  filterType: "text" },
    { key: "data_visita_hospedagem", label: "Visita",       w: 110, filterType: "text" },
    { key: "data_hora_post",         label: "Post",         w: 110, filterType: "text" },
    { key: "link_publicacao",        label: "Links",        w: 72,  filterType: "text", type: "links" },
    { key: "quantidade_conversoes",  label: "Conv.",        w: 52,  filterType: "text" },
    { key: "valor_total_reservas",   label: "Vl. Res.",     w: 90,  filterType: "text" },
  ],
  expansao_salvador: [
    // sem coluna cidade
    { key: "ano",                    label: "Ano",          w: 52,  filterType: "select" },
    { key: "mes",                    label: "Mês",          w: 100, filterType: "select" },
    { key: "categoria",              label: "Cat.",         w: 64,  filterType: "select" },
    { key: "perfil",                 label: "Perfil",       w: 140, filterType: "text" },
    { key: "seguidores",             label: "Seg.",         w: 62,  filterType: "text" },
    { key: "contato",                label: "Contato",      w: 140, filterType: "text" },
    { key: "status_contrato",        label: "Status",       w: 130, filterType: "select", type: "status" },
    { key: "valor_trabalho",         label: "Vl. Trab.",    w: 90,  filterType: "text" },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",    w: 84,  filterType: "text" },
    { key: "data_contratacao",       label: "Contratação",  w: 90,  filterType: "text" },
    { key: "data_pagamento",         label: "Pagamento",    w: 90,  filterType: "text" },
    { key: "conteudo_orcado",        label: "Conteúdo",     w: 140, filterType: "text", type: "multiline" },
    { key: "observacoes",            label: "Obs.",         w: 140, filterType: "text", type: "multiline" },
    { key: "cupom",                  label: "Cupom",        w: 84,  filterType: "text" },
    { key: "data_validade_cupom",    label: "Val. Cupom",   w: 90,  filterType: "text" },
    { key: "data_visita_hospedagem", label: "Visita",       w: 110, filterType: "text" },
    { key: "data_hora_post",         label: "Post",         w: 110, filterType: "text" },
    { key: "link_publicacao",        label: "Links",        w: 72,  filterType: "text", type: "links" },
    { key: "quantidade_conversoes",  label: "Conv.",        w: 52,  filterType: "text" },
    { key: "valor_total_reservas",   label: "Vl. Res.",     w: 90,  filterType: "text" },
  ],
  vistas: [
    { key: "ano",                    label: "Ano",          w: 52,  filterType: "select" },
    { key: "mes",                    label: "Mês",          w: 100, filterType: "select" },
    { key: "categoria",              label: "Cat.",         w: 64,  filterType: "select" },
    { key: "perfil",                 label: "Perfil",       w: 140, filterType: "text" },
    { key: "seguidores",             label: "Seg.",         w: 62,  filterType: "text" },
    { key: "contato",                label: "Contato",      w: 140, filterType: "text" },
    { key: "status_contrato",        label: "Status",       w: 130, filterType: "select", type: "status" },
    { key: "valor_trabalho",         label: "Vl. Trab.",    w: 90,  filterType: "text" },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",    w: 84,  filterType: "text" },
    { key: "data_contratacao",       label: "Contratação",  w: 90,  filterType: "text" },
    { key: "data_pagamento",         label: "Pagamento",    w: 90,  filterType: "text" },
    { key: "observacoes",            label: "Obs.",         w: 140, filterType: "text", type: "multiline" },
    { key: "cupom",                  label: "Cupom",        w: 84,  filterType: "text" },
    { key: "data_validade_cupom",    label: "Val. Cupom",   w: 90,  filterType: "text" },
    { key: "data_visita_hospedagem", label: "Visita",       w: 110, filterType: "text" },
    { key: "data_hora_post",         label: "Post",         w: 110, filterType: "text" },
    { key: "link_publicacao",        label: "Links",        w: 72,  filterType: "text", type: "links" },
    { key: "quantidade_conversoes",  label: "Conv.",        w: 52,  filterType: "text" },
    { key: "valor_total_reservas",   label: "Vl. Res.",     w: 90,  filterType: "text" },
  ],
  seazone: [
    { key: "ano",                    label: "Ano",          w: 52,  filterType: "select" },
    { key: "cidade",                 label: "Cidade",       w: 100, filterType: "select" },
    { key: "mes",                    label: "Mês",          w: 100, filterType: "select" },
    { key: "categoria",              label: "Cat.",         w: 64,  filterType: "select" },
    { key: "perfil",                 label: "Perfil",       w: 140, filterType: "text" },
    { key: "seguidores",             label: "Seg.",         w: 62,  filterType: "text" },
    { key: "contato",                label: "Contato",      w: 140, filterType: "text" },
    { key: "status_contrato",        label: "Status",       w: 130, filterType: "select", type: "status" },
    { key: "valor_trabalho",         label: "Vl. Trab.",    w: 90,  filterType: "text" },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",    w: 84,  filterType: "text" },
    { key: "data_contratacao",       label: "Contratação",  w: 90,  filterType: "text" },
    { key: "data_pagamento",         label: "Pagamento",    w: 90,  filterType: "text" },
    { key: "conteudo_orcado",        label: "Conteúdo",     w: 140, filterType: "text", type: "multiline" },
    { key: "observacoes",            label: "Obs.",         w: 140, filterType: "text", type: "multiline" },
    { key: "cupom",                  label: "Cupom",        w: 84,  filterType: "text" },
    { key: "data_validade_cupom",    label: "Val. Cupom",   w: 90,  filterType: "text" },
    { key: "data_visita_hospedagem", label: "Visita",       w: 110, filterType: "text" },
    { key: "data_hora_post",         label: "Post",         w: 110, filterType: "text" },
    { key: "link_publicacao",        label: "Links",        w: 72,  filterType: "text", type: "links" },
    { key: "quantidade_conversoes",  label: "Conv.",        w: 52,  filterType: "text" },
    { key: "valor_total_reservas",   label: "Vl. Res.",     w: 90,  filterType: "text" },
  ],
}

const STATUS_OPTIONS = ["Contratado", "Não contratado", "aguardando", "Permuta"]

function getStatusStyle(val: string) {
  const v = (val || "").toLowerCase().trim()
  if (v === "contratado")     return { bg: "#d1fae5", color: "#065f46" }
  if (v === "não contratado") return { bg: "#fee2e2", color: "#991b1b" }
  if (v === "aguardando")     return { bg: "#fef9c3", color: "#854d0e" }
  if (v === "permuta")        return { bg: "#e0e7ff", color: "#3730a3" }
  return { bg: "#f3f4f6", color: "#374151" }
}

// ── Status dropdown ───────────────────────────────────────────────────────────
function StatusMenu({ value, onSelect, onClose }: {
  value: string; onSelect: (v: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [onClose])
  return (
    <div ref={ref} style={{
      position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 300,
      background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
      boxShadow: "0 6px 24px rgba(0,0,0,0.14)", minWidth: 170, overflow: "hidden",
    }}>
      {STATUS_OPTIONS.map(opt => {
        const s = getStatusStyle(opt)
        const active = (value || "").toLowerCase().trim() === opt.toLowerCase().trim()
        return (
          <div key={opt} onClick={() => { onSelect(opt); onClose() }} style={{
            padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const uniqueVals = Array.from(
    new Set(rows.map(r => String(r[col.key] ?? "")).filter(Boolean))
  ).sort()

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch("") } }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const hasFilter = Boolean(filter)

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: T.mutedFg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {col.label}
      </span>
      <button onClick={() => setOpen(v => !v)} style={{
        background: hasFilter ? "#0d9488" : "transparent",
        border: hasFilter ? "none" : `1px solid ${T.border}`,
        borderRadius: 3, padding: "1px 4px", cursor: "pointer",
        fontSize: 8, color: hasFilter ? "#fff" : T.mutedFg, lineHeight: 1.4, flexShrink: 0,
      }}>▾</button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 180,
          maxHeight: 260, display: "flex", flexDirection: "column",
        }}>
          {/* Busca dentro do filtro */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{
                width: "100%", border: `1px solid ${T.border}`, borderRadius: 6,
                padding: "5px 8px", fontSize: 11, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", padding: "4px 0" }}>
            <div onClick={() => { setFilter(""); setOpen(false); setSearch("") }} style={{
              padding: "7px 14px", fontSize: 11, cursor: "pointer",
              color: !filter ? "#0d9488" : T.mutedFg, fontWeight: !filter ? 700 : 400,
            }}>Todos</div>
            {uniqueVals
              .filter(v => v.toLowerCase().includes(search.toLowerCase()))
              .map(v => {
                const isStatus = col.key === "status_contrato"
                const s = isStatus ? getStatusStyle(v) : null
                return (
                  <div key={v} onClick={() => { setFilter(v); setOpen(false); setSearch("") }} style={{
                    padding: "7px 14px", fontSize: 11, cursor: "pointer",
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
  const [editing, setEditing]       = useState(false)
  const [val, setVal]               = useState(value)
  const [showStatus, setShowStatus] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setVal(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  async function save(newVal: string) {
    if (newVal.trim() === (value ?? "").trim()) { setEditing(false); return }
    await getSupabase().from(tableName).update({ [colKey]: newVal.trim() || null }).eq("id", rowId)
    setEditing(false)
    onSaved()
  }

  async function saveStatus(newVal: string) {
    setVal(newVal)
    await getSupabase().from(tableName).update({ [colKey]: newVal }).eq("id", rowId)
    onSaved()
  }

  // Links — múltiplos
  if (type === "links") {
    const links = (val || "").split(/[\n\s]+/).filter(l => l.startsWith("http"))
    return (
      <div style={{ width: "100%" }}>
        {editing ? (
          <textarea ref={inputRef} value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => save(val)}
            placeholder="Um link por linha"
            rows={3}
            style={{
              width: "100%", background: "#fff", border: `2px solid #0d9488`,
              borderRadius: 6, padding: "3px 5px", fontSize: 10,
              fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        ) : (
          <div onClick={() => setEditing(true)} style={{ cursor: "pointer", minHeight: 16 }}>
            {links.length === 0
              ? <span style={{ color: T.mutedFg, fontSize: 10 }}>—</span>
              : links.map((l, i) => (
                <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: "block", color: "#0d9488", fontSize: 10, lineHeight: 1.6 }}>
                  {links.length > 1 ? `Post ${i + 1} ↗` : "↗"}
                </a>
              ))}
          </div>
        )}
      </div>
    )
  }

  // Multiline (observações, conteúdo)
  if (type === "multiline") {
    return editing ? (
      <textarea ref={inputRef} value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => save(val)}
        rows={3}
        style={{
          width: "100%", background: "#fff", border: `2px solid #0d9488`,
          borderRadius: 6, padding: "3px 5px", fontSize: 10,
          fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box",
        }}
      />
    ) : (
      <div onClick={() => setEditing(true)} title={val || undefined} style={{
        cursor: "text", fontSize: 10, color: val ? T.cardFg : T.mutedFg,
        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", lineHeight: 1.4,
      }}>
        {val || "—"}
      </div>
    )
  }

  // Status — dropdown flutuante
  if (type === "status") {
    const s = getStatusStyle(val)
    return (
      <div style={{ position: "relative" }}>
        <span onClick={() => setShowStatus(v => !v)} style={{
          background: s.bg, color: s.color, borderRadius: 5,
          padding: "2px 7px", fontSize: 10, fontWeight: 600,
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          gap: 3, whiteSpace: "nowrap", userSelect: "none",
        }}>
          {val || "—"} <span style={{ fontSize: 8 }}>▾</span>
        </span>
        {showStatus && (
          <StatusMenu value={val} onSelect={saveStatus} onClose={() => setShowStatus(false)} />
        )}
      </div>
    )
  }

  // Texto padrão
  return editing ? (
    <input ref={inputRef} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => save(val)}
      onKeyDown={e => {
        if (e.key === "Enter") save(val)
        if (e.key === "Escape") { setVal(value); setEditing(false) }
      }}
      style={{
        width: "100%", background: "#fff", border: `2px solid #0d9488`,
        borderRadius: 5, padding: "2px 5px", fontSize: 10,
        outline: "none", boxSizing: "border-box",
      }}
    />
  ) : (
    <div onClick={() => setEditing(true)} title={val || undefined} style={{
      cursor: "text", minHeight: 16, fontSize: 10,
      color: val ? T.cardFg : T.mutedFg,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {val || "—"}
    </div>
  )
}

// ── Modal novo influencer ─────────────────────────────────────────────────────
function NewModal({ tab, cols, tableName, onClose, onSaved }: {
  tab: Tab; cols: ColDef[]; tableName: string; onClose: () => void; onSaved: () => void
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
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, padding: 28,
        width: "min(600px, 96vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: `1px solid ${T.border}`,
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 20px" }}>
          Novo influencer
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {cols.map(c => (
            <div key={c.key} style={{
              display: "flex", flexDirection: "column", gap: 4,
              gridColumn: multiline.includes(c.key) ? "1 / -1" : undefined,
            }}>
              <label style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600 }}>{c.label}</label>
              {multiline.includes(c.key) ? (
                <textarea value={form[c.key] ?? ""} rows={3}
                  onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{
                    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: "7px 10px", fontSize: 12, color: T.cardFg,
                    fontFamily: "inherit", resize: "vertical", outline: "none",
                  }}
                />
              ) : (
                <input value={form[c.key] ?? ""}
                  onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                  style={{
                    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: "7px 10px", fontSize: 12, color: T.cardFg, outline: "none",
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "8px 18px", fontSize: 13,
            color: T.mutedFg, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{
            background: "#0d9488", border: "none", borderRadius: 8,
            padding: "8px 22px", fontSize: 13, color: "#fff",
            fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("expansao_sp")
  const [rows, setRows]           = useState<Row[]>([])
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState<Record<string, string>>({})
  const [showNew, setShowNew]     = useState(false)

  const tabInfo = TABS.find(t => t.id === activeTab)!
  const cols    = COLS_BY_TAB[activeTab]

  async function load() {
    setLoading(true)
    const { data } = await getSupabase()
      .from(tabInfo.table)
      .select("*")
      .order("ano", { ascending: false })
      .order("mes")
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => { setFilters({}); load() }, [activeTab])

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
  const totalW = cols.reduce((s, c) => s + c.w, 0) + 52 // +52 para coluna de ações

  return (
    <TeamLayout teamId="social-midia">
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: T.cardFg, margin: "0 0 2px" }}>
          Controle de Influencers
        </p>
        <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
          Clique em qualquer célula para editar. Use ▾ em cada coluna para filtrar.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all .15s",
            background: activeTab === t.id ? "#0d9488" : T.card,
            color:      activeTab === t.id ? "#fff"     : T.mutedFg,
            boxShadow:  activeTab === t.id ? "none"     : T.elevSm,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
        {activeFiltersCount > 0 && (
          <button onClick={() => setFilters({})} style={{
            background: "#fee2e2", border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 12, color: "#991b1b",
            fontWeight: 600, cursor: "pointer",
          }}>
            ✕ Limpar filtros ({activeFiltersCount})
          </button>
        )}
        <div style={{ flex: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: T.mutedFg }}>
          {loading ? "Carregando…" : `${filtered.length} influencer${filtered.length !== 1 ? "s" : ""}`}
        </p>
        <button onClick={() => setShowNew(true)} style={{
          background: "#0d9488", border: "none", borderRadius: 8,
          padding: "8px 18px", fontSize: 13, color: "#fff",
          fontWeight: 600, cursor: "pointer",
        }}>+ Novo</button>
      </div>

      {/* Tabela com scroll horizontal quando necessário */}
      <div style={{
        borderRadius: 12, border: `1px solid ${T.border}`,
        background: T.card, boxShadow: T.elevSm,
        overflowX: "auto",
      }}>
        <div style={{ minWidth: totalW }}>

          {/* Cabeçalho */}
          <div style={{
            display: "flex", borderBottom: `2px solid ${T.border}`,
            background: T.bg, position: "sticky", top: 0, zIndex: 10,
          }}>
            {cols.map(col => (
              <div key={col.key} style={{
                width: col.w, flexShrink: 0, padding: "8px 6px",
                borderRight: `1px solid ${T.border}`,
              }}>
                <ColFilter
                  col={col} rows={rows}
                  filter={filters[col.key] ?? ""}
                  setFilter={v => setFilters(p => ({ ...p, [col.key]: v }))}
                />
              </div>
            ))}
            <div style={{ width: 52, flexShrink: 0, padding: "8px 6px" }} />
          </div>

          {/* Linhas */}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: T.mutedFg, fontSize: 13 }}>
              Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.mutedFg, fontSize: 13 }}>
              Nenhum resultado.
            </div>
          ) : filtered.map((row, i) => (
            <div key={String(row.id)} style={{
              display: "flex", transition: "background .1s",
              borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = T.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {cols.map(col => (
                <div key={col.key} style={{
                  width: col.w, flexShrink: 0, padding: "6px 6px",
                  borderRight: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", minHeight: 36,
                }}>
                  <EditableCell
                    value={String(row[col.key] ?? "")}
                    colKey={col.key}
                    rowId={row.id}
                    tableName={tabInfo.table}
                    type={col.type}
                    onSaved={load}
                  />
                </div>
              ))}
              <div style={{
                width: 52, flexShrink: 0, display: "flex",
                alignItems: "center", justifyContent: "center", gap: 2,
              }}>
                <button onClick={() => deleteRow(row.id)} title="Excluir" style={{
                  background: "transparent", border: "none",
                  cursor: "pointer", fontSize: 12, color: "#ef4444",
                  padding: "3px 5px", borderRadius: 4,
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal novo */}
      {showNew && (
        <NewModal
          tab={activeTab}
          cols={cols}
          tableName={tabInfo.table}
          onClose={() => setShowNew(false)}
          onSaved={load}
        />
      )}
    </TeamLayout>
  )
}

