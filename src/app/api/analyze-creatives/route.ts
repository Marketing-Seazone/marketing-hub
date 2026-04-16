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
4. **Copy real dos criativos** (headline e body extraídos diretamente da API Meta) — USE ESSES DADOS como texto de copy; não tente ler ou inferir texto a partir das imagens
5. **Imagens dos criativos**: para estáticos, a imagem do anúncio; para vídeos, frames distribuídos ao longo do vídeo (Frame 1 = abertura, frames seguintes = progressão)

**IMPORTANTE sobre as imagens:** As imagens servem para análise VISUAL — composição, presença humana, cores, estilo, qualidade estética, gancho visual. Para o texto de copy, use apenas os dados da seção "COPY DOS CRIATIVOS". Nunca invente ou adivinhe copy que não esteja nos dados fornecidos.

Com esses dados, produza um diagnóstico estruturado em Markdown com EXATAMENTE estas seções:

## Visão Geral
Resumo executivo: total investido, CAC do período vs. benchmark histórico. Indique se está acima/abaixo do benchmark com contexto. Mencione CPL apenas como métrica de funil intermediário (qualidade do tráfego).

## Padrões de Copy e Formato
Use a copy real (headline/body da seção "COPY DOS CRIATIVOS") para identificar padrões. Busque correlações entre:
- Formato (vídeo, carrossel, estático, depoimento, UGC, apresentadora) — detectado pelo nome do criativo e pelo tipo visual
- Ângulo do hook na copy: renda/retorno financeiro, facilidade/gestão, prova social/depoimento, urgência/oportunidade, comparativo
- Público implícito (proprietário ativo, potencial, retargeting)
Mostre qual combinação de formato + ângulo de copy gera menor CAC. Se WON = 0 em todos, use taxa Lead→MQL como proxy.

## Análise Visual (Frames)
Para cada criativo com imagens disponíveis, descreva o que aparece:
- **Vídeos** (múltiplos frames): analise a progressão visual. Frame 1 = gancho de abertura. Identifique tipo de conteúdo (depoimento, lifestyle, animação de texto, apresentadora, produto). Avalie se o gancho visual do Frame 1 é forte ou fraco.
- **Imagens estáticas**: composição, presença humana, texto visível sobreposto (se legível na imagem), cor dominante, estilo (lifestyle, produto, texto, UGC).
Cruze o visual com a copy real para avaliar a proposta completa de cada criativo. Destaque o que os melhores criativos (menor CAC) têm em comum visualmente vs. os piores.
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
- **Duplicar e testar**: [nome] com variação de [elemento de copy ou visual]
- **Criar novo criativo**: baseado em [padrão de formato+ângulo de copy com melhor CAC] + [elemento visual dos melhores]
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

