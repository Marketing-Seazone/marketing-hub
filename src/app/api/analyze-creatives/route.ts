import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { queryNekt } from "@/lib/nekt"

export const maxDuration = 60

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY as string

/* ─────────────────────────────────────────────
   SYSTEM PROMPT
───────────────────────────────────────────── */
const SYSTEM_PROMPT = `Você é um especialista sênior em mídia paga e análise de criativos de marketing digital.
Seu foco é o time de Marketing da Seazone — empresa de gestão de aluguel por temporada que capta Proprietários via Meta Ads.

MÉTRICA PRINCIPAL: **CAC (Custo de Aquisição — investimento / WON)**. Esta é a métrica mais importante para avaliar eficiência de um criativo. CPL é secundário e só relevante quando WON = 0 (nenhuma venda atribuída). Nunca ranqueie criativos pelo CPL se houver dados de WON disponíveis.

META DE CAC DO TIME: **R$ 1.400**. Use este valor como referência absoluta em toda a análise:
- CAC ≤ R$ 1.400 → eficiente, candidato a escala
- CAC entre R$ 1.400 e R$ 2.100 (1,5x meta) → atenção, monitorar
- CAC > R$ 2.100 (1,5x meta) → ineficiente, considerar pausa
- 0 WON com investimento > R$ 500 → alerta crítico independente do CPL

Você receberá:
1. Performance dos criativos/campanhas no período selecionado
2. Benchmarks históricos do canal SZS (últimos 180 dias)
3. Tendência semanal dos principais criativos (se disponível)
4. Thumbnails visuais dos criativos (se disponível) — analise o que aparece: pessoas, texto na tela, estilo visual, paleta

Com esses dados, produza um diagnóstico estruturado em Markdown com EXATAMENTE estas seções:

## Visão Geral
Resumo executivo: total investido, CAC do período vs. benchmark histórico. Indique se está acima/abaixo do benchmark com contexto. Mencione CPL apenas como métrica de funil intermediário (qualidade do tráfego).

## Padrões de Copy e Formato
Analise os nomes dos criativos/campanhas para identificar padrões. Busque correlações entre:
- Formato (vídeo, carrossel, estático, depoimento, UGC, apresentadora)
- Tema/hook (renda, gestão, facilidade, destino, depoimento, comparativo)
- Público (proprietário ativo, proprietário potencial, retargeting)
Mostre qual combinação de formato+tema gera menor CAC. Se WON = 0 em todos, use taxa Lead→MQL como proxy.

## Análise Visual (Frames)
Se imagens foram fornecidas: identifique o que os thumbnails dos melhores criativos (menor CAC) têm em comum vs. os piores.
Elementos para avaliar: presença humana, texto na tela, cor dominante, estilo (lifestyle vs. produto vs. texto).
Se não há imagens: indique que a análise visual requer META_ACCESS_TOKEN configurado.

## Tendência (Últimas Semanas)
Para cada criativo com dados de tendência, avalie a direção do CAC (ou leads/WON quando CAC não calculável):
- ↑ CAC crescendo (piorando) / → estável / ↓ CAC caindo (melhorando) / ↕ instável
- Destaque qual está em aceleração positiva e qual está esgotando

## Benchmarks: Período vs. Histórico
Tabela comparativa: CAC do período atual vs. média histórica SZS. Mencione CPL como informação complementar.
Indique quais criativos estão acima/abaixo do benchmark de CAC.

## Alertas
Liste separando por gravidade:
- 🔴 **Crítico**: 0 WON com investimento > R$ 500, ou CAC > R$ 2.100 (1,5x meta)
- 🟡 **Atenção**: CAC entre R$ 1.400 e R$ 2.100, ou muitos leads com 0 WON (problema de qualidade)
- ✓ **No alvo**: criativos com CAC ≤ R$ 1.400

## Recomendações e Ações no Meta Ads
Mínimo 5 ações concretas baseadas em CAC vs. meta R$ 1.400, com verbo de ação explícito:
- **Pausar**: [nome do criativo] — motivo (CAC > R$ 2.100 ou 0 WON com alto gasto)
- **Escalar**: [nome] — aumentar budget em X% — motivo (CAC ≤ R$ 1.400, abaixo da meta)
- **Duplicar e testar**: [nome] com variação de [elemento]
- **Criar novo criativo**: baseado em [padrão de formato+tema com melhor CAC]
- **Revisar segmentação**: [adset] — motivo

Seja direto, use dados numéricos, evite generalidades. Se WON = 0 em um criativo, trate como dado crítico — não ignore.`

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface AdRow {
  ad_name: string
  ad_id: string
  campaign_name: string
  adset_name: string
  investimento: number
  impressoes: number
  leads: number
  mql: number
  won: number
}

