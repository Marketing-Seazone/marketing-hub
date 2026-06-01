import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CANAL_OFERTAS_SKILL } from '@/lib/skills'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

const SYSTEM_PROMPT = `${CANAL_OFERTAS_SKILL}

---

## Contexto desta rota

Você está sendo chamado pela rota /api/canal-ofertas/gerar-copy do Marketing Hub.

Retorne APENAS um JSON válido com um campo: "copy".
A copy deve seguir EXATAMENTE a estrutura definida acima, usando o cupom passado pelo usuário.
Não inclua markdown externo, blocos de código, nem qualquer texto fora do JSON.

REGRAS ABSOLUTAS:
- Apenas português brasileiro
- NUNCA use asteriscos (* ou **) no texto — nem para negrito, nem para qualquer outro fim
- Texto limpo, pronto para colar diretamente no canal`

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    nome, cidade, regiao, valor5diarias, maxHospedes,
    linkReservas, cupom, amenidades,
  } = body

  const userMessage = `Crie a copy do Canal de Ofertas para este imóvel:

Nome: ${nome}
Cidade: ${cidade}${regiao ? `\nRegião/Bairro: ${regiao}` : ''}
Valor para 5 diárias: R$ ${valor5diarias}
Capacidade: até ${maxHospedes} hóspedes
Link de reservas: ${linkReservas}
Cupom: ${cupom}${amenidades ? `\nAmenidades/diferenciais: ${amenidades}` : ''}

Siga EXATAMENTE a estrutura definida. Retorne apenas o JSON com o campo "copy".`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    const jsonStr = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    const copy = (parsed.copy as string).replace(/\*+/g, '')

    return NextResponse.json({ copy })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar copy'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
