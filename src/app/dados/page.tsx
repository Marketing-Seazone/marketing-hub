"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, Play, Database, BookOpen, AlertCircle, Loader2, Lightbulb, Code2, Search } from "lucide-react"
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

type Tab = "explorador" | "dicionario" | "como-usar"

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
          {([
            { id: "explorador",  label: "Explorador",  icon: <Play size={13} /> },
            { id: "dicionario",  label: "Dicionário",  icon: <BookOpen size={13} /> },
            { id: "como-usar",   label: "Como usar",   icon: <Lightbulb size={13} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              color: tab === t.id ? T.primary : T.mutedFg,
              borderBottom: tab === t.id ? `2px solid ${T.primary}` : "2px solid transparent",
              marginBottom: -1, fontFamily: T.font,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.icon} {t.label}
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

        {/* ── Como usar ── */}
        {tab === "como-usar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Bloco 1 — Explorar dados */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Search size={16} color={T.primary} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Explorar dados pontualmente</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Para quem quer consultar um número, validar uma hipótese ou entender os dados disponíveis.</p>
                </div>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, lineHeight: 1.7 }}>
                  Use a aba <strong style={{ color: T.cardFg }}>Explorador</strong> para rodar qualquer SQL diretamente nas tabelas da Nekt.
                  Se não souber SQL, use a aba <strong style={{ color: T.cardFg }}>Dicionário</strong> para entender o que cada tabela e coluna contém,
                  depois monte sua query ou peça ajuda para alguém do time.
                </p>
                <div style={{ background: `${T.primary}08`, border: `1px solid ${T.primary}20`, borderRadius: 8, padding: "12px 16px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.primary, margin: "0 0 4px" }}>Exemplo de uso</p>
                  <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, lineHeight: 1.6 }}>
                    "Quero saber quanto foi gasto nas campanhas de Marketplace nos últimos 7 dias" →
                    abre o Explorador, clica em <em>Top campanhas por spend</em> e ajusta o filtro de vertical e período.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 2 — Usar como base de artefato */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.elevSm }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.verde600}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Code2 size={16} color={T.verde600} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: 0 }}>Usar os dados como base de um artefato</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>Para quem está construindo um dashboard ou ferramenta dentro de um time.</p>
                </div>
              </div>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, lineHeight: 1.7 }}>
                  O Marketing Hub já tem uma rota de API pronta que conecta na Nekt:
                  <code style={{ fontFamily: "monospace", fontSize: 12, background: T.muted, padding: "1px 6px", borderRadius: 4, margin: "0 4px" }}>POST /api/query</code>.
                  Qualquer artefato dentro do hub pode chamar essa rota passando um SQL e receber os dados em JSON — sem precisar configurar credenciais ou instalar nada.
                </p>

                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Como chamar a rota no seu artefato</p>
                  <div style={{ background: T.cinza800, color: "#e2e8f0", borderRadius: 10, padding: "14px 18px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, overflowX: "auto", whiteSpace: "pre" }}>{`const res = await fetch("/api/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sql: \`
      SELECT campaign_name, SUM(spend) AS spend, SUM(mql) AS mql
      FROM nekt_silver.ads_unificado
      WHERE date >= CURRENT_DATE - INTERVAL '7' DAY
      GROUP BY 1
      ORDER BY spend DESC
    \`
  }),
})
const { columns, rows } = await res.json()
// rows = [{ campaign_name: "...", spend: 1200, mql: 3 }, ...]`}</div>
                </div>

                <div style={{ background: `${T.verde600}08`, border: `1px solid ${T.verde600}20`, borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.verde600, margin: 0 }}>Criando um artefato com Claude Code</p>
                  <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, lineHeight: 1.7 }}>
                    Se você estiver usando o Claude Code para criar o artefato, diga explicitamente que os dados devem vir da Nekt via Marketing Hub.
                    Exemplo de comando:
                  </p>
                  <div style={{ background: T.cinza800, color: "#e2e8f0", borderRadius: 8, padding: "12px 16px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{`"Cria um dashboard de campanhas no time de Growth.
Quero uma tabela com MQL e gasto por campanha dos últimos 7 dias.
Use a rota /api/query do Marketing Hub para buscar os dados
da tabela nekt_silver.ads_unificado."`}</div>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.6 }}>
                    Com isso o Claude já sabe qual rota usar, qual tabela consultar e como montar o SQL — sem precisar configurar nada.
                    Use o <strong style={{ color: T.cardFg }}>Dicionário</strong> para escolher as colunas certas antes de dar o comando.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 3 — Tabelas disponíveis resumo */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", boxShadow: T.elevSm }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.mutedFg, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                Tabelas disponíveis — resumo rápido
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "nekt_silver.ads_unificado",                              color: T.primary,    label: "Ads Unificado",         use: "Performance de anúncios Meta — spend, impressões, MQL, WON por anúncio/dia" },
                  { name: "nekt_silver.deals_pipedrive_join_marketing",             color: T.verde600,   label: "Deals Pipedrive",        use: "Deals com atribuição de campanha — funil completo e status WON" },
                  { name: "nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable",    color: T.laranja500, label: "Funil SZI",              use: "Funil pré-agregado de Investimentos (SZI) por dia" },
                  { name: "nekt_silver.funil_mktp_pago_mql_sql_opp_won_lovable",   color: T.teal600,    label: "Funil Marketplace",      use: "Funil pré-agregado de Marketplace por dia" },
                  { name: "nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable",    color: T.roxo600,    label: "Funil SZS",              use: "Funil pré-agregado de Serviços (SZS) por dia" },
                ].map(t => (
                  <div key={t.name} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <code style={{ fontSize: 11, color: t.color, fontFamily: "monospace", fontWeight: 600 }}>{t.name}</code>
                      <span style={{ fontSize: 12, color: T.mutedFg, marginLeft: 8 }}>— {t.use}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