interface CampRow {
  campaign_name: string
  investimento: number
  impressoes: number
  leads: number
  mql: number
  won: number
}

interface ThumbnailData {
  ad_id: string
  thumbnail_url: string
}

/* ─────────────────────────────────────────────
   MOCKS (dev sem NEKT_API_KEY)
───────────────────────────────────────────── */
function mockBenchmarks() {
  return { cpl_medio: 82.40, cac_medio: 1980.00, tx_mql: 27.3, total_criativos: 52 }
}

function mockTrends(): TrendRow[] {
  const weeks = ["2026-02-16","2026-02-23","2026-03-02","2026-03-09","2026-03-16","2026-03-23","2026-03-30","2026-04-06"]
  const patterns: Record<string, number[]> = {
    mock001: [420,580,720,850,920,980,1040,1100], // crescendo
    mock002: [510,490,520,500,480,510,495,505],   // estável
    mock003: [600,540,480,420,360,280,210,150],   // declinando
    mock004: [200,450,180,520,150,480,210,390],   // instável
  }
  const leads: Record<string, number[]> = {
    mock001: [7,10,13,15,17,18,20,22],
    mock002: [9,8,10,9,8,9,8,9],
    mock003: [11,9,8,7,6,5,3,2],
    mock004: [4,9,3,10,3,9,4,8],
  }
  const result: TrendRow[] = []
  for (const [ad_id, spends] of Object.entries(patterns)) {
    for (let i = 0; i < weeks.length; i++) {
      result.push({ ad_id, semana: weeks[i], spend: spends[i], leads: leads[ad_id][i] })
    }
  }
  return result
}

interface TrendRow {
  ad_id: string
  semana: string
  spend: number
  leads: number
}

interface Benchmarks {
  cpl_medio: number
  cac_medio: number
  tx_mql: number
  total_criativos: number
}

/* ─────────────────────────────────────────────
   FETCH BENCHMARKS
───────────────────────────────────────────── */
async function fetchBenchmarks(): Promise<Benchmarks> {
  const result = await queryNekt(`
    SELECT
      ROUND(SUM(spend) / NULLIF(SUM(lead), 0), 2) AS cpl_medio,
      ROUND(SUM(spend) / NULLIF(SUM(won), 0), 2) AS cac_medio,
      ROUND(CAST(SUM(mql) AS DOUBLE) / NULLIF(SUM(lead), 0) * 100, 1) AS tx_mql,
      COUNT(DISTINCT ad_id) AS total_criativos
    FROM nekt_silver.ads_unificado_historico
    WHERE vertical = 'SZS'
      AND date >= CURRENT_DATE - INTERVAL '180' DAY
  `)
  const row = result.rows[0] || {}
  return {
    cpl_medio: Number(row.cpl_medio) || 0,
    cac_medio: Number(row.cac_medio) || 0,
    tx_mql: Number(row.tx_mql) || 0,
    total_criativos: Number(row.total_criativos) || 0,
  }
}

