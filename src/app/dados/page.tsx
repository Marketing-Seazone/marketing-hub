"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Play, Database, BookOpen, AlertCircle, Loader2 } from "lucide-react"
import { T } from "@/lib/constants"

// ─── Dicionário de tabelas ────────────────────────────────────────────────────

const TABLES = [
  {
    name: "nekt_silver.ads_unificado",
    label: "Ads Unificado",
    description: "Dados diários de performance de anúncios (Meta). Uma linha por anúncio por dia.",
    color: T.primary,
    columns: [
      { name: "date",               type: "date",    desc: "Data da métrica" },
      { name: "ad_id",              type: "text",    desc: "ID do anúncio no Meta" },
      { name: "ad_name",            type: "text",    desc: "Nome do anúncio" },
      { name: "adset_id",           type: "text",    desc: "ID do conjunto de anúncios" },
      { name: "adset_name",         type: "text",    desc: "Nome do conjunto de anúncios" },
      { name: "campaign_name",      type: "text",    desc: "Nome da campanha" },
      { name: "vertical",           type: "text",    desc: "Vertical (Investimentos / Servicos / Marketplace)" },
      { name: "plataforma",         type: "text",    desc: "Plataforma (facebook / instagram)" },
      { name: "impressions",        type: "número",  desc: "Impressões" },
      { name: "reach",              type: "número",  desc: "Alcance único" },
      { name: "clicks",             type: "número",  desc: "Cliques no link" },
      { name: "spend",              type: "número",  desc: "Investimento em R$" },
      { name: "ctr",                type: "número",  desc: "CTR (cliques / impressões)" },
      { name: "frequency",          type: "número",  desc: "Frequência média" },
      { name: "lead",               type: "número",  desc: "Leads gerados" },
      { name: "mql",                type: "número",  desc: "MQL atribuído" },
      { name: "sql",                type: "número",  desc: "SQL atribuído" },
      { name: "opp",                type: "número",  desc: "Oportunidade atribuída" },
      { name: "won",                type: "número",  desc: "Venda ganha atribuída" },
      { name: "dias_ativos",        type: "número",  desc: "Dias que o anúncio ficou ativo" },
      { name: "first_day_ad",       type: "date",    desc: "Primeiro dia de veiculação do anúncio" },
      { name: "first_day_adset",    type: "date",    desc: "Primeiro dia do conjunto" },
      { name: "first_day_campaign", type: "date",    desc: "Primeiro dia da campanha" },
      { name: "status",             type: "text",    desc: "Status do anúncio (unreliable — usar Meta API)" },
    ],
  },
  {
    name: "nekt_silver.deals_pipedrive_join_marketing",
    label: "Deals Pipedrive × Marketing",
    description: "Deals do Pipedrive com atribuição de campanha de marketing. Fonte principal para funil e WON.",
    color: T.verde600,
    columns: [
      { name: "id",                    type: "texto",   desc: "ID do deal no Pipedrive" },
      { name: "rd_campanha",           type: "texto",   desc: "Campanha de origem — contém [SI], [SS] ou [MKTPLACE]" },
      { name: "status",                type: "texto",   desc: "'won', 'lost', 'open'" },
      { name: "negocio_criado_em",     type: "data",    desc: "Data de criação do deal → MQL" },
      { name: "data_de_qualificacao",  type: "data",    desc: "Data de qualificação → SQL" },
      { name: "data_da_reuniao",       type: "data",    desc: "Data da reunião → Oportunidade" },
      { name: "ganho_em",              type: "data",    desc: "Data de fechamento → WON" },
      { name: "title",                 type: "texto",   desc: "Título do deal" },
      { name: "value",                 type: "número",  desc: "Valor do deal em R$" },
      { name: "owner_name",            type: "texto",   desc: "Nome do responsável (SDR/consultor)" },
      { name: "pipeline_id",           type: "texto",   desc: "ID do pipeline no Pipedrive" },
      { name: "stage_id",              type: "texto",   desc: "ID da etapa atual" },
    ],
  },
  {
    name: "nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable",
    label: "Funil SZI (Investimentos)",
    description: "Funil pré-agregado de mídia paga para o vertical de Investimentos (Seazone Investimentos).",
    color: T.laranja500,
    columns: [
      { name: "data",       type: "data",   desc: "Data de referência" },
      { name: "mql_szi",   type: "número", desc: "MQLs do dia" },
      { name: "sql_szi",   type: "número", desc: "SQLs do dia" },
      { name: "opp_szi",   type: "número", desc: "Oportunidades do dia" },
      { name: "won_szi",   type: "número", desc: "Vendas ganhas do dia" },
    ],
  },
  {
    name: "nekt_silver.funil_mktp_pago_mql_sql_opp_won_lovable",
    label: "Funil Marketplace",
    description: "Funil pré-agregado de mídia paga para o vertical de Marketplace.",
    color: T.teal600,
    columns: [
      { name: "data",        type: "data",   desc: "Data de referência" },
      { name: "mql_mktp",   type: "número", desc: "MQLs do dia" },
      { name: "sql_mktp",   type: "número", desc: "SQLs do dia" },
      { name: "opp_mktp",   type: "número", desc: "Oportunidades do dia" },
      { name: "won_mktp",   type: "número", desc: "Vendas ganhas do dia" },
    ],
  },
  {
    name: "nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable",
    label: "Funil SZS (Serviços)",
    description: "Funil pré-agregado de mídia paga para o vertical de Serviços (Seazone Serviços).",
    color: T.roxo600,
    columns: [
      { name: "data",       type: "data",   desc: "Data de referência" },
      { name: "mql_szs",   type: "número", desc: "MQLs do dia" },
      { name: "sql_szs",   type: "número", desc: "SQLs do dia" },
      { name: "opp_szs",   type: "número", desc: "Oportunidades do dia" },
      { name: "won_szs",   type: "número", desc: "Vendas ganhas do dia" },
    ],
  },
]

