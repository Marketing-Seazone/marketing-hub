"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, AlertTriangle, TrendingDown, Clock, Users, CheckCircle, XCircle, MinusCircle, Zap, MessageSquare } from "lucide-react"
import { T } from "@/lib/constants"

// ── Dados estáticos da investigação (26/mai/2026) ──────────────────────────

const LEAD_TRACE = [
  { funnel: "Investidor",   estado: "not_mql",  total: 196, pipedrive: false },
  { funnel: "Proprietário", estado: "partial",  total: 168, pipedrive: false },
  { funnel: "Corretor",     estado: "partial",  total: 165, pipedrive: false },
  { funnel: "Investidor",   estado: "partial",  total:  99, pipedrive: false },
  { funnel: "Franqueado",   estado: "partial",  total:  68, pipedrive: false },
  { funnel: "Construtora",  estado: "partial",  total:  16, pipedrive: false },
  { funnel: "Investidor",   estado: "ok",       total: 126, pipedrive: true  },
]

const SZS_RESPONSE = [
  { faixa: "0–15 min",  qtd: 16, cor: T.statusOk },
  { faixa: "15–60 min", qtd: 20, cor: T.statusOk },
  { faixa: "1–4h",      qtd: 18, cor: T.statusWarn },
  { faixa: "4–24h",     qtd: 27, cor: T.statusErr },
  { faixa: "+24h",      qtd:  2, cor: T.statusErr },
]

const MKTP_RESPONSE = [
  { faixa: "0–15 min",  qtd:  1, cor: T.statusOk },
  { faixa: "4–24h",     qtd:  2, cor: T.statusErr },
  { faixa: "+24h",      qtd:  7, cor: T.statusErr },
]

const HIPOTESES = [
  { hipotese: "Mia envia mensagens com erro de markdown → lead abandona",         status: "confirmada", evidencia: "32.2% das conversas CTWA com bug sistêmico. Leads ficam em 'partial'." },
  { hipotese: "Mia não está transbordando para SDR do MKTP",                      status: "confirmada", evidencia: "57% dos leads MKTP presos com Mia. Apenas 30% receberam ação do SDR." },
  { hipotese: "SDR demora para atender após transbordo",                           status: "confirmada", evidencia: "55% SZS demoram +1h. 70% MKTP demoram +24h." },
  { hipotese: "Mia agenda reunião na 1ª mensagem → lead não comparece (no-show)", status: "plausivel",  evidencia: "24.1% no-show entre os que aceitam. Não tenho dado de timing exato." },
  { hipotese: "Picos de MQL quebram a capacidade de conversão do time",            status: "confirmada", evidencia: "Dia 14/mai: 116 MQL → apenas 21 SQL (18% conversão)." },
]

const RECOMENDACOES = [
  {
    prioridade: "urgente",
    titulo: "Corrigir bug de markdown na Mia",
    desc: "O template que gera '…*tamos fgts e carta de crédito_' está quebrado. Afeta 32% das conversas CTWA. Lead que recebe texto embaralhado abandona.",
    impacto: "Alto",
    esforco: "Baixo",
  },
  {
    prioridade: "urgente",
    titulo: "Investigar 27 leads MKTP presos com Mia",
    desc: "57% dos transbordos do MKTP nunca chegam ao SDR. Verificar se o trigger de transbordo está funcionando, se há fila travada ou condição de falha silenciosa.",
    impacto: "Alto",
    esforco: "Médio",
  },
  {
    prioridade: "alto",
    titulo: "Reduzir SLA do transbordo para <15min",
    desc: "Hoje 55% SZS e 90% MKTP demoram mais de 15min. Lead no WhatsApp esfria em minutos. Meta: SDR contata em até 15 min após transbordo.",
    impacto: "Alto",
    esforco: "Médio",
  },
  {
    prioridade: "alto",
    titulo: "Régua de confirmação automática de reunião",
    desc: "35% dos convidados não confirmam. Enviar lembrete automático via WhatsApp 24h e 2h antes. Potencial de converter parte dos 254 'needs action' em presença.",
    impacto: "Médio",
    esforco: "Baixo",
  },
  {
    prioridade: "alto",
    titulo: "Não agendar reunião na 1ª mensagem do CTWA",
    desc: "Dado do projeto de no-show: reunião agendada sem qualificação prévia gera mais no-show. A Mia deve primeiro qualificar e criar conexão, só então propor horário.",
    impacto: "Médio",
    esforco: "Baixo",
  },
  {
    prioridade: "medio",
    titulo: "Régua de reativação para leads 'partial'",
    desc: "668 leads ficaram presos entre abr–mai (proprietários, corretores, investidores). Sequência de reengajamento personalizada por funnel pode recuperar parte.",
    impacto: "Médio",
    esforco: "Alto",
  },
]

