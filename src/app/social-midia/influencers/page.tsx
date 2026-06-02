"use client"

import { useEffect, useState, useRef } from "react"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"
import { getSupabase } from "@/app/social-midia/calendario-seazone/_lib/supabase"
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, ArrowUpDown, ExternalLink, X } from "lucide-react"

const NAVY = "#0f1d4e"
const COR  = "#0f1d4e"

/* Colunas com editor modal (texto longo) */
const LONG_TEXT_COLS = ["conteudo_orcado", "observacoes"]

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
  { key: "ano",                      label: "Ano",              width: 60  },
  { key: "mes",                      label: "Mês",              width: 95  },
  { key: "categoria",                label: "Categoria",        width: 90,  type: "categoria" },
  { key: "perfil",                   label: "Perfil",           width: 160 },
  { key: "link_perfil",              label: "Link",             width: 70,  type: "link" },
  { key: "seguidores",               label: "Seguidores",       width: 85  },
  { key: "contato",                  label: "Contato",          width: 150 },
  { key: "status_contrato",          label: "Status",           width: 140, type: "status" },
  { key: "valor_trabalho",           label: "Vlr Trabalho",     width: 100 },
  { key: "valor_hospedagem",         label: "Vlr Hosp.",        width: 90  },
  { key: "data_visita_hospedagem",   label: "Data Visita",      width: 100 },
  { key: "cupom",                    label: "Cupom",            width: 85  },
  { key: "data_validade_cupom",      label: "Val. Cupom",       width: 95  },
  { key: "data_contratacao",         label: "Dt Contrat.",      width: 100 },
  { key: "data_pagamento",           label: "Dt Pgto",          width: 95  },
  { key: "data_hora_post",           label: "Data Post",        width: 100 },
  { key: "link_publicacao",          label: "Link Post",        width: 70,  type: "link" },
  { key: "quantidade_conversoes",    label: "Conversões",       width: 90  },
  { key: "valor_total_reservas",     label: "Vlr Reservas",     width: 100 },
  { key: "conteudo_orcado",          label: "Conteúdo Orçado",  width: 180 },
  { key: "observacoes",              label: "Observações",      width: 180 },
]

