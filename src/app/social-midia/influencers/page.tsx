"use client"

import { useEffect, useState } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Tipos ─────────────────────────────────────────────────────────────────
type Tab = "expansao_sp" | "expansao_salvador" | "vistas" | "seazone"

const TABS: { id: Tab; label: string; table: string }[] = [
  { id: "expansao_sp",       label: "Expansão SP",       table: "influencers_expansao_sp" },
  { id: "expansao_salvador", label: "Expansão Salvador", table: "influencers_expansao_salvador" },
  { id: "vistas",            label: "Vistas de Anitá",   table: "influencers_vistas" },
  { id: "seazone",           label: "Seazone",           table: "influencers_seazone" },
]

// Colunas visíveis por aba (ordem e labels amigáveis)
const COLS: Record<Tab, { key: string; label: string; width?: number }[]> = {
  expansao_sp: [
    { key: "ano",                    label: "Ano",         width: 60 },
    { key: "mes",                    label: "Mês",         width: 110 },
    { key: "categoria",              label: "Categoria",   width: 80 },
    { key: "perfil",                 label: "Perfil",      width: 160 },
    { key: "seguidores",             label: "Seguidores",  width: 90 },
    { key: "status_contrato",        label: "Status",      width: 120 },
    { key: "valor_trabalho",         label: "Vl. Trabalho",width: 110 },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",   width: 100 },
    { key: "data_contratacao",       label: "Contratação", width: 110 },
    { key: "data_pagamento",         label: "Pagamento",   width: 100 },
    { key: "cupom",                  label: "Cupom",       width: 100 },
    { key: "data_validade_cupom",    label: "Val. Cupom",  width: 100 },
    { key: "data_visita_hospedagem", label: "Visita",      width: 130 },
    { key: "link_publicacao",        label: "Link",        width: 80 },
    { key: "quantidade_conversoes",  label: "Conversões",  width: 90 },
    { key: "valor_total_reservas",   label: "Vl. Reservas",width: 110 },
    { key: "conteudo_orcado",        label: "Conteúdo",    width: 160 },
    { key: "observacoes",            label: "Obs.",        width: 160 },
    { key: "contato",                label: "Contato",     width: 160 },
  ],
  expansao_salvador: [
    { key: "ano",                    label: "Ano",         width: 60 },
    { key: "cidade",                 label: "Cidade",      width: 100 },
    { key: "mes",                    label: "Mês",         width: 110 },
    { key: "categoria",              label: "Categoria",   width: 80 },
    { key: "perfil",                 label: "Perfil",      width: 160 },
    { key: "seguidores",             label: "Seguidores",  width: 90 },
    { key: "status_contrato",        label: "Status",      width: 120 },
    { key: "valor_trabalho",         label: "Vl. Trabalho",width: 110 },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",   width: 100 },
    { key: "data_contratacao",       label: "Contratação", width: 110 },
    { key: "data_pagamento",         label: "Pagamento",   width: 100 },
    { key: "cupom",                  label: "Cupom",       width: 100 },
    { key: "data_validade_cupom",    label: "Val. Cupom",  width: 100 },
    { key: "data_visita_hospedagem", label: "Visita",      width: 130 },
    { key: "link_publicacao",        label: "Link",        width: 80 },
    { key: "quantidade_conversoes",  label: "Conversões",  width: 90 },
    { key: "valor_total_reservas",   label: "Vl. Reservas",width: 110 },
    { key: "conteudo_orcado",        label: "Conteúdo",    width: 160 },
    { key: "observacoes",            label: "Obs.",        width: 160 },
    { key: "contato",                label: "Contato",     width: 160 },
  ],
  vistas: [
    { key: "ano",                    label: "Ano",         width: 60 },
    { key: "mes",                    label: "Mês",         width: 110 },
    { key: "categoria",              label: "Categoria",   width: 80 },
    { key: "perfil",                 label: "Perfil",      width: 160 },
    { key: "seguidores",             label: "Seguidores",  width: 90 },
    { key: "status_contrato",        label: "Status",      width: 120 },
    { key: "valor_trabalho",         label: "Vl. Trabalho",width: 110 },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",   width: 100 },
    { key: "data_contratacao",       label: "Contratação", width: 110 },
    { key: "data_pagamento",         label: "Pagamento",   width: 100 },
    { key: "cupom",                  label: "Cupom",       width: 100 },
    { key: "data_validade_cupom",    label: "Val. Cupom",  width: 100 },
    { key: "data_visita_hospedagem", label: "Visita",      width: 130 },
    { key: "link_publicacao",        label: "Link",        width: 80 },
    { key: "quantidade_conversoes",  label: "Conversões",  width: 90 },
    { key: "valor_total_reservas",   label: "Vl. Reservas",width: 110 },
    { key: "observacoes",            label: "Obs.",        width: 160 },
    { key: "contato",                label: "Contato",     width: 160 },
  ],
  seazone: [
    { key: "ano",                    label: "Ano",         width: 60 },
    { key: "cidade",                 label: "Cidade",      width: 100 },
    { key: "mes",                    label: "Mês",         width: 110 },
    { key: "categoria",              label: "Categoria",   width: 80 },
    { key: "perfil",                 label: "Perfil",      width: 160 },
    { key: "seguidores",             label: "Seguidores",  width: 90 },
    { key: "status_contrato",        label: "Status",      width: 120 },
    { key: "valor_trabalho",         label: "Vl. Trabalho",width: 110 },
    { key: "valor_hospedagem",       label: "Vl. Hosp.",   width: 100 },
    { key: "data_contratacao",       label: "Contratação", width: 110 },
    { key: "data_pagamento",         label: "Pagamento",   width: 100 },
    { key: "cupom",                  label: "Cupom",       width: 100 },
    { key: "data_validade_cupom",    label: "Val. Cupom",  width: 100 },
    { key: "data_visita_hospedagem", label: "Visita",      width: 130 },
    { key: "link_publicacao",        label: "Link",        width: 80 },
    { key: "quantidade_conversoes",  label: "Conversões",  width: 90 },
    { key: "valor_total_reservas",   label: "Vl. Reservas",width: 110 },
    { key: "conteudo_orcado",        label: "Conteúdo",    width: 160 },
    { key: "observacoes",            label: "Obs.",        width: 160 },
    { key: "contato",                label: "Contato",     width: 160 },
  ],
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  "Contratado":     { bg: "#d1fae5", color: "#065f46" },
  "Não contratado": { bg: "#fee2e2", color: "#991b1b" },
  "aguardando":     { bg: "#fef9c3", color: "#854d0e" },
  "Permuta":        { bg: "#e0e7ff", color: "#3730a3" },
}