const EXAMPLE_QUERIES = [
  {
    label: "Top campanhas por spend (últimos 30 dias)",
    sql: `SELECT campaign_name, SUM(spend) AS spend, SUM(lead) AS leads, SUM(mql) AS mql
FROM nekt_silver.ads_unificado
WHERE date >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY 1
ORDER BY spend DESC
LIMIT 20`,
  },
  {
    label: "Deals WON com campanha (últimos 90 dias)",
    sql: `SELECT rd_campanha, COUNT(DISTINCT id) AS won, SUM(value) AS receita
FROM nekt_silver.deals_pipedrive_join_marketing
WHERE status = 'won'
  AND DATE(ganho_em) >= CURRENT_DATE - INTERVAL '90' DAY
GROUP BY 1
ORDER BY won DESC`,
  },
  {
    label: "Funil SZI — últimos 30 dias",
    sql: `SELECT data, mql_szi, sql_szi, opp_szi, won_szi
FROM nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable
WHERE data >= CURRENT_DATE - INTERVAL '30' DAY
ORDER BY data DESC`,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = "explorador" | "dicionario"

export default function DadosPage() {
  const [tab, setTab] = useState<Tab>("explorador")
  const [sql, setSql] = useState(EXAMPLE_QUERIES[0].sql)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ columns: string[]; rows: Record<string, string | number | null>[] } | null>(null)
  const [error, setError] = useState("")
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  async function runQuery() {
    if (!sql.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro desconhecido")
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: T.primary, flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Dados</span>
      </header>

      <main style={{ padding: "32px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 6px" }}>
            Nekt · Pipedrive · Meta
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.cardFg, margin: "0 0 6px" }}>
            Explorador de Dados
          </h1>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0 }}>
            Consulte as tabelas da Nekt diretamente. Use o Dicionário para entender as colunas antes de montar sua query.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {(["explorador", "dicionario"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              color: tab === t ? T.primary : T.mutedFg,
              borderBottom: tab === t ? `2px solid ${T.primary}` : "2px solid transparent",
              marginBottom: -1, fontFamily: T.font,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {t === "explorador" ? <><Play size={13} /> Explorador</> : <><BookOpen size={13} /> Dicionário</>}
            </button>
          ))}
        </div>

        {/* ── Explorador ── */}
        {tab === "explorador" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Exemplos */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EXAMPLE_QUERIES.map(q => (
                <button key={q.label} onClick={() => setSql(q.sql)} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 6, padding: "5px 12px",
                  fontSize: 12, fontWeight: 500, color: T.mutedFg,
                  cursor: "pointer", fontFamily: T.font,
                }}>
                  {q.label}
                </button>
              ))}
            </div>

            {/* Editor */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
              <div style={{
                background: T.cinza800, padding: "8px 14px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, color: T.cinza400, fontFamily: "monospace" }}>SQL</span>
                <button
                  onClick={runQuery}
                  disabled={loading || !sql.trim()}
                  style={{
                    background: T.primary, color: "#fff",
                    border: "none", borderRadius: 6,
                    padding: "5px 14px", fontSize: 12, fontWeight: 700,
                    cursor: loading || !sql.trim() ? "not-allowed" : "pointer",
                    opacity: loading || !sql.trim() ? 0.6 : 1,
                    display: "flex", alignItems: "center", gap: 6,
                    fontFamily: T.font,
                  }}
                >
                  {loading ? <><Loader2 size={12} /> Executando...</> : <><Play size={12} /> Executar</>}
                </button>
              </div>
              <textarea
                value={sql}
                onChange={e => setSql(e.target.value)}
                rows={8}
                spellCheck={false}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: T.cinza800, color: "#e2e8f0",
                  border: "none", outline: "none",
                  padding: "14px 18px",
                  fontFamily: "monospace", fontSize: 13, lineHeight: 1.7,
                  resize: "vertical",
                }}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runQuery() }
                }}
              />
              <div style={{ padding: "6px 14px", background: T.cinza800, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                <span style={{ fontSize: 11, color: T.cinza400 }}>Ctrl + Enter para executar</span>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: `${T.destructive}10`, border: `1px solid ${T.destructive}30`,
                borderRadius: 10, padding: "12px 16px",
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <AlertCircle size={16} color={T.destructive} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: T.destructive, fontFamily: "monospace" }}>{error}</span>
              </div>
            )}

            {/* Resultado */}
            {result && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Database size={14} color={T.mutedFg} />
                  <span style={{ fontSize: 12, color: T.mutedFg }}>
                    {result.rows.length} linha{result.rows.length !== 1 ? "s" : ""} · {result.columns.length} coluna{result.columns.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.muted }}>
                        {result.columns.map(col => (
                          <th key={col} style={{
                            padding: "8px 12px", textAlign: "left",
                            fontWeight: 600, color: T.mutedFg,
                            borderBottom: `1px solid ${T.border}`,
                            whiteSpace: "nowrap",
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          {result.columns.map(col => (
                            <td key={col} style={{
                              padding: "7px 12px", color: row[col] === null ? T.mutedFg : T.cardFg,
                              whiteSpace: "nowrap", fontFamily: "monospace",
                            }}>
                              {row[col] === null ? "—" : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Dicionário ── */}
        {tab === "dicionario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TABLES.map(table => {
              const open = expandedTable === table.name
              return (
                <div key={table.name} style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm,
                }}>
                  {/* Header da tabela */}
                  <button
                    onClick={() => setExpandedTable(open ? null : table.name)}
                    style={{
                      width: "100%", background: "none", border: "none",
                      padding: "18px 20px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 14, fontFamily: T.font,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${table.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Database size={16} color={table.color} />
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.cardFg, marginBottom: 2 }}>
                        {table.label}
                      </div>
                      <code style={{
                        fontSize: 11, color: table.color,
                        background: `${table.color}10`, padding: "1px 6px",
                        borderRadius: 4, border: `1px solid ${table.color}25`,
                      }}>
                        {table.name}
                      </code>
                    </div>
                    <span style={{ fontSize: 13, color: T.mutedFg, maxWidth: 360, textAlign: "right", lineHeight: 1.4 }}>
                      {table.description}
                    </span>
                    <span style={{ color: T.mutedFg, fontSize: 16, marginLeft: 8, flexShrink: 0 }}>
                      {open ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Colunas */}
                  {open && (
                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.muted }}>
                            <th style={{ padding: "7px 20px", textAlign: "left", fontWeight: 600, color: T.mutedFg, width: "28%" }}>Coluna</th>
                            <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: T.mutedFg, width: "12%" }}>Tipo</th>
                            <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: T.mutedFg }}>Descrição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col, i) => (
                            <tr key={col.name} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : T.muted }}>
                              <td style={{ padding: "7px 20px" }}>
                                <code style={{ fontFamily: "monospace", fontSize: 12, color: table.color, fontWeight: 600 }}>
                                  {col.name}
                                </code>
                              </td>
                              <td style={{ padding: "7px 12px" }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 600,
                                  color: col.type === "número" ? T.verde600 : col.type === "data" ? T.laranja500 : T.mutedFg,
                                  background: col.type === "número" ? `${T.verde600}10` : col.type === "data" ? `${T.laranja500}10` : T.muted,
                                  padding: "1px 6px", borderRadius: 4,
                                }}>
                                  {col.type}
                                </span>
                              </td>
                              <td style={{ padding: "7px 12px", color: T.mutedFg, lineHeight: 1.5 }}>{col.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Botão copiar nome da tabela */}
                      <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
                        <button
                          onClick={() => { setTab("explorador"); setSql(`SELECT *\nFROM ${table.name}\nLIMIT 100`) }}
                          style={{
                            background: `${table.color}10`, border: `1px solid ${table.color}30`,
                            borderRadius: 6, padding: "5px 12px",
                            fontSize: 12, fontWeight: 600, color: table.color,
                            cursor: "pointer", fontFamily: T.font,
                          }}
                        >
                          Abrir no Explorador →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