const SEAZONE_COLS: ColDef[] = [
  { key: "ano",                      label: "Ano",              width: 60  },
  { key: "cidade",                   label: "Cidade",           width: 110 },
  { key: "mes",                      label: "Mês",              width: 95  },
  { key: "categoria",                label: "Categoria",        width: 90,  type: "categoria" },
  { key: "perfil",                   label: "Perfil",           width: 160 },
  { key: "link_perfil",              label: "Link",             width: 70,  type: "link" },
  { key: "seguidores",               label: "Seguidores",       width: 85  },
  { key: "contato",                  label: "Contato",          width: 150 },
  { key: "status_contrato",          label: "Status",           width: 140, type: "status" },
  { key: "valor_trabalho",           label: "Vlr Trabalho",     width: 100 },
  { key: "valor_hospedagem",         label: "Vlr Hosp.",        width: 90  },
  { key: "data_visita_hospedagem",   label: "Data Visita",      width: 100 },
  { key: "cupom",                    label: "Cupom",            width: 85  },
  { key: "data_validade_cupom",      label: "Val. Cupom",       width: 95  },
  { key: "data_contratacao",         label: "Dt Contrat.",      width: 100 },
  { key: "data_pagamento",           label: "Dt Pgto",          width: 95  },
  { key: "data_hora_post",           label: "Data Post",        width: 100 },
  { key: "link_publicacao",          label: "Link Post",        width: 70,  type: "link" },
  { key: "quantidade_conversoes",    label: "Conversões",       width: 90  },
  { key: "valor_total_reservas",     label: "Vlr Reservas",     width: 100 },
  { key: "conteudo_orcado",          label: "Conteúdo Orçado",  width: 180 },
  { key: "observacoes",              label: "Observações",      width: 180 },
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
  if (v === "contratado")                        return { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }
  if (v.includes("não") || v.includes("nao"))    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }
  if (v === "aguardando")                        return { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }
  if (v === "permuta")                           return { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" }
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

  const GS = { border: "#e2e5e9", headerBg: "#f8f9fa", text: "#1a1d23", textMuted: "#6b7280" }

  return (
    <div
      style={{ background: "#fff", border: `1px solid ${GS.border}`, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 248, overflow: "hidden" }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: "10px 14px", background: GS.headerBg, borderBottom: `1px solid ${GS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: GS.text }}>Filtrar: {label}</span>
        <button onMouseDown={e => { e.preventDefault(); onClose() }} style={{ background: "none", border: "none", cursor: "pointer", color: GS.textMuted, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>✕</button>
      </div>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${GS.border}`, display: "flex", gap: 6 }}>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(true); onSort("asc") }}
          style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${sortAZ ? COR : GS.border}`, borderRadius: 6, background: sortAZ ? `${COR}15` : "#fff", color: sortAZ ? COR : GS.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: sortAZ ? 700 : 400 }}>
          <ChevronUp size={12} /> A → Z
        </button>
        <button onMouseDown={e => { e.preventDefault(); setSortAZ(false); onSort("desc") }}
          style={{ flex: 1, padding: "6px 8px", fontSize: 12, border: `1px solid ${!sortAZ ? COR : GS.border}`, borderRadius: 6, background: !sortAZ ? `${COR}15` : "#fff", color: !sortAZ ? COR : GS.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: !sortAZ ? 700 : 400 }}>
          <ChevronDown size={12} /> Z → A
        </button>
      </div>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${GS.border}` }}>
        <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="🔍 Buscar..."
          style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: `1px solid ${GS.border}`, borderRadius: 6, outline: "none", boxSizing: "border-box" as const }} />
      </div>
      <div style={{ padding: "6px 14px", borderBottom: `1px solid ${GS.border}`, background: "#fafafa" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: GS.text, fontWeight: 600 }}>
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : [...allOpts])}
            style={{ width: 14, height: 14, accentColor: COR, cursor: "pointer" }} />
          Selecionar tudo ({allOpts.length})
        </label>
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {visible.map(o => (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, color: GS.text }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f0f4ff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
            <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)}
              style={{ width: 14, height: 14, accentColor: COR, cursor: "pointer" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o}</span>
          </label>
        ))}
        {visible.length === 0 && <p style={{ padding: "12px 14px", fontSize: 12, color: GS.textMuted, margin: 0 }}>Nenhum valor encontrado</p>}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${GS.border}`, display: "flex", gap: 8, justifyContent: "flex-end", background: "#fafafa" }}>
        <button onMouseDown={e => { e.preventDefault(); onClose() }}
          style={{ padding: "6px 16px", fontSize: 12, border: `1px solid ${GS.border}`, borderRadius: 6, background: "#fff", cursor: "pointer", color: GS.text }}>
          Cancelar
        </button>
        <button onMouseDown={e => { e.preventDefault(); onApply(selected.length === allOpts.length ? [] : selected); onClose() }}
          style={{ padding: "6px 16px", fontSize: 12, border: "none", borderRadius: 6, background: COR, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
          OK
        </button>
      </div>
    </div>
  )
}

/* ── GeralTab ── */
function GeralTab() {
  const now = new Date()
  const anoAtual   = String(now.getFullYear())
  const mesNumero  = String(now.getMonth() + 1).padStart(2, "0") // "06"

  const [orcamento, setOrcamento]           = useState("")
  const [orcamentoInput, setOrcamentoInput] = useState("")
  const [allRows, setAllRows]               = useState<Record<string, InfluRow[]>>({})
  const [loading, setLoading]               = useState(true)
  const [filterAno, setFilterAno]           = useState(anoAtual)
  const [filterMes, setFilterMes]           = useState("todos")

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

  const todosMeses = Array.from(new Set(
    Object.values(allRows).flat()
      .filter(r => filterAno === "todos" || String(r.ano) === filterAno)
      .map(r => String(r.mes ?? "")).filter(Boolean)
  )).sort()

  /* Após carregar os dados, encontra o mês atual no formato exato que está no banco
     (ex: "06. junho") para que o filtro e o select batam corretamente */
  useEffect(() => {
    if (Object.keys(allRows).length === 0) return
    const mesNoBanco = todosMeses.find(m => m.trim().startsWith(mesNumero))
    setFilterMes(mesNoBanco ?? "todos")
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
  /* posição fixa do popup de filtro — calculada no clique para escapar do overflow */
  const [filterPopupPos, setFilterPopupPos] = useState<{ top: number; left: number } | null>(null)
  const [search, setSearch]               = useState("")
  const [selectedRow, setSelectedRow]     = useState<string | null>(null)
  const [sortCol, setSortCol]             = useState<string | null>(null)
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("asc")
  const [hoverRow, setHoverRow]           = useState<string | null>(null)
  /* modal de edição para colunas de texto longo */
  const [modalEdit, setModalEdit]         = useState<{ id: string; key: string; label: string; val: string } | null>(null)

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

  function closeFilterPopup() {
    setOpenFilterCol(null)
    setFilterPopupPos(null)
  }

  const activeFiltersCount = Object.values(colFilters).filter(v => v.length > 0).length

  const GS = {
    headerBg:     "#f8f9fa",
    headerBorder: "#e2e5e9",
    cellBorder:   "#edf0f3",
    rowHover:     "#f0f4ff",
    rowSelected:  "#e8effd",
    rowAlt:       "#fafbfd",
    text:         "#1a1d23",
    textMuted:    "#6b7280",
    inputBorder:  "#3b72f6",
  }

  const cellBase: React.CSSProperties = {
    padding: "8px 10px",
    borderRight: `1px solid ${GS.cellBorder}`,
    borderBottom: `1px solid ${GS.cellBorder}`,
    fontSize: 13,
    color: GS.text,
    overflow: "hidden",
    verticalAlign: "top" as const,
    cursor: "cell",
    wordBreak: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
    lineHeight: "20px",
  }

  if (loading) return (
    <div style={{ padding: 64, textAlign: "center" as const, color: GS.textMuted, fontSize: 14 }}>
      Carregando...
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#fff", border: `1px solid ${GS.headerBorder}`, borderBottom: "none", borderRadius: "10px 10px 0 0", flexWrap: "wrap" as const }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Buscar..."
          style={{ padding: "7px 12px", fontSize: 13, border: `1px solid ${GS.headerBorder}`, borderRadius: 8, outline: "none", background: "#fff", color: GS.text, width: 240 }}
        />
        <span style={{ fontSize: 12, color: GS.textMuted, background: "#f3f4f6", padding: "4px 10px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" as const }}>
          {filtered.length} {filtered.length !== 1 ? "linhas" : "linha"}
        </span>
        {activeFiltersCount > 0 && (
          <button onClick={() => setColFilters({})}
            style={{ padding: "5px 10px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#92400e", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""} ✕
          </button>
        )}
        {sortCol && (
          <button onClick={() => setSortCol(null)}
            style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#1d4ed8", display: "flex", alignItems: "center", gap: 4 }}>
            {cols.find(c => c.key === sortCol)?.label} {sortDir === "asc" ? "↑ A-Z" : "↓ Z-A"} ✕
          </button>
        )}
        {selectedRow && (
          <>
            <button onClick={() => { const r = filtered.find(r => r.id === selectedRow); if (r) duplicateRow(r) }}
              style={{ padding: "5px 12px", background: "#fff", border: `1px solid ${GS.headerBorder}`, borderRadius: 6, fontSize: 12, cursor: "pointer", color: GS.text, display: "flex", alignItems: "center", gap: 4 }}>
              <Copy size={13} /> Duplicar
            </button>
            <button onClick={() => deleteRow(selectedRow)}
              style={{ padding: "5px 12px", background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={13} /> Excluir
            </button>
          </>
        )}
        <button onClick={addRow}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: NAVY, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Nova linha
        </button>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        style={{ overflowX: "auto", overflowY: "auto", border: `1px solid ${GS.headerBorder}`, borderRadius: "0 0 10px 10px", maxHeight: 580 }}
      >
        <table style={{ borderCollapse: "collapse" as const, fontSize: 13, minWidth: "100%", tableLayout: "fixed" as const }}>
          <colgroup>
            <col style={{ width: 52 }} />
            {cols.map(c => <col key={c.key} style={{ width: c.width }} />)}
          </colgroup>
          <thead style={{ position: "sticky" as const, top: 0, zIndex: 10 }}>
            <tr style={{ background: GS.headerBg }}>
              <th style={{ width: 52, padding: "0 6px", height: 40, borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, textAlign: "center" as const, fontSize: 11, color: GS.textMuted, fontWeight: 600 }}>#</th>
              {cols.map(c => {
                const isFiltered = !!(colFilters[c.key]?.length > 0)
                const isSorted = sortCol === c.key
                const isOpen = openFilterCol === c.key
                return (
                  <th key={c.key} style={{ padding: 0, borderRight: `1px solid ${GS.headerBorder}`, borderBottom: `2px solid ${GS.headerBorder}`, background: isFiltered ? `${COR}08` : GS.headerBg, position: "relative" as const }}>
                    <div style={{ display: "flex", alignItems: "stretch", height: 40 }}>
                      <button onClick={() => toggleSort(c.key)}
                        style={{ flex: 1, padding: "0 4px 0 10px", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const, fontSize: 12, color: isSorted || isFiltered ? COR : GS.textMuted, fontWeight: isSorted || isFiltered ? 700 : 600, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", whiteSpace: "nowrap" as const }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                        {isFiltered && <span style={{ fontSize: 9, background: COR, color: "#fff", borderRadius: 10, padding: "1px 4px", flexShrink: 0 }}>●</span>}
                        {isSorted ? (sortDir === "asc" ? <ChevronUp size={11} color={COR} /> : <ChevronDown size={11} color={COR} />) : <ArrowUpDown size={10} style={{ opacity: 0.3, flexShrink: 0 }} />}
                      </button>
                      {/* Botão de filtro: calcula posição real (getBoundingClientRect) para o popup não ser cortado pelo overflow */}
                      <button
                        onMouseDown={e => {
                          e.preventDefault(); e.stopPropagation()
                          if (isOpen) {
                            closeFilterPopup()
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setFilterPopupPos({ top: rect.bottom + 4, left: rect.left })
                            setOpenFilterCol(c.key)
                          }
                        }}
                        style={{ width: 26, height: 40, background: isOpen ? `${COR}20` : isFiltered ? `${COR}15` : "none", border: "none", borderLeft: `1px solid ${GS.headerBorder}`, cursor: "pointer", color: isFiltered || isOpen ? COR : GS.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                        ▼
                      </button>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const isSelected = selectedRow === row.id
              const isHovered  = hoverRow === row.id
              const isAlt      = i % 2 === 1
              const bg = isSelected ? GS.rowSelected : isHovered ? GS.rowHover : isAlt ? GS.rowAlt : "#fff"

              return (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRow(isSelected ? null : row.id)}
                  onMouseEnter={() => setHoverRow(row.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{ background: bg, transition: "background 0.06s" }}
                >
                  {/* Célula #: altura fixa via wrapper interno para não causar deslocamento no hover */}
                  <td style={{ width: 52, padding: 0, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, verticalAlign: "middle" as const, cursor: "default", background: bg, boxShadow: isSelected ? `inset 3px 0 0 ${COR}` : "none" }}>
                    <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" as const }}>
                      {/* Número sempre renderizado; some no hover via opacity (sem afetar layout) */}
                      <span style={{ position: "absolute" as const, fontSize: 11, color: GS.textMuted, transition: "opacity 0.1s", opacity: (isHovered || isSelected) ? 0 : 1, pointerEvents: "none" }}>
                        {i + 1}
                      </span>
                      {/* Botões sempre renderizados; aparecem no hover via opacity (sem afetar layout) */}
                      <div style={{ display: "flex", gap: 3, transition: "opacity 0.1s", opacity: (isHovered || isSelected) ? 1 : 0, pointerEvents: (isHovered || isSelected) ? "auto" : "none" }}>
                        <button onClick={e => { e.stopPropagation(); duplicateRow(row) }} title="Duplicar"
                          style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: `1px solid ${GS.headerBorder}`, borderRadius: 5, cursor: "pointer", color: GS.textMuted }}>
                          <Copy size={11} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteRow(row.id) }} title="Excluir"
                          style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 5, cursor: "pointer", color: "#dc2626" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </td>

                  {cols.map(col => {
                    const val = row[col.key] || ""
                    const isEditing = editCell?.id === row.id && editCell?.key === col.key
                    const isLongText = LONG_TEXT_COLS.includes(col.key)

                    if (isEditing) return (
                      <td key={col.key} style={{ padding: 0, borderRight: `1px solid ${GS.cellBorder}`, borderBottom: `1px solid ${GS.cellBorder}`, verticalAlign: "top" as const, borderTop: `2px solid ${GS.inputBorder}` }}>
                        <textarea autoFocus value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => setTimeout(() => commitEdit(row.id, col.key, editVal), 100)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                            if (e.key === "Escape") setEditCell(null)
                            if (e.key === "Tab") { e.preventDefault(); commitEdit(row.id, col.key, editVal) }
                          }}
                          style={{ width: "100%", minHeight: 36, maxHeight: 140, padding: "8px 10px", fontSize: 13, border: "none", outline: "none", background: "#fff", color: GS.text, boxSizing: "border-box" as const, resize: "vertical" as const, lineHeight: "20px", fontFamily: "inherit" }}
                        />
                      </td>
                    )

                    if (col.type === "status") return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: "6px 8px", whiteSpace: "nowrap" as const }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ ...statusStyle(val), width: "100%", padding: "4px 10px", fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: "pointer", outline: "none", height: 28 }}>
                          <option value="">—</option>
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    )

                    if (col.type === "categoria") return (
                      <td key={col.key} style={{ ...cellBase, background: bg, padding: "6px 8px", whiteSpace: "nowrap" as const }}>
                        <select value={val} onChange={e => commitEdit(row.id, col.key, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ width: "100%", padding: "4px 10px", fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: "pointer", outline: "none", height: 28, background: `${COR}12`, color: COR, border: `1px solid ${COR}40` }}>
                          <option value="">—</option>
                          {CATEGORIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    )

                    if (col.type === "link" && val?.startsWith("http")) return (
                      <td key={col.key} style={{ ...cellBase, background: bg, textAlign: "center" as const, whiteSpace: "nowrap" as const }}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        <a href={val.split("\n")[0]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          style={{ color: "#2563eb", fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", background: "#eff6ff", borderRadius: 6, border: "1px solid #bfdbfe", fontWeight: 500 }}>
                          <ExternalLink size={11} /> ver
                        </a>
                      </td>
                    )

                    /* Colunas de texto longo: abre modal em duplo clique */
                    if (isLongText) return (
                      <td key={col.key}
                        style={{ ...cellBase, background: bg, cursor: "pointer", maxHeight: 72 }}
                        title="Duplo clique para editar"
                        onDoubleClick={e => { e.stopPropagation(); setModalEdit({ id: row.id, key: col.key, label: col.label, val }) }}>
                        {val
                          ? <span style={{ display: "-webkit-box" as React.CSSProperties["display"], WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"], overflow: "hidden", whiteSpace: "normal" as const }}>{val}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>}
                      </td>
                    )

                    return (
                      <td key={col.key} style={{ ...cellBase, background: bg }} title={val}
                        onDoubleClick={e => { e.stopPropagation(); setEditCell({ id: row.id, key: col.key }); setEditVal(val) }}>
                        {val
                          ? <span>{val}</span>
                          : <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={cols.length + 1} style={{ padding: "48px 24px", textAlign: "center" as const, color: GS.textMuted, fontSize: 14, borderBottom: `1px solid ${GS.cellBorder}` }}>
                  {search || Object.keys(colFilters).length > 0
                    ? "Nenhuma linha corresponde aos filtros aplicados."
                    : "Nenhuma linha cadastrada. Clique em \"Nova linha\" para começar."}
                </td>
              </tr>
            )}

            <tr
              onClick={addRow}
              onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = GS.rowHover}
              onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
              style={{ background: "#fafafa", cursor: "pointer" }}>
              <td colSpan={cols.length + 1} style={{ height: 36, borderBottom: `1px solid ${GS.cellBorder}`, textAlign: "center" as const, color: GS.textMuted, fontSize: 13 }}>
                + Nova linha
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: GS.textMuted, marginTop: 6 }}>
        Passe o mouse sobre a linha para duplicar ou excluir · Duplo clique para editar · Enter para confirmar · Shift+Enter para nova linha · Tab para próxima célula · ▼ para filtrar colunas · Shift+scroll para mover horizontalmente
      </p>

      {/* Popup de filtro com position:fixed para não ser cortado pelo overflow da tabela */}
      {openFilterCol && filterPopupPos && (() => {
        const col = cols.find(c => c.key === openFilterCol)
        if (!col) return null
        return (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onMouseDown={closeFilterPopup} />
            <div style={{ position: "fixed", top: filterPopupPos.top, left: filterPopupPos.left, zIndex: 999 }}>
              <ColFilterPopup
                colKey={openFilterCol}
                label={col.label}
                allRows={rows}
                active={colFilters[openFilterCol] || []}
                sortDir={sortCol === openFilterCol ? sortDir : null}
                onApply={vals => setColFilters(prev => vals.length ? { ...prev, [openFilterCol]: vals } : (({ [openFilterCol]: _, ...rest }) => rest)(prev))}
                onSort={dir => { if (dir) { setSortCol(openFilterCol); setSortDir(dir) } else setSortCol(null) }}
                onClose={closeFilterPopup}
              />
            </div>
          </>
        )
      })()}

      {/* Modal de edição para colunas de texto longo */}
      {modalEdit && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onMouseDown={() => setModalEdit(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, padding: 28, width: 600, maxWidth: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column" as const, gap: 16 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23" }}>{modalEdit.label}</span>
              <button
                onClick={() => setModalEdit(null)}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", color: "#6b7280" }}>
                <X size={16} />
              </button>
            </div>
            <textarea
              autoFocus
              value={modalEdit.val}
              onChange={e => setModalEdit(prev => prev ? { ...prev, val: e.target.value } : null)}
              onKeyDown={e => { if (e.key === "Escape") setModalEdit(null) }}
              placeholder="Digite aqui..."
              style={{ width: "100%", minHeight: 220, padding: "14px 16px", fontSize: 15, lineHeight: "26px", border: "1px solid #e2e5e9", borderRadius: 10, outline: "none", resize: "vertical" as const, fontFamily: "inherit", color: "#1a1d23", boxSizing: "border-box" as const }}
            />
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right" as const }}>
              {modalEdit.val.length} caracteres
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setModalEdit(null)}
                style={{ padding: "9px 20px", fontSize: 14, border: "1px solid #e2e5e9", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#6b7280" }}>
                Cancelar
              </button>
              <button
                onClick={() => { commitEdit(modalEdit.id, modalEdit.key, modalEdit.val); setModalEdit(null) }}
                style={{ padding: "9px 24px", fontSize: 14, border: "none", borderRadius: 8, background: NAVY, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page principal ── */
export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("geral")

  return (
    <TeamLayout teamId="social-midia">
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: T.cardFg, margin: "0 0 3px" }}>Controle de Influencers</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "9px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", border: activeTab === t.id ? "none" : `1px solid ${T.border}`, transition: "all .15s", background: activeTab === t.id ? NAVY : T.card, color: activeTab === t.id ? "#fff" : T.mutedFg, boxShadow: activeTab === t.id ? `0 2px 8px ${NAVY}40` : T.elevSm }}>
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
