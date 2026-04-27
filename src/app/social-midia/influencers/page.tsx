"use client"

import { useEffect, useState, useRef } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { getSupabase } from "@/app/social-midia/calendario-seazone/_lib/supabase"
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"

const NAVY = "#0f1d4e"
const COR  = "#0f1d4e"

const MES_NOMES: Record<number, string> = {
  1: "01. Janeiro", 2: "02. Fevereiro", 3: "03. Março", 4: "04. Abril",
  5: "05. Maio", 6: "06. Junho", 7: "07. Julho", 8: "08. Agosto",
  9: "09. Setembro", 10: "10. Outubro", 11: "11. Novembro", 12: "12. Dezembro",
}

type Tab = "geral" | "expansao_sp" | "expansao_salvador" | "seazone"
type InfluRow = Record<string, string>

const TABS = [
  { id: "geral"             as Tab, label: "Geral",             table: "" },
  { id: "expansao_sp"       as Tab, label: "Expansão SP",       table: "influencers_expansao_sp" },
  { id: "expansao_salvador" as Tab, label: "Expansão Salvador", table: "influencers_expansao_salvador" },
  { id: "seazone"           as Tab, label: "Seazone",           table: "influencers_seazone" },
]
const DATA_TABS = TABS.filter(t => t.id !== "geral")

type ColDef = { key: string; label: string; width: number; type?: string }

const BASE_COLS: ColDef[] = [
  { key: "ano",                    label: "Ano",              width: 60  },
  { key: "mes",                    label: "Mês",              width: 95  },
  { key: "categoria",              label: "Categoria",        width: 90,  type: "categoria" },
  { key: "perfil",                 label: "Perfil",           width: 160 },
  { key: "link_perfil",            label: "Link",             width: 65,  type: "link" },
  { key: "seguidores",             label: "Seguidores",       width: 85  },
  { key: "contato",                label: "Contato",          width: 150 },
  { key: "status_contrato",        label: "Status",           width: 135, type: "status" },
  { key: "valor_trabalho",         label: "Vlr Trabalho",     width: 100 },
  { key: "valor_hospedagem",       label: "Vlr Hosp.",        width: 90  },
  { key: "data_visita_hospedagem", label: "Data Visita",      width: 100 },
  { key: "cupom",                  label: "Cupom",            width: 85  },
  { key: "data_validade_cupom",    label: "Val. Cupom",       width: 95  },
  { key: "data_contratacao",       label: "Dt Contrat.",      width: 100 },
  { key: "data_pagamento",         label: "Dt Pgto",          width: 95  },
  { key: "data_hora_post",         label: "Data Post",        width: 100 },
  { key: "link_publicacao",        label: "Link Post",        width: 65,  type: "link" },
  { key: "conversoes",             label: "Conversões",       width: 90  },
  { key: "valor_reservas",         label: "Vlr Reservas",     width: 100 },
  { key: "conteudo_orcado",        label: "Conteúdo Orçado",  width: 180 },
  { key: "observacoes",            label: "Observações",      width: 180 },
]

const SEAZONE_COLS: ColDef[] = [
  { key: "ano",                    label: "Ano",              width: 60  },
  { key: "cidade",                 label: "Cidade",           width: 110 },
  { key: "mes",                    label: "Mês",              width: 95  },
  { key: "categoria",              label: "Categoria",        width: 90,  type: "categoria" },
  { key: "perfil",                 label: "Perfil",           width: 160 },
  { key: "link_perfil",            label: "Link",             width: 65,  type: "link" },
  { key: "seguidores",             label: "Seguidores",       width: 85  },
  { key: "contato",                label: "Contato",          width: 150 },
  { key: "status_contrato",        label: "Status",           width: 135, type: "status" },
  { key: "valor_trabalho",         label: "Vlr Trabalho",     width: 100 },
  { key: "valor_hospedagem",       label: "Vlr Hosp.",        width: 90  },
  { key: "data_visita_hospedagem", label: "Data Visita",      width: 100 },
  { key: "cupom",                  label: "Cupom",            width: 85  },
  { key: "data_validade_cupom",    label: "Val. Cupom",       width: 95  },
  { key: "data_contratacao",       label: "Dt Contrat.",      width: 100 },
  { key: "data_pagamento",         label: "Dt Pgto",          width: 95  },
  { key: "data_hora_post",         label: "Data Post",        width: 100 },
  { key: "link_publicacao",        label: "Link Post",        width: 65,  type: "link" },
  { key: "conversoes",             label: "Conversões",       width: 90  },
  { key: "valor_reservas",         label: "Vlr Reservas",     width: 100 },
  { key: "conteudo_orcado",        label: "Conteúdo Orçado",  width: 180 },
  { key: "observacoes",            label: "Observações",      width: 180 },
]