/* ─────────────────────────────────────────────
   FETCH TRENDS (top 15 criativos por investimento)
───────────────────────────────────────────── */
async function fetchTrends(topAdIds: string[]): Promise<TrendRow[]> {
  if (topAdIds.length === 0) return []
  const idsStr = topAdIds.map(id => `'${id.replace(/'/g, "''")}'`).join(",")
  const result = await queryNekt(`
    SELECT
      ad_id,
      DATE_TRUNC('week', date) AS semana,
      SUM(spend) AS spend,
      SUM(lead) AS leads
    FROM nekt_silver.ads_unificado_historico
    WHERE vertical = 'SZS'
      AND ad_id IN (${idsStr})
      AND date >= CURRENT_DATE - INTERVAL '56' DAY
    GROUP BY ad_id, semana
    ORDER BY ad_id, semana
  `)
  return result.rows.map(r => ({
    ad_id: String(r.ad_id || ""),
    semana: String(r.semana || "").slice(0, 10),
    spend: Number(r.spend) || 0,
    leads: Number(r.leads) || 0,
  }))
}

/* ─────────────────────────────────────────────
   FORMAT HELPERS
───────────────────────────────────────────── */
function formatAdRows(rows: AdRow[]): string {
  // ordena por CAC asc (criativos com WON primeiro), depois por WON desc entre sem WON
  const sorted = [...rows].sort((a, b) => {
    const cacA = a.won > 0 ? a.investimento / a.won : Infinity
    const cacB = b.won > 0 ? b.investimento / b.won : Infinity
    if (cacA !== cacB) return cacA - cacB
    return b.leads - a.leads
  })
  return sorted.map(r => {
    const cac = r.won > 0 ? `R$${(r.investimento / r.won).toFixed(0)}` : "SEM WON"
    const txMql = r.leads > 0 ? `${((r.mql / r.leads) * 100).toFixed(0)}%` : "—"
    const cpl = r.leads > 0 ? `R$${(r.investimento / r.leads).toFixed(0)}` : "—"
    return `• ${r.ad_name} [${r.ad_id}] | Camp: ${r.campaign_name} | Conj: ${r.adset_name} | Invest: R$${r.investimento.toFixed(0)} | ${r.leads} leads | ${r.mql} MQL | ${r.won} WON | CAC: ${cac} | Lead→MQL: ${txMql} | CPL(ref): ${cpl}`
  }).join("\n")
}

function formatCampRows(rows: CampRow[]): string {
  const sorted = [...rows].sort((a, b) => {
    const cacA = a.won > 0 ? a.investimento / a.won : Infinity
    const cacB = b.won > 0 ? b.investimento / b.won : Infinity
    if (cacA !== cacB) return cacA - cacB
    return b.leads - a.leads
  })
  return sorted.map(r => {
    const cac = r.won > 0 ? `R$${(r.investimento / r.won).toFixed(0)}` : "SEM WON"
    const cpl = r.leads > 0 ? `R$${(r.investimento / r.leads).toFixed(0)}` : "—"
    return `• ${r.campaign_name} | Invest: R$${r.investimento.toFixed(0)} | ${r.leads} leads | ${r.mql} MQL | ${r.won} WON | CAC: ${cac} | CPL(ref): ${cpl}`
  }).join("\n")
}

function formatTrends(trends: TrendRow[], adRows: AdRow[]): string {
  if (trends.length === 0) return "(dados de tendência não disponíveis)"
  const byAd: Record<string, TrendRow[]> = {}
  for (const t of trends) {
    if (!byAd[t.ad_id]) byAd[t.ad_id] = []
    byAd[t.ad_id].push(t)
  }
  const adNameMap: Record<string, string> = {}
  for (const r of adRows) adNameMap[r.ad_id] = r.ad_name

  return Object.entries(byAd).map(([adId, weeks]) => {
    const name = adNameMap[adId] || adId
    const pts = weeks.map(w => `${w.semana}: R$${w.spend.toFixed(0)} / ${w.leads} leads`).join(" → ")
    return `${name}: ${pts}`
  }).join("\n")
}

function formatBenchmarks(b: Benchmarks): string {
  return `CAC médio histórico: R$${b.cac_medio.toFixed(0)} | Taxa Lead→MQL histórica: ${b.tx_mql.toFixed(1)}% | CPL médio histórico (referência): R$${b.cpl_medio.toFixed(0)} | Total de criativos ativos nos últimos 180 dias: ${b.total_criativos}`
}

/* ─────────────────────────────────────────────
   MOCK FULL ANALYSIS (dev sem OPENROUTER)
───────────────────────────────────────────── */
function mockAnalysis(groupBy: string, rowCount: number): string {
  return `## Visão Geral

Análise simulada para **${rowCount} ${groupBy === "anuncio" ? "criativos" : "campanhas"}** — período selecionado.

> ⚠️ Modo dev: sem \`OPENROUTER_API_KEY\`. Este resultado é exemplo.

CAC do período: **R$ 2.160** — **acima da meta de R$ 1.400** (+54%). Total investido: R$ 8.340 | 7 WON atribuídos. Para atingir a meta, o canal precisaria de ~6 WON adicionais com o mesmo investimento.

---

## Padrões de Copy e Formato

- **Vídeo + tema "gestão"** → melhor CAC da seleção: R$ 1.140 (3 WON em R$ 3.420)
- **Carrossel + tema "renda"** → CAC R$ 1.090 (2 WON em R$ 2.180) — melhor custo de aquisição
- **Estático + tema "facilidade"** → CAC R$ 980 mas apenas 1 WON — amostra pequena, não conclusivo
- Vídeos de depoimento têm menor CAC que institucionais quando há WON atribuído

## Análise Visual (Frames)

Configure \`META_ACCESS_TOKEN\` no .env.local para habilitar análise de thumbnails via Meta Graph API.

## Tendência (Últimas Semanas)

- **[MOCK] Criativo_Video_Gestão_A** ↓ CAC caindo (melhorando) — WON crescendo nas últimas 3 semanas
- **[MOCK] Criativo_Carrossel_Renda_B** → estável — CAC consistente semana a semana
- **[MOCK] Criativo_Estatico_Facilidade_C** ↑ CAC crescendo (piorando) — spend mantido, WON caindo
- **[MOCK] Criativo_Video_Depoimento_D** ↕ instável — WON oscilatório, possível sazonalidade no adset

## Benchmarks: Período vs. Histórico

| Métrica | Período | Meta | Histórico 180d | Status |
|---------|---------|------|----------------|--------|
| **CAC** | **R$ 2.160** | **R$ 1.400** | R$ 1.980 | 🔴 +54% acima da meta |
| Lead→MQL | 26% | — | 27% | ✓ dentro |
| CPL (ref) | R$ 88 | — | R$ 82 | — referência |

## Alertas

🔴 **Crítico**
- **Criativo_Video_Gestão_A**: CAC R$ 1.140 — único abaixo da meta, mas com apenas 3 WON
- **Criativo_Carrossel_Renda_B**: CAC R$ 1.090 — abaixo da meta ✓

🟡 **Atenção**
- **Criativo_Estatico_Facilidade_C**: CAC R$ 980 porém tendência de queda; 1 WON — amostra pequena
- **Criativo_Video_Depoimento_D**: CAC R$ 760 mas apenas 1 WON — não conclusivo; 19 leads sem conversão suficiente

✓ **No alvo**
- _Criativo_Carrossel_Renda_B_ e _Criativo_Video_Gestão_A_ estão abaixo de R$ 1.400

## Recomendações e Ações no Meta Ads

1. **Escalar**: _Criativo_Carrossel_Renda_B_ — melhor CAC absoluto (R$ 1.090), aumentar budget em 30%
2. **Escalar**: _Criativo_Video_Gestão_A_ — CAC em queda nas últimas semanas, momento de escalar
3. **Pausar**: _Criativo_Estatico_Facilidade_C_ — CAC deteriorando, 8 semanas de declínio consecutivo
4. **Duplicar e testar**: _Criativo_Carrossel_Renda_B_ com headline de prova social (número de proprietários ativos)
5. **Criar novo criativo**: vídeo UGC com depoimento de proprietário + dado de rentabilidade no hook dos primeiros 3s
6. **Revisar segmentação**: _Engajamento Instagram 60d_ — ampliar janela para 90d ou testar LAL 2% com base de WON`
}

/* ─────────────────────────────────────────────
   MAIN HANDLER
───────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const { rows, groupBy, dataInicio, dataFim, thumbnailData } = await req.json() as {
      rows: AdRow[] | CampRow[]
      groupBy: "anuncio" | "campanha"
      dataInicio: string
      dataFim: string
      thumbnailData?: ThumbnailData[]
    }

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Campo 'rows' obrigatório." }, { status: 400 })
    }

    /* mock total em dev sem chave Nekt ou OpenRouter */
    if (process.env.NODE_ENV === "development" && !OPENROUTER_API_KEY) {
      await new Promise(r => setTimeout(r, 1200))
      return NextResponse.json({ analysis: mockAnalysis(groupBy, rows.length) })
    }

    const isDev = process.env.NODE_ENV === "development"
    const hasNekt = !!process.env.NEKT_API_KEY

    /* ── busca benchmarks + tendências em paralelo ── */
    const adRows = groupBy === "anuncio" ? (rows as AdRow[]) : []
    const topAdIds = adRows.slice(0, 15).map(r => r.ad_id).filter(Boolean)

    const [benchmarkRes, trendRes] = await Promise.allSettled([
      hasNekt ? fetchBenchmarks() : Promise.resolve(isDev ? mockBenchmarks() : null),
      hasNekt && topAdIds.length > 0 ? fetchTrends(topAdIds) : Promise.resolve(isDev ? mockTrends() : []),
    ])

    const benchmarks = benchmarkRes.status === "fulfilled" ? benchmarkRes.value : null
    const trends = trendRes.status === "fulfilled" ? (trendRes.value ?? []) : []

    /* ── monta prompt ── */
    const hasThumbnails = thumbnailData && thumbnailData.length > 0
    const thumbMap: Record<string, string> = {}
    if (hasThumbnails) {
      for (const t of thumbnailData!) thumbMap[t.ad_id] = t.thumbnail_url
    }

    const dataSection = groupBy === "anuncio"
      ? formatAdRows(adRows)
      : formatCampRows(rows as CampRow[])

    const trendSection = groupBy === "anuncio"
      ? formatTrends(trends as TrendRow[], adRows)
      : "(tendência por criativo disponível apenas no modo 'Por anúncio')"

    const benchmarkSection = benchmarks ? formatBenchmarks(benchmarks) : "(benchmark histórico não disponível)"

    const thumbsAvailable = hasThumbnails
      ? `${thumbnailData!.length} thumbnail(s) incluídos para análise visual (ad_ids: ${thumbnailData!.map(t => t.ad_id).join(", ")})`
      : "Nenhum thumbnail disponível (META_ACCESS_TOKEN não configurado)"

    const userText = `Período analisado: ${dataInicio} a ${dataFim}
Agrupamento: ${groupBy === "anuncio" ? "por anúncio" : "por campanha"}
Total: ${rows.length} ${groupBy === "anuncio" ? "criativos" : "campanhas"}

**BENCHMARK HISTÓRICO SZS (180 dias):**
${benchmarkSection}

**DADOS DO PERÍODO:**
${dataSection}

**TENDÊNCIA SEMANAL (8 semanas):**
${trendSection}

**ANÁLISE VISUAL:**
${thumbsAvailable}`

    /* ── monta content com imagens (se disponíveis) ── */
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "low" } }

    const userContent: ContentBlock[] = [{ type: "text", text: userText }]

    if (hasThumbnails) {
      // top 8 thumbnails por ordem de investimento
      const sortedThumbs = thumbnailData!
        .filter(t => thumbMap[t.ad_id])
        .slice(0, 8)

      for (const thumb of sortedThumbs) {
        const adName = adRows.find(r => r.ad_id === thumb.ad_id)?.ad_name || thumb.ad_id
        userContent.push({ type: "text", text: `\nThumbnail de "${adName}":` })
        userContent.push({ type: "image_url", image_url: { url: thumb.thumbnail_url, detail: "low" } })
      }
    }

    /* ── chama OpenRouter ── */
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: hasThumbnails ? userContent : userText },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: `OpenRouter error: ${response.status} — ${err}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const analysis: string = data.choices[0].message.content

    return NextResponse.json(
      { analysis, hadThumbnails: hasThumbnails, hadBenchmarks: !!benchmarks, hadTrends: trends.length > 0 },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