interface CreativeData {
  ad_id: string
  object_type?: string
  headline?: string
  body?: string
  thumbnail_url?: string
  image_url?: string
  video_frames?: string[]
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
    const { rows, groupBy, dataInicio, dataFim, creativeData } = await req.json() as {
      rows: AdRow[] | CampRow[]
      groupBy: "anuncio" | "campanha"
      dataInicio: string
      dataFim: string
      creativeData?: CreativeData[]
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
    const hasCreativeData = creativeData && creativeData.length > 0
    const creativeMap: Record<string, CreativeData> = {}
    if (hasCreativeData) {
      for (const c of creativeData!) creativeMap[c.ad_id] = c
    }

    const dataSection = groupBy === "anuncio"
      ? formatAdRows(adRows)
      : formatCampRows(rows as CampRow[])

    const trendSection = groupBy === "anuncio"
      ? formatTrends(trends as TrendRow[], adRows)
      : "(tendência por criativo disponível apenas no modo 'Por anúncio')"

    const benchmarkSection = benchmarks ? formatBenchmarks(benchmarks) : "(benchmark histórico não disponível)"

    /* Seção de copy real (headline + body da API Meta) */
    const copySection = hasCreativeData
      ? adRows
          .filter(r => creativeMap[r.ad_id]?.headline || creativeMap[r.ad_id]?.body)
          .map(r => {
            const c = creativeMap[r.ad_id]
            const lines = [`• "${r.ad_name}" [${r.ad_id}]`]
            if (c.headline) lines.push(`  Headline: "${c.headline}"`)
            if (c.body) lines.push(`  Body: "${c.body}"`)
            return lines.join("\n")
          })
          .join("\n") || "(nenhum criativo com copy disponível nesta seleção)"
      : "(copy não disponível — META_ACCESS_TOKEN não configurado)"

    const hasVideoFrames = creativeData?.some(c => (c.video_frames?.length ?? 0) > 0) ?? false
    const visualSummary = hasCreativeData
      ? `${creativeData!.length} criativo(s) com dados visuais${hasVideoFrames ? " — inclui frames de vídeo (frame a frame)" : ""} — imagens seguem abaixo`
      : "Nenhum visual disponível (META_ACCESS_TOKEN não configurado)"

    const userText = `Período analisado: ${dataInicio} a ${dataFim}
Agrupamento: ${groupBy === "anuncio" ? "por anúncio" : "por campanha"}
Total: ${rows.length} ${groupBy === "anuncio" ? "criativos" : "campanhas"}

**BENCHMARK HISTÓRICO SZS (180 dias):**
${benchmarkSection}

**DADOS DO PERÍODO:**
${dataSection}

**COPY DOS CRIATIVOS (dados diretos da API Meta — use estes como texto real, não OCR):**
${copySection}

**TENDÊNCIA SEMANAL (8 semanas):**
${trendSection}

**ANÁLISE VISUAL:**
${visualSummary}`

    /* ── baixa imagens como base64 (Anthropic não aceita URLs externas de CDN) ── */
    async function fetchBase64(url: string): Promise<string | null> {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0" },
        })
        if (!res.ok) return null
        const buf = await res.arrayBuffer()
        const b64 = Buffer.from(buf).toString("base64")
        const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg"
        return `data:${mime};base64,${b64}`
      } catch {
        return null
      }
    }

    /* Coleta URLs únicas de imagens que serão enviadas */
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "low" } }

    // Monta estrutura de ads com imagens a baixar
    interface AdVisual {
      ad: (typeof adRows)[0]
      isVideo: boolean
      urls: string[]
    }

    const adVisuals: AdVisual[] = []
    if (hasCreativeData) {
      let urlCount = 0
      for (const ad of adRows.slice(0, 10)) {
        if (urlCount >= 30) break
        const c = creativeMap[ad.ad_id]
        if (!c) continue
        const isVideo = (c.video_frames?.length ?? 0) > 0
        const imgUrls = isVideo
          ? c.video_frames!.slice(0, 4)   // max 4 frames por vídeo
          : [c.image_url || c.thumbnail_url].filter(Boolean) as string[]
        if (imgUrls.length === 0) continue
        adVisuals.push({ ad, isVideo, urls: imgUrls })
        urlCount += imgUrls.length
      }
    }

    // Baixa todas as imagens em paralelo
    const allUrls = adVisuals.flatMap(v => v.urls)
    const base64Map: Record<string, string> = {}
    if (allUrls.length > 0) {
      const results = await Promise.allSettled(
        allUrls.map(async url => ({ url, data: await fetchBase64(url) }))
      )
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.data) {
          base64Map[r.value.url] = r.value.data
        }
      }
    }

    /* ── monta content com imagens por criativo ── */
    const userContent: ContentBlock[] = [{ type: "text", text: userText }]

    for (const { ad, isVideo, urls } of adVisuals) {
      const b64Urls = urls.map(u => base64Map[u]).filter(Boolean)
      if (b64Urls.length === 0) continue

      const label = isVideo
        ? `\n▶ Vídeo: "${ad.ad_name}" (${b64Urls.length} frames):`
        : `\n🖼 Imagem: "${ad.ad_name}":`
      userContent.push({ type: "text", text: label })

      if (isVideo) {
        for (let fi = 0; fi < b64Urls.length; fi++) {
          userContent.push({ type: "text", text: `  Frame ${fi + 1}/${b64Urls.length}:` })
          userContent.push({ type: "image_url", image_url: { url: b64Urls[fi], detail: "low" } })
        }
      } else {
        userContent.push({ type: "image_url", image_url: { url: b64Urls[0], detail: "low" } })
      }
    }

    const hasVisualContent = userContent.length > 1

    /* ── chama OpenRouter — força Anthropic quando há imagens ── */
    const providerConfig = hasVisualContent
      ? { provider: { order: ["Anthropic"], allow_fallbacks: false } }
      : {}

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 2500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: hasVisualContent ? userContent : userText },
        ],
        ...providerConfig,
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
      {
        analysis,
        hadThumbnails: hasVisualContent,
        hadBenchmarks: !!benchmarks,
        hadTrends: trends.length > 0,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