const COLS_BY_TAB: Record<string, ColDef[]> = {
  expansao_sp:       BASE_COLS,
  expansao_salvador: BASE_COLS,
  seazone:           SEAZONE_COLS,
}

const STATUS_OPTIONS    = ["Contratado", "Não contratado", "Aguardando", "Permuta"]
const CATEGORIA_OPTIONS = ["Influ", "Perfil", "Página"]

function statusStyle(s: string): React.CSSProperties {
  const v = (s || "").toLowerCase().trim()
  if (v === "contratado")     return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }
  if (v.includes("não") || v.includes("nao")) return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }
  if (v === "aguardando")     return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }
  if (v === "permuta")        return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" }
  return { background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }
}

function parseBRL(val: unknown): number {
  if (!val) return 0
  const s = String(val).replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  return parseFloat(s) || 0
}
function formatBRL(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── ColFilterPopup ── */
function ColFilterPopup({ colKey, label, allRows, active, sortDir, onApply, onSort, onClose }: {
  colKey: string; label: string; allRows: InfluRow[]
  active: string[]; sortDir: "asc" | "desc" | null
  onApply: (vals: string[]) => void
  onSort: (dir: "asc" | "desc" | null) => void
  onClose: () => void
}) {
  const allOpts = Array.from(new Set(allRows.map(r => r[colKey] || ""))).filter(Boolean)
  const [sortAZ, setSortAZ] = useState(sortDir !== "desc")
  const [searchVal, setSearchVal] = useState("")
  const [selected, setSelected] = useState<string[]>(active.length ? [...active] : [...allOpts])

  const sorted = [...allOpts].sort((a, b) => sortAZ ? a.localeCompare(b, "pt-BR") : b.localeCompare(a, "pt-BR"))
  const visible = sorted.filter(o => o.toLowerCase().includes(searchVal.toLowerCase()))
  const allSelected = selected.length === allOpts.length

  function toggle(v: string) {
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const GS = { border: "#dadce0", headerBg: "#f8f9fa", text: "#202124", textMuted: "#5f6368" }

  return (
    <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 200, background: "#fff", border: `1px solid ${GS.border}`, borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 240, overflow: "hidden" }}
      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div style={{ padding: "8px 12px", background: GS.headerBg, borderBottom: `1px solid ${GS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: GS.text }}>Filtrar: {label}</span>
        <button onMouseDown={e => { e.preventDefault(); onClose() }} style={{ background: "none", border: "none", cursor: "pointer", color: GS.textMuted, fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ padding: "6px 8px", borderBottom: `1px solid ${GS.border}`, display: "flex", gap: 4 }}>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(true); onSort("asc") }}
          style={{ flex: 1, padding: "5px 6px", fontSize: 11, border: `1px solid ${sortAZ ? COR : GS.border}`, borderRadius: 4, background: sortAZ ? `${COR}15` : "#fff", color: sortAZ ? COR : GS.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontWeight: sortAZ ? 700 : 400 }}>
          <ChevronUp size={11} /> A → Z
        </button>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(false); onSort("desc") }}
          style={{ flex: 1, padding: "5px 6px", fontSize: 11, border: `1px solid ${!sortAZ ? COR : GS.border}`, borderRadius: 4, background: !sortAZ ? `${COR}15` : "#fff", color: !sortAZ ? COR : GS.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontWeight: !sortAZ ? 700 : 400 }}>
          <ChevronDown size={11} /> Z → A
        </button>
      </div>
      <div style={{ padding: "6px 8px", borderBottom: `1px solid ${GS.border}` }}>
        <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="🔍 Buscar..."
          style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${GS.border}`, borderRadius: 4, outline: "none", boxSizing: "border-box" as const }} />
      </div>
      <div style={{ padding: "5px 12px", borderBottom: `1px solid ${GS.border}`, background: "#fafafa" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: GS.text, fontWeight: 600 }}>
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : [...allOpts])}
            style={{ width: 14, height: 14, accentColor: COR, cursor: "pointer" }} />
          Selecionar tudo ({allOpts.length})
        </label>
      </div>
      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {visible.map(o => (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: GS.text }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f0f4ff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)}
              style={{ width: 14, height: 14, accentColor: COR, cursor: "pointer" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o}</span>
          </label>
        ))}
        {visible.length === 0 && <p style={{ padding: "10px 12px", fontSize: 11, color: GS.textMuted, margin: 0 }}>Nenhum valor encontrado</p>}
      </div>
      <div style={{ padding: "8px 12px", borderTop: `1px solid ${GS.border}`, display: "flex", gap: 6, justifyContent: "flex-end", background: "#fafafa" }}>
        <button onMouseDown={e => { e.preventDefault(); onClose() }}
          style={{ padding: "5px 14px", fontSize: 12, border: `1px solid ${GS.border}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: GS.text }}>
          Cancelar
        </button>
        <button onMouseDown={e => { e.preventDefault(); onApply(selected.length === allOpts.length ? [] : selected); onClose() }}
          style={{ padding: "5px 14px", fontSize: 12, border: "none", borderRadius: 4, background: COR, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
          OK
        </button>
      </div>
    </div>
  )
}

/* ── GeralTab ── */
function GeralTab() {
  const now = new Date()
  const anoAtual = String(now.getFullYear())
  const mesAtual = MES_NOMES[now.getMonth() + 1] || ""

  const [orcamento, setOrcamento]           = useState("")
  const [orcamentoInput, setOrcamentoInput] = useState("")
  const [allRows, setAllRows]               = useState<Record<string, InfluRow[]>>({})
  const [loading, setLoading]               = useState(true)
  const [filterAno, setFilterAno]           = useState(anoAtual)
  const [filterMes, setFilterMes]           = useState(mesAtual)

  useEffect(() => {
    const s = localStorage.getItem("influencers_orcamento_total") || ""
    setOrcamento(s); setOrcamentoInput(s)
  }, [])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const results: Record<string, InfluRow[]> = {}
      for (const t of DATA_TABS) {
        const { data } = await getSupabase().from(t.table).select("status_contrato,valor_trabalho,valor_hospedagem,ano,mes")
        results[t.id] = (data ?? []) as InfluRow[]
      }
      setAllRows(results); setLoading(false)
    }
    loadAll()
  }, [])

  // Fix: aplica mês atual quando os dados chegam e o mês existe nas opções
  const todosMeses = Array.from(new Set(
    Object.values(allRows).flat()
      .filter(r => filterAno === "todos" || String(r.ano) === filterAno)
      .map(r => String(r.mes ?? "")).filter(Boolean)
  )).sort()

  useEffect(() => {
    if (Object.keys(allRows).length > 0 && todosMeses.includes(mesAtual)) {
      setFilterMes(mesAtual)
    }
  }, [allRows])

  function saveOrcamento() { setOrcamento(orcamentoInput); localStorage.setItem("influencers_orcamento_total", orcamentoInput) }

  const todosAnos = Array.from(new Set(Object.values(allRows).flat().map(r => String(r.ano ?? "")).filter(Boolean))).sort().reverse()

  function rowPassFilter(r: InfluRow) {
    return (filterAno === "todos" || String(r.ano) === filterAno) && (filterMes === "todos" || String(r.mes) === filterMes)
  }

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
        <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>Filtrar por período</p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" as const }}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
            <label style={{ fontSize: 13, color: T.mutedFg, fontWeight: 600 }}>Ano</label>
            <select value={filterAno} onChange={e => { setFilterAno(e.target.value); setFilterMes("todos") }}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 14, color: T.cardFg, outline: "none", minWidth: 110 }}>
              <option value="todos">Todos</option>
              {todosAnos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
            <label style={{ fontSize: 13, color: T.mutedFg, fontWeight: 600 }}>Mês</label>
            <select value={filterMes} onChange={e => setFilterMes(e.target.value)}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 14, color: T.cardFg, outline: "none", minWidth: 170 }}>
              <option value="todos">Todos os meses</option>
              {todosMeses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {(filterAno !== "todos" || filterMes !== "todos") && (
            <button onClick={() => { setFilterAno("todos"); setFilterMes("todos") }}
              style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 14, color: "#991b1b", fontWeight: 600, cursor: "pointer" }}>
              ✕ Limpar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ background: "#eef1f8", border: `1px solid ${NAVY}30`, borderRadius: 8, padding: "9px 16px" }}>
            <span style={{ fontSize: 14, color: NAVY, fontWeight: 600 }}>{periodoLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: T.elevSm }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, margin: "0 0 12px", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>Orçamento total de marketing</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" as const }}>
          <input value={orcamentoInput} onChange={e => setOrcamentoInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveOrcamento() }}
            placeholder="Ex: R$ 50.000,00"
            style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", fontSize: 15, color: T.cardFg, outline: "none", width: 240 }} />
          <button onClick={saveOrcamento} style={{ background: NAVY, border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 14, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Salvar</button>
        </div>
      </div>

      {loading ? <div style={{ padding: 48, textAlign: "center" as const, color: T.mutedFg }}>Carregando...</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
            {[
              { label: "Orçamento total", value: formatBRL(totalBudget), color: T.cardFg },
              { label: "Já utilizado",    value: formatBRL(totalGasto),  color: "#185FA5" },
              { label: "Saldo livre",     value: formatBRL(saldoLivre),  color: saldoLivre < 0 ? "#991b1b" : "#065f46" },
            ].map(c => (
              <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", boxShadow: T.elevSm }}>
                <p style={{ fontSize: 12, color: T.mutedFg, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>{c.label}</p>
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
            <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: T.cardFg, margin: 0 }}>Breakdown por campanha</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Campanha", "Contratados", "Gasto", "% do orçamento"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left" as const, fontSize: 12, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase" as const, letterSpacing: ".04em", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b, i) => {
                  const campPct = totalBudget > 0 ? Math.min(100, Math.round((b.gasto / totalBudget) * 100)) : 0
                  const color = CAMPAIGN_COLORS[b.id] ?? NAVY
                  return (
                    <tr key={b.id} style={{ borderBottom: i < breakdown.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <td style={{ padding: "14px 20px" }}><span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 14, fontWeight: 600, background: color + "18", color }}>{b.label}</span></td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: T.cardFg }}>{b.contratados} influencer{b.contratados !== 1 ? "s" : ""}</td>
                      <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 600, color: T.cardFg }}>{formatBRL(b.gasto)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
                            <div style={{ height: "100%", width: `${campPct}%`, background: color, borderRadius: 20 }} />
                          </div>
                          <span style={{ fontSize: 14, color: T.mutedFg, minWidth: 38, textAlign: "right" as const }}>{campPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: T.bg, borderTop: `2px solid ${T.border}` }}>
                  <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: T.cardFg }}>Total</td>
                  <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: T.cardFg }}>{breakdown.reduce((a, b) => a + b.contratados, 0)} influencers</td>
                  <td style={{ padding: "14px 20px", fontSize: 15, fontWeight: 700, color: "#185FA5" }}>{formatBRL(totalGasto)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, height: 8, background: T.bg, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.border}` }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 20 }} />
                      </div>
                      <span style={{ fontSize: 14, color: T.mutedFg, minWidth: 38, textAlign: "right" as const }}>{pct}%</span>
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