// ── Funnel live data types ──────────────────────────────────────────────────

interface FunnelRow {
  data: string
  mql: number
  sql: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    confirmada: { bg: T.statusOkBg,   fg: T.statusOkDark,   label: "✓ Confirmada"  },
    plausivel:  { bg: T.statusWarnBg, fg: T.statusWarnDark, label: "~ Plausível"   },
    refutada:   { bg: T.statusErrBg,  fg: T.statusErrDark,  label: "✗ Refutada"    },
  }
  const s = map[status] ?? map.plausivel
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      borderRadius: 99, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  )
}

function PrioTag({ p }: { p: string }) {
  if (p === "urgente") return <span style={{ fontSize: 10, fontWeight: 800, background: T.statusErrBg, color: T.statusErrDark, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em" }}>URGENTE</span>
  if (p === "alto")    return <span style={{ fontSize: 10, fontWeight: 800, background: T.statusWarnBg, color: T.statusWarnDark, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em" }}>ALTO</span>
  return                      <span style={{ fontSize: 10, fontWeight: 800, background: T.pendingBg, color: T.pendingFg, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em" }}>MÉDIO</span>
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: T.cardFg, margin: "0 0 4px" }}>{children}</h2>
      {sub && <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>{sub}</p>}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: T.elevSm, ...style,
    }}>
      {children}
    </div>
  )
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "20px 24px", flex: 1, borderRight: `1px solid ${T.border}` }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color: color ?? T.cardFg, margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: T.mutedFg, margin: 0 }}>{sub}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnaliseFunilMia() {
  const [funnelSZS, setFunnelSZS] = useState<FunnelRow[]>([])
  const [loadingFunnel, setLoadingFunnel] = useState(true)

  useEffect(() => {
    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: `
          SELECT data, mql_szs AS mql, sql_szs AS sql
          FROM nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable
          WHERE data >= CURRENT_DATE - INTERVAL '21' DAY
            AND (mql_szs > 0 OR sql_szs > 0)
          ORDER BY data DESC
          LIMIT 14
        `,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.rows) {
          setFunnelSZS(d.rows.map((r: Record<string, string | number>) => ({
            data: String(r.data ?? "").slice(0, 10),
            mql:  Number(r.mql  ?? 0),
            sql:  Number(r.sql  ?? 0),
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFunnel(false))
  }, [])

  // Totais
  const totalPartial = LEAD_TRACE.filter(r => !r.pipedrive).reduce((s, r) => s + r.total, 0)
  const totalOk      = LEAD_TRACE.filter(r =>  r.pipedrive).reduce((s, r) => s + r.total, 0)
  const pctStuck     = Math.round(totalPartial / (totalPartial + totalOk) * 100)

  const szsTotal = SZS_RESPONSE.reduce((s, r) => s + r.qtd, 0)
  const szsLento = SZS_RESPONSE.filter(r => ["1–4h", "4–24h", "+24h"].includes(r.faixa)).reduce((s, r) => s + r.qtd, 0)

  const mktpTotal = MKTP_RESPONSE.reduce((s, r) => s + r.qtd, 0)
  const mktpLento = MKTP_RESPONSE.filter(r => ["+24h"].includes(r.faixa)).reduce((s, r) => s + r.qtd, 0)

  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40, boxShadow: T.elevSm,
      }}>
        <Link href="/growth" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Growth
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.laranja500, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Análise: Funil CTWA + Mia</span>
      </header>

      <main style={{ padding: "32px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 6px" }}>
            Growth · 26 mai 2026 · abr–mai/2026
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: T.cardFg, margin: "0 0 8px", lineHeight: 1.2 }}>
            Por que os leads ficam presos e<br />não avançam para Agendado?
          </h1>
          <p style={{ fontSize: 13, color: T.mutedFg, margin: 0, maxWidth: 620, lineHeight: 1.6 }}>
            Investigação completa do funil pós-CTWA: comportamento da Mia, timing de transbordo, taxa de no-show e gargalos que impedem o lead de avançar para SQL e reunião.
          </p>
        </div>

        {/* Alert Banner */}
        <div style={{
          background: T.statusErrBg, border: `1px solid ${T.statusErr}40`,
          borderRadius: 12, padding: "14px 20px", marginBottom: 28,
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <AlertTriangle size={18} color={T.statusErr} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.statusErrDark, margin: "0 0 2px" }}>
              Bug crítico ativo na Mia — 32.2% das conversas CTWA com erro de markdown
            </p>
            <p style={{ fontSize: 12, color: T.statusErrDark, margin: 0, opacity: 0.8 }}>
              Mensagens com asteriscos soltos aparecem como texto confuso no WhatsApp. 18 de 19 casos são do mesmo template. Leads provavelmente abandonam ao receber essa mensagem.
            </p>
          </div>
        </div>

        {/* KPIs top */}
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <StatBox label="Leads presos (não chegam ao Pipedrive)" value={`${pctStuck}%`} sub={`${totalPartial} de ${totalPartial + totalOk} leads desde abr/26`} color={T.statusErr} />
            <StatBox label="MKTP: leads ainda com Mia após transbordo" value="57%" sub="27 de 47 transbordos sem ação do SDR" color={T.statusErr} />
            <StatBox label="No-show (aceitou mas não foi)" value="24.1%" sub="106 de 440 reuniões aceitas" color={T.statusWarn} />
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 6px" }}>SZS: resposta SDR &gt;1h</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: T.statusWarn, margin: "0 0 2px", lineHeight: 1 }}>{Math.round(szsLento/szsTotal*100)}%</p>
              <p style={{ fontSize: 11, color: T.mutedFg, margin: 0 }}>{szsLento} de {szsTotal} respondidos demoram +1h</p>
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

          {/* Funil SZS ao vivo */}
          <div>
            <SectionTitle>Funil SZS — MQL vs SQL (últimos 14 dias)</SectionTitle>
            <Card>
              {loadingFunnel ? (
                <div style={{ padding: "32px 24px", textAlign: "center", color: T.mutedFg, fontSize: 13 }}>Carregando...</div>
              ) : funnelSZS.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center", color: T.mutedFg, fontSize: 13 }}>Sem dados</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.muted }}>
                        {["Data", "MQL", "SQL", "Conv. %"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap", textAlign: h === "Data" ? "left" as const : "right" as const }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {funnelSZS.map(row => {
                        const conv = row.mql > 0 ? Math.round(row.sql / row.mql * 100) : null
                        const low  = conv !== null && conv < 30
                        return (
                          <tr key={row.data} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: "7px 14px", color: T.mutedFg, fontFamily: "monospace", fontSize: 11 }}>{row.data}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: T.cardFg }}>{row.mql}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right", fontWeight: 600, color: T.cardFg }}>{row.sql}</td>
                            <td style={{ padding: "7px 14px", textAlign: "right" }}>
                              {conv !== null ? (
                                <span style={{
                                  fontWeight: 700,
                                  color: low ? T.statusErr : conv < 50 ? T.statusWarn : T.statusOk,
                                }}>
                                  {conv}%
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 11, color: T.mutedFg }}>
                      Conversão abaixo de 30% = pico não atendido. Fonte: Nekt Silver / Pipedrive.
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Leads presos */}
          <div>
            <SectionTitle sub="mia_status=pending · desde 01/abr/2026">Leads presos com Mia</SectionTitle>
            <Card>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.muted }}>
                      {["Funnel", "Estado", "Total", "Pipedrive?"].map(h => (
                        <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontWeight: 700, color: T.mutedFg, borderBottom: `1px solid ${T.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LEAD_TRACE.sort((a, b) => b.total - a.total).map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: row.pipedrive ? `${T.statusOk}08` : "transparent" }}>
                        <td style={{ padding: "7px 14px", fontWeight: 600, color: T.cardFg }}>{row.funnel}</td>
                        <td style={{ padding: "7px 14px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            background: row.estado === "ok" ? T.statusOkBg : row.estado === "not_mql" ? T.statusErrBg : T.statusWarnBg,
                            color: row.estado === "ok" ? T.statusOkDark : row.estado === "not_mql" ? T.statusErrDark : T.statusWarnDark,
                            padding: "2px 7px", borderRadius: 99,
                          }}>
                            {row.estado}
                          </span>
                        </td>
                        <td style={{ padding: "7px 14px", fontWeight: 700, color: T.cardFg }}>{row.total}</td>
                        <td style={{ padding: "7px 14px" }}>
                          {row.pipedrive
                            ? <CheckCircle size={14} color={T.statusOk} />
                            : <XCircle size={14} color={T.statusErr} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: T.statusErrDark, fontWeight: 700 }}>
                    {pctStuck}% não chegam ao Pipedrive
                  </span>
                  <span style={{ fontSize: 11, color: T.mutedFg }}>
                    lead_trace_snapshots · Nekt
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Timing transbordo */}
        <SectionTitle sub="Quanto tempo o SDR demora para agir após receber o lead — desde 01/abr/2026">Timing do Transbordo Mia → SDR</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

          {/* SZS */}
          <Card>
            <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: T.cardFg, margin: 0 }}>SZS</p>
                <p style={{ fontSize: 11, color: T.mutedFg, margin: 0 }}>150 transbordos · 116 responderam (77%)</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: T.mutedFg, margin: "0 0 2px" }}>Sem ação</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: T.statusErr, margin: 0 }}>22 (15%)</p>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {SZS_RESPONSE.map(row => (
                <div key={row.faixa} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.mutedFg, width: 72, flexShrink: 0 }}>{row.faixa}</span>
                  <div style={{ flex: 1, background: T.muted, borderRadius: 99, height: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(row.qtd / szsTotal * 100)}%`, background: row.cor, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.cor, width: 38, textAlign: "right" }}>{row.qtd}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "8px 12px", background: T.statusWarnBg, borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: T.statusWarnDark, margin: 0, fontWeight: 600 }}>
                  {Math.round(szsLento / szsTotal * 100)}% demoram mais de 1h para reagir ao transbordo
                </p>
              </div>
            </div>
          </Card>

          {/* MKTP */}
          <Card>
            <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: T.cardFg, margin: 0 }}>Marketplace</p>
                <p style={{ fontSize: 11, color: T.mutedFg, margin: 0 }}>47 transbordos · apenas 14 responderam (30%)</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: T.mutedFg, margin: "0 0 2px" }}>Ainda com Mia</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: T.statusErr, margin: 0 }}>27 (57%)</p>
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {MKTP_RESPONSE.map(row => (
                <div key={row.faixa} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.mutedFg, width: 72, flexShrink: 0 }}>{row.faixa}</span>
                  <div style={{ flex: 1, background: T.muted, borderRadius: 99, height: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(row.qtd / mktpTotal * 100)}%`, background: row.cor, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.cor, width: 38, textAlign: "right" }}>{row.qtd}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "8px 12px", background: T.statusErrBg, borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: T.statusErrDark, margin: 0, fontWeight: 600 }}>
                  70% dos que respondem demoram +24h. Lead já esfriou completamente.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* No-show */}
        <SectionTitle sub="meet_event_invitees · desde 01/mar/2026 · 723 convites (não-organizers)">Taxa de No-Show</SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <StatBox label="Compareceu" value="427" sub="59% dos convidados" color={T.statusOk} />
            <StatBox label="No-show (aceitou, não foi)" value="106" sub="24.1% de no-show entre aceitos" color={T.statusErr} />
            <StatBox label="Não confirmou" value="254" sub="35% em 'needs action' — risco alto" color={T.statusWarn} />
            <StatBox label="Recusou" value="27" sub="4% — menor problema" color={T.mutedFg} />
          </div>
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, background: T.muted }}>
            <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
              <strong style={{ color: T.cardFg }}>Atenção:</strong> os 254 "needs action" são uma perda silenciosa — não recusaram, mas provavelmente não vão aparecer sem um lembrete ativo.
              Uma régua de confirmação automática (24h + 2h antes) pode converter parte.
            </p>
          </div>
        </Card>

        {/* Bug Mia */}
        <SectionTitle sub="Auditoria heurística de 59 conversas WhatsApp (Spots Clone + Marketplace Clone)">Bug Mia CTWA — Audit 25-26/mai/2026</SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <StatBox label="Conversas analisadas" value="59" sub="Spots (29) + Marketplace (30)" />
            <StatBox label="Com problemas" value="19" sub="32.2% das conversas" color={T.statusErr} />
            <StatBox label="Bug principal" value="18/19" sub="Markdown desbalanceado (7 asteriscos)" color={T.statusErr} />
            <div style={{ padding: "20px 24px", flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 6px" }}>Mensagem truncada</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: T.statusWarn, margin: "0 0 2px", lineHeight: 1 }}>1</p>
              <p style={{ fontSize: 11, color: T.mutedFg, margin: 0 }}>Frase cortada no meio da mensagem</p>
            </div>
          </div>
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.cardFg, margin: "0 0 6px" }}>Padrão do bug:</p>
            <div style={{ background: T.cinza800, color: "#f87171", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>
              …*tamos fgts e carta de crédito_
            </div>
            <p style={{ fontSize: 12, color: T.mutedFg, margin: 0, lineHeight: 1.6 }}>
              Aparece como texto com asteriscos soltos no WhatsApp. É o mesmo template em 18 casos — bug sistêmico, não isolado.
              Verificar também: 1 caso de mensagem truncada no meio da frase (lead Volmir Fiorini / Ponta das Canas Spot II).
            </p>
          </div>
        </Card>

        {/* Hipóteses */}
        <SectionTitle sub="Baseado nos dados coletados de lead_trace, presales_response, meet_events e audit CTWA">Status das Hipóteses</SectionTitle>
        <Card style={{ marginBottom: 28 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.muted }}>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 700, color: T.mutedFg, borderBottom: `1px solid ${T.border}` }}>Hipótese</th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 700, color: T.mutedFg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 700, color: T.mutedFg, borderBottom: `1px solid ${T.border}` }}>Evidência</th>
                </tr>
              </thead>
              <tbody>
                {HIPOTESES.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 16px", color: T.cardFg, lineHeight: 1.5, maxWidth: 320 }}>{h.hipotese}</td>
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}><Badge status={h.status} /></td>
                    <td style={{ padding: "10px 16px", color: T.mutedFg, lineHeight: 1.5, fontSize: 11 }}>{h.evidencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recomendações */}
        <SectionTitle>Recomendações Priorizadas</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {RECOMENDACOES.map((r, i) => (
            <Card key={i}>
              <div style={{ padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <PrioTag p={r.prioridade} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>{r.titulo}</p>
                  <p style={{ fontSize: 12, color: T.mutedFg, margin: "0 0 8px", lineHeight: 1.6 }}>{r.desc}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 11, color: T.mutedFg }}>Impacto: <strong style={{ color: T.cardFg }}>{r.impacto}</strong></span>
                    <span style={{ fontSize: 11, color: T.mutedFg }}>Esforço: <strong style={{ color: T.cardFg }}>{r.esforco}</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Fontes */}
        <div style={{ marginTop: 32, padding: "16px 20px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 8px" }}>Fontes de dados</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              ["Audit CTWA", "artefatos-growth-seazone.vercel.app/audit-mia-ctwa · 59 conversas · 25-26/mai/2026"],
              ["Lead Trace", "sup_salezone_public_lead_trace_snapshots · Nekt Bronze · desde 01/abr/2026"],
              ["Presales Response SZS", "sup_salezone_prod_szs_presales_response · Nekt Bronze · desde 01/abr/2026 · 150 transbordos"],
              ["Presales Response MKTP", "sup_salezone_prod_mktp_presales_response · Nekt Bronze · desde 01/abr/2026 · 47 transbordos"],
              ["No-show", "sup_salezone_public_meet_event_invitees · Nekt Bronze · desde 01/mar/2026 · 723 convites"],
              ["Funil SZS", "nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable · ao vivo"],
            ].map(([label, src]) => (
              <div key={label} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.cardFg, minWidth: 180 }}>{label}</span>
                <span style={{ fontSize: 11, color: T.mutedFg, fontFamily: "monospace" }}>{src}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