function statusStyle(val: string | null) {
  if (!val) return {}
  const entry = Object.entries(STATUS_COLORS).find(([k]) =>
    val.toLowerCase().includes(k.toLowerCase())
  )
  if (!entry) return {}
  return {
    background: entry[1].bg,
    color: entry[1].color,
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    display: "inline-block",
  }
}

// ── Modal de edição / criação ─────────────────────────────────────────────
function RowModal({
  tab,
  row,
  onClose,
  onSaved,
}: {
  tab: Tab
  row: Record<string, unknown> | null
  onClose: () => void
  onSaved: () => void
}) {
  const tableName = TABS.find((t) => t.id === tab)!.table
  const cols = COLS[tab]
  const isNew = row === null
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    cols.forEach((c) => { init[c.key] = isNew ? "" : String(row?.[c.key] ?? "") })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    setSaving(true)
    setError("")
    const payload: Record<string, string | number | null> = {}
    cols.forEach((c) => {
      const v = form[c.key]?.trim() || null
      payload[c.key] = c.key === "ano" && v ? Number(v) : v
    })

    let err
    if (isNew) {
      ;({ error: err } = await supabase.from(tableName).insert(payload))
    } else {
      ;({ error: err } = await supabase.from(tableName).update(payload).eq("id", (row as Record<string, unknown>).id))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
    onClose()
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, padding: 28,
        width: "min(600px, 96vw)", maxHeight: "88vh",
        overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        border: `1px solid ${T.border}`,
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: "0 0 20px" }}>
          {isNew ? "Novo influencer" : "Editar influencer"}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {cols.map((c) => (
            <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: 4,
              gridColumn: ["observacoes", "conteudo_orcado", "contato", "link_publicacao"].includes(c.key) ? "1 / -1" : undefined,
            }}>
              <label style={{ fontSize: 11, color: T.mutedFg, fontWeight: 600 }}>{c.label}</label>
              {["observacoes", "conteudo_orcado"].includes(c.key) ? (
                <textarea
                  value={form[c.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [c.key]: e.target.value }))}
                  rows={3}
                  style={{
                    background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "7px 10px",
                    fontSize: 13, color: T.cardFg, resize: "vertical",
                    fontFamily: "inherit", outline: "none",
                  }}
                />
              ) : (
                <input
                  value={form[c.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [c.key]: e.target.value }))}
                  style={{
                    background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "7px 10px",
                    fontSize: 13, color: T.cardFg, outline: "none",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "8px 18px", fontSize: 13,
            color: T.mutedFg, cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{
            background: "#0d9488", border: "none", borderRadius: 8,
            padding: "8px 22px", fontSize: 13, color: "#fff",
            fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("expansao_sp")
  const [rows, setRows]           = useState<Record<string, unknown>[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [editRow, setEditRow]     = useState<Record<string, unknown> | null | undefined>(undefined)
  // undefined = modal fechado | null = novo | Record = editar

  const tableName = TABS.find((t) => t.id === activeTab)!.table
  const cols      = COLS[activeTab]

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from(tableName)
      .select("*")
      .order("ano", { ascending: false })
      .order("mes", { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeTab])

  async function deleteRow(id: unknown) {
    if (!confirm("Tem certeza que deseja excluir este influencer?")) return
    await supabase.from(tableName).delete().eq("id", id)
    load()
  }

  const filtered = rows.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
  })

  return (
    <TeamLayout teamId="social-midia">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
          Controle de Influencers
        </p>
        <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
          Gerencie influencers por campanha. Todas as alterações são salvas automaticamente no banco de dados.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSearch("") }} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none",
            background: activeTab === t.id ? "#0d9488" : T.card,
            color:      activeTab === t.id ? "#fff"     : T.mutedFg,
            boxShadow:  activeTab === t.id ? "none"     : T.elevSm,
            transition: "all .15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, status, mês…"
          style={{
            flex: 1, background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "8px 14px", fontSize: 13,
            color: T.cardFg, outline: "none",
          }}
        />
        <button onClick={() => setEditRow(null)} style={{
          background: "#0d9488", border: "none", borderRadius: 8,
          padding: "8px 18px", fontSize: 13, color: "#fff",
          fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          + Novo
        </button>
      </div>

      {/* Contador */}
      <p style={{ fontSize: 12, color: T.mutedFg, margin: "0 0 10px" }}>
        {loading ? "Carregando…" : `${filtered.length} influencer${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Tabela */}
      <div style={{
        overflowX: "auto", borderRadius: 12,
        border: `1px solid ${T.border}`, background: T.card,
        boxShadow: T.elevSm,
      }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {cols.map((c) => (
                <th key={c.key} style={{
                  padding: "10px 14px", fontSize: 11, fontWeight: 700,
                  color: T.mutedFg, textAlign: "left",
                  whiteSpace: "nowrap", minWidth: c.width ?? 100,
                  background: T.card,
                }}>
                  {c.label}
                </th>
              ))}
              <th style={{ padding: "10px 14px", minWidth: 80, background: T.card }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={cols.length + 1} style={{ padding: 32, textAlign: "center", color: T.mutedFg, fontSize: 13 }}>Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={cols.length + 1} style={{ padding: 32, textAlign: "center", color: T.mutedFg, fontSize: 13 }}>Nenhum resultado encontrado.</td></tr>
            ) : filtered.map((row, i) => (
              <tr key={String(row.id)} style={{
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                transition: "background .1s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {cols.map((c) => {
                  const val = String(row[c.key] ?? "")
                  const isStatus = c.key === "status_contrato"
                  const isLink   = c.key === "link_publicacao"
                  return (
                    <td key={c.key} style={{
                      padding: "9px 14px", fontSize: 12, color: T.cardFg,
                      maxWidth: c.width ? c.width + 40 : 200,
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: isStatus ? "nowrap" : "normal",
                      verticalAlign: "top",
                    }}>
                      {isStatus && val ? (
                        <span style={statusStyle(val)}>{val}</span>
                      ) : isLink && val ? (
                        <a href={val} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#0d9488", fontSize: 11, wordBreak: "break-all" }}>
                          Ver post ↗
                        </a>
                      ) : val || <span style={{ color: T.mutedFg }}>—</span>}
                    </td>
                  )
                })}
                <td style={{ padding: "9px 14px", whiteSpace: "nowrap", verticalAlign: "top" }}>
                  <button onClick={() => setEditRow(row)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: T.mutedFg, fontSize: 13, marginRight: 8,
                  }}>✏️</button>
                  <button onClick={() => deleteRow(row.id)} style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "#ef4444", fontSize: 13,
                  }}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editRow !== undefined && (
        <RowModal
          tab={activeTab}
          row={editRow}
          onClose={() => setEditRow(undefined)}
          onSaved={load}
        />
      )}
    </TeamLayout>
  )
}