/* ── DataTab ── */
function DataTab({ tableName, cols }: { tableName: string; cols: ColDef[] }) {
  const tableRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = tableRef.current; if (!el) return
    function onWheel(e: WheelEvent) { if (e.shiftKey) { e.preventDefault(); if (el) el.scrollLeft += e.deltaY } }
    el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const [rows, setRows]                   = useState<InfluRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [editCell, setEditCell]           = useState<{ id: string; key: string } | null>(null)
  const [editVal, setEditVal]             = useState("")
  const [saving, setSaving]               = useState(false)
  const [colFilters, setColFilters]       = useState<Record<string, string[]>>({})
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null)
  const [search, setSearch]               = useState("")
  const [selectedRow, setSelectedRow]     = useState<string | null>(null)
  const [sortCol, setSortCol]             = useState<string | null>(null)
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("asc")

  useEffect(() => { loadRows() }, [tableName])

  async function loadRows() {
    setLoading(true)
    const { data } = await getSupabase().from(tableName).select("*").order("ano", { ascending: false }).order("mes")
    setRows((data ?? []).map(r => {
      const o: InfluRow = {}
      Object.entries(r).forEach(([k, v]) => { o[k] = v === null || v === undefined ? "" : String(v) })
      return o
    }))
    setLoading(false)
  }

  let filtered = rows.filter(r => {
    for (const [key, vals] of Object.entries(colFilters)) {
      if (vals.length > 0 && !vals.includes(r[key] || "")) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return cols.some(c => (r[c.key] || "").toLowerCase().includes(q))
    }
    return true
  })

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] || ""; const vb = b[sortCol] || ""
      const cmp = va.localeCompare(vb, "pt-BR", { numeric: true })
      return sortDir === "asc" ? cmp : -cmp
    })
  }

  async function commitEdit(id: string, key: string, val: string) {
    setSaving(true)
    await getSupabase().from(tableName).update({ [key]: val || null }).eq("id", id)
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
    setEditCell(null); setSaving(false)
  }

  async function addRow() {
    const payload: Record<string, null> = {}; cols.forEach(c => { payload[c.key] = null })
    const { data } = await getSupabase().from(tableName).insert(payload).select().single()
    if (data) {
      const newRow: InfluRow = {}
      Object.entries(data).forEach(([k, v]) => { newRow[k] = v === null ? "" : String(v) })
      setRows(prev => [...prev, newRow]); setSelectedRow(newRow.id)
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Excluir este influencer?")) return
    await getSupabase().from(tableName).delete().eq("id", id)
    setRows(prev => prev.filter(r => r.id !== id)); setSelectedRow(null)
  }

  async function duplicateRow(row: InfluRow) {
    const payload: Record<string, string | null> = {}
    cols.forEach(c => { payload[c.key] = row[c.key] || null })
    const { data } = await getSupabase().from(tableName).insert(payload).select().single()
    if (data) {
      const newRow: InfluRow = {}
      Object.entries(data).forEach(([k, v]) => { newRow[k] = v === null ? "" : String(v) })
      setRows(prev => [...prev, newRow]); setSelectedRow(newRow.id)
    }
  }

  function toggleSort(key: string) {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCol(key); setSortDir("asc") }
  }

  const activeFiltersCount = Object.values(colFilters).filter(v => v.length > 0).length

  const GS = {
    headerBg: "#f8f9fa", headerBorder: "#dadce0", cellBorder: "#e2e3e4",
    rowHover: "#f6f8ff", rowSelected: "#e8f0fe", rowAlt: "#fafbfc",
    text: "#202124", textMuted: "#5f6368", inputBorder: "#4285f4",
  }

  const cellBase: React.CSSProperties = {
    padding: "4px 6px", minHeight: 28, maxHeight: 80,
    borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`,
    fontSize: 12, color: GS.text, overflow: "hidden", verticalAlign: "top" as const,
    cursor: "cell", wordBreak: "break-word" as const, whiteSpace: "pre-wrap" as const, lineHeight: "18px",
  }

  if (loading) return <div style={{ padding: 48, textAlign: "center" as const, color: T.mutedFg }}>Carregando...</div>

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: GS.headerBg, border: `1px solid ${GS.headerBorder}`, borderBottom: "none", borderRadius: "6px 6px 0 0", flexWrap: "wrap" as const }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
          style={{ padding: "4px 8px", fontSize: 12, border: `1px solid ${GS.headerBorder}`, borderRadius: 4, outline: "none", background: "#fff", color: GS.text, width: 200 }} />
        <span style={{ fontSize: 11, color: GS.textMuted }}>{filtered.length} linha{filtered.length !== 1 ? "s" : ""}</span>
        {activeFiltersCount > 0 && (
          <button onClick={() => setColFilters({})} style={{ padding: "3px 8px", background: "#fff3cd", border: "1px solid #fcd34d", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#92400e" }}>
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""} ✕
          </button>
        )}
        {sortCol && (
          <button onClick={() => setSortCol(null)} style={{ padding: "3px 8px", background: "#e0f2fe", border: "1px solid #7dd3fc", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#0369a1" }}>
            {cols.find(c => c.key === sortCol)?.label} {sortDir === "asc" ? "↑ A-Z" : "↓ Z-A"} ✕
          </button>
        )}
        {selectedRow && (
          <>
            <button onClick={() => { const r = filtered.find(r => r.id === selectedRow); if (r) duplicateRow(r) }}
              style={{ padding: "3px 8px", background: "#fff", border: `1px solid ${GS.headerBorder}`, borderRadius: 4, fontSize: 11, cursor: "pointer", color: GS.text, display: "flex", alignItems: "center", gap: 3 }}>
              <Copy size={11} /> Duplicar
            </button>
            <button onClick={() => deleteRow(selectedRow)}
              style={{ padding: "3px 8px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 4, fontSize: 11, cursor: "pointer", color: "#991b1b", display: "flex", alignItems: "center", gap: 3 }}>
              <Trash2 size={11} /> Excluir
            </button>
          </>
        )}
        <button onClick={addRow} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", background: NAVY, color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={12} /> Nova linha
        </button>
      </div>

      <div ref={tableRef} style={{ overflowX: "auto", border: `1px solid ${GS.headerBorder}`, borderRadius: "0 0 6px 6px", maxHeight: 560, overflowY: "auto" }}>
        <table style={{ borderCollapse: "collapse" as const, fontSize: 12, minWidth: "100%", tableLayout: "fixed" as const }}>
          <colgroup>
            <col style={{ width: 36 }} />
            {cols.map(c => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead style={{ position: "sticky" as const, top: 0, zIndex: 10 }}>
            <tr style={{ background: GS.headerBg }}>
              <th style={{ width: 36, padding: "6px 4px", borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, textAlign: "center" as const, fontSize: 11, color: GS.textMuted, fontWeight: 600 }}>#</th>
              {cols.map(c => {
                const isFiltered = !!(colFilters[c.key]?.length > 0)
                const isSorted = sortCol === c.key
                const isOpen = openFilterCol === c.key
                return (
                  <th key={c.key} style={{ padding: 0, borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, background: isFiltered ? `${COR}08` : GS.headerBg, position: "relative" as const }}>
                    <div style={{ display: "flex", alignItems: "stretch", height: 32 }}>
                      <button onClick={() => toggleSort(c.key)}
                        style={{ flex: 1, padding: "0 4px 0 8px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const, fontSize: 11, color: isSorted || isFiltered ? COR : GS.textMuted, fontWeight: isSorted || isFiltered ? 700 : 600, display: "flex", alignItems: "center", gap: 3, overflow: "hidden", whiteSpace: "nowrap" as const }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                        {isFiltered && <span style={{ fontSize: 9, background: COR, color: "#fff", borderRadius: 10, padding: "1px 4px", flexShrink: 0 }}>●</span>}
                        {isSorted ? (sortDir === "asc" ? <ChevronUp size={10} color={COR} /> : <ChevronDown size={10} color={COR} />) : <ArrowUpDown size={9} style={{ opacity: 0.25, flexShrink: 0 }} />}
                      </button>
                      <div style={{ position: "relative" as const, flexShrink: 0 }}>
                        <button
                          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpenFilterCol(isOpen ? null : c.key) }}
                          style={{ width: 24, height: 32, background: isOpen ? `${COR}20` : isFiltered ? `${COR}15` : "none", border: "none", borderLeft: `1px solid ${GS.headerBorder}`, cursor: "pointer", color: isFiltered || isOpen ? COR : GS.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                          ▾
                        </button>
                        {isOpen && (
                          <ColFilterPopup
                            colKey={c.key} label={c.label} allRows={rows}
                            active={colFilters[c.key] || []}
                            sortDir={sortCol === c.key ? sortDir : null}
                            onApply={vals => setColFilters(prev => vals.length ? { ...prev, [c.key]: vals } : (({ [c.key]: _, ...rest }) => rest)(prev))}
                            onSort={dir => { if (dir) { setSortCol(c.key); setSortDir(dir) } else { setSortCol(null) } }}
                            onClose={() => setOpenFilterCol(null)}
                          />
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
              const bg = isSelected ? GS.rowSelected : isAlt ? GS.rowAlt : "#fff"
              return (
                <tr key={row.id}
                  onClick={() => setSelectedRow(isSelected ? null : row.id)}
                  style={{ background: bg, transition: "background 0.05s" }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = GS.rowHover }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = bg }}
                >
                  <td style={{ ...cellBase, width: 36, textAlign: "center" as const, color: GS.textMuted, fontSize: 11, cursor: "default", whiteSpace: "nowrap" as const, background: bg, padding: "6px 4px" }}>
                    {i + 1}
                  </td>
                  {cols.map(col => {
                    const val = row[col.key] || ""
                    const isEditing = editCell?.id === row.id && editCell?.key === col.key

                    if (isEditing) return (
                      <td key={col.key} style={{ padding: 0, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, verticalAlign: "top" as const }}>
                        <textarea autoFocus value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => setTimeout(() => commitEdit(row.id, col.key, editVal), 100)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                            if (e.key === "Escape") setEditCell(null)
                            if (e.key === "Tab") { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                          }}
                          style={{ width: "100%", minHeight: 28, maxHeight: 120, padding: "4px 6px", fontSize: 12, border: `2px solid ${GS.inputBorder}`, outline: "none", background: "#fff", color: GS.text, boxSizing: "border-box" as const, resize: "vertical" as const, lineHeight: "18px", fontFamily: "inherit" }} />
                      </td>
                    )

                    if (col.type === "status") return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: "3px 4px", whiteSpace: "nowrap" as const }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ ...statusStyle(val), width: "100%", padding: "2px 6px", fontSize: 11, fontWeight: 600, borderRadius: 3, cursor: "pointer", outline: "none", height: 22 }}>
                          <option value="">—</option>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    )

                    if (col.type === "categoria") return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: "3px 4px", whiteSpace: "nowrap" as const }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ width: "100%", padding: "2px 4px", fontSize: 11, fontWeight: 600, borderRadius: 3, cursor: "pointer", outline: "none", height: 22, background: `${COR}12`, color: COR, border: `1px solid ${COR}30` }}>
                          <option value="">—</option>
                          {CATEGORIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    )

                    if (col.type === "link" && val?.startsWith("http")) return (
                      <td key={col.key} style={{ ...cellBase, background: bg, textAlign: "center" as const, whiteSpace: "nowrap" as const }}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        <a href={val.split("\n")[0]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ color: "#1a73e8", fontSize: 11, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                          ↗ ver
                        </a>
                      </td>
                    )

                    return (
                      <td key={col.key} style={{ ...cellBase, background: bg }} title={val}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        {val
                          ? <span style={{ fontSize: 12, whiteSpace: "pre-wrap" as const, wordBreak: "break-word" as const }}>{val}</span>
                          : <span style={{ color: "#ccc", fontSize: 11 }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr style={{ background: "#fafafa" }} onClick={addRow}>
              <td style={{ height: 28, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, textAlign: "center" as const, color: "#ccc", cursor: "pointer", fontSize: 16 }}>+</td>
              {cols.map(c => (
                <td key={c.key} style={{ height: 28, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, cursor: "pointer" }} />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: GS.textMuted, marginTop: 4 }}>
        Clique para selecionar · Duplo clique para editar · Enter para confirmar · Shift+Enter para nova linha · Tab para próxima célula · ▾ para filtrar · Shift+scroll horizontal
      </p>
    </div>
  )
}

/* ── Page principal ── */
export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("geral")

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 19, fontWeight: 700, color: T.cardFg, margin: "0 0 3px" }}>Controle de Influencers</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" as const }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "9px 20px", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", background: activeTab === t.id ? NAVY : T.card, color: activeTab === t.id ? "#fff" : T.mutedFg, boxShadow: activeTab === t.id ? "none" : T.elevSm }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "geral" && <GeralTab />}
      {activeTab !== "geral" && (
        <DataTab
          key={activeTab}
          tableName={TABS.find(t => t.id === activeTab)!.table}
          cols={COLS_BY_TAB[activeTab] ?? BASE_COLS}
        />
      )}
    </TeamLayout>
  )
}