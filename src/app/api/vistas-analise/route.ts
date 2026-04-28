import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

const SYSTEM_PROMPT = `Você é um estrategista de marketing especializado em turismo e hospitalidade.
Analisa os resultados das ações de marketing do projeto Vistas de Anitá — uma casa de temporada premium em Anitápolis, SC.
O objetivo principal é aumentar as reservas pagas de hóspedes.

As frentes de ação são: Mídia Paga (criativos no Meta Ads), Influenciadores e Social (posts orgânicos).

Com base nos dados fornecidos, identifique:
1. Quais temas/formatos tiveram melhor performance (mais cupons usados, mais engajamento, mais reservas correlacionadas)
2. Padrões gerais sobre o que está funcionando
3. Derivações e novos temas para explorar em cada frente
4. Recomendações específicas e acionáveis

Responda SOMENTE com JSON válido, sem texto antes ou depois, sem backticks, sem markdown.
Formato exato:
{
  "destaques": [
    {"area": "string (Mídia Paga|Influenciadores|Social)", "insight": "string (1 frase clara)"}
  ],
  "recomendacoes": {
    "midia_paga": [
      {"tema": "string", "justificativa": "string (1-2 frases)"}
    ],
    "influenciadores": [
      {"acao": "string", "justificativa": "string (1-2 frases)"}
    ],
    "social": [
      {"tema": "string", "formato": "string (Reel|Carrossel|Story|Feed)", "justificativa": "string (1-2 frases)"}
    ]
  },
  "padrao_geral": "string (2-3 frases sobre o padrão mais relevante observado)"
}`

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY não configurada no ambiente" },
      { status: 500 }
    )
  }

  const { resultados } = await req.json()

  if (!resultados || (Array.isArray(resultados) && resultados.length === 0)) {
    return NextResponse.json(
      { error: "Nenhum resultado registrado para analisar" },
      { status: 400 }
    )
  }

  const userPrompt = `Aqui estão os resultados registrados das ações de marketing do projeto Vistas de Anitá:

${JSON.stringify(resultados, null, 2)}

Analise estes dados e forneça insights e recomendações estratégicas.`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json(
      { error: `OpenRouter: ${response.status} — ${err}` },
      { status: response.status }
    )
  }

  const data = await response.json()
  const text: string = data.choices[0].message.content
  const clean = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  try {
    return NextResponse.json({ analise: JSON.parse(clean) })
  } catch {
    return NextResponse.json({ analise: null, raw: text })
  }
}
