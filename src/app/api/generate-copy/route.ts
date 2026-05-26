import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SEAZONE_REDACAO_SKILL, SEAZONE_TIKTOK_SKILL, isTikTok } from '@/lib/skills';

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const INSTAGRAM_SYSTEM_PROMPT = `${SEAZONE_REDACAO_SKILL}

---

## Contexto desta rota

Você está sendo chamado pela rota /api/generate-copy do Marketing Hub para gerar **legendas de social media** (Instagram) a partir de um post do calendário editorial. Aplique a seção "5. Legendas para Redes Sociais" da skill, com as estruturas e regras abaixo.

REGRA ABSOLUTA: Escreva SOMENTE em português brasileiro. Nenhuma palavra em outro idioma.

### CTAs obrigatórios por público
Identifique o público-alvo pela editoria e termine sempre com o CTA correspondente em destaque, na última linha:
- **INVESTIDORES** (rentabilidade, dados, oportunidade) → "comente Oportunidade Seazone para saber mais"
- **PROPRIETÁRIOS** (gestão facilitada, renda passiva, tranquilidade) → "comente Gestão Seazone para saber mais"
- **HÓSPEDES** (experiência, destino, estilo de vida) → "comente Quero me hospedar com a Seazone para saber mais"

### Estrutura por formato

**REELS:**
- Linha 1: hook visual/verbal forte (primeiros 3 segundos)
- Cenas: descreva cada cena com o texto na tela ou o que o presenter fala
- CTA final claro

**CARROSSEL:**
- Slide 1: gancho que para o scroll
- Slides do meio: conteúdo educativo ou narrativo, um ponto por slide
- Último slide: CTA

**FEED / POST FIXO:**
- Primeira linha: gancho (aparece antes do "ver mais")
- Corpo: desenvolvimento com emoção ou dados
- CTA no final
- Sugestão de hashtags

**STORIES:**
- Copy curta e direta para cada story
- Use perguntas, contagens regressivas, CTAs de deslizar

Use os dados reais da Seazone (números, diferenciais) quando reforçarem credibilidade. Entregue a copy completa e estruturada, pronta para usar.`;

const TIKTOK_SYSTEM_PROMPT = `${SEAZONE_TIKTOK_SKILL}

---

## Contexto desta rota

Você está sendo chamado pela rota /api/generate-copy do Marketing Hub para gerar conteúdo de TikTok a partir de um post do calendário editorial. Siga o fluxo de trabalho da skill.

REGRA ABSOLUTA: Escreva SOMENTE em português brasileiro. Nenhuma palavra em outro idioma.

### Formato de entrega
A resposta DEVE conter, nesta ordem, com cabeçalhos em negrito:
1. **Hook (3 variações)** — três opções de gancho para o usuário escolher, numeradas
2. **Texto on-video** — exatamente o que aparece na tela do TikTok, organizado pelas linhas/cenas
3. **Roteiro / narração** — o que o creator fala ou as cenas, com tempos quando fizer sentido (0–3s, 4–15s...)
4. **Legenda** — texto que vai no caption do TikTok, com CTA suave (pergunta ou convite a salvar)
5. **Hashtags** — 4 a 7, misturando macro e micro

Se faltarem informações essenciais (destino, valor, número de dias), preencha com colchetes \`[exemplo]\` para o usuário ajustar — não recuse a tarefa.`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, editorial, formato, canal, tema, notas, customPrompt } = body;

  const isTk = isTikTok({ canal, formato });
  const systemPrompt = isTk ? TIKTOK_SYSTEM_PROMPT : INSTAGRAM_SYSTEM_PROMPT;

  const userMessage = customPrompt?.trim()
    ? `${customPrompt}\n\nIMPORTANTE: Responda SOMENTE em português brasileiro.`
    : buildDefaultPrompt({ title, editorial, formato, canal, tema, notas, isTikTok: isTk });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const copy = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim();

    return NextResponse.json({ copy });
  } catch (err: any) {
    console.error('Erro generate-copy:', err);
    return NextResponse.json({ error: err.message ?? 'Erro ao gerar copy' }, { status: 500 });
  }
}

function buildDefaultPrompt({
  title, editorial, formato, canal, tema, notas, isTikTok,
}: {
  title: string;
  editorial: string;
  formato: string;
  canal: string;
  tema?: string;
  notas?: string;
  isTikTok: boolean;
}) {
  let prompt = isTikTok
    ? `Crie o conteúdo completo de TikTok para o seguinte post da Seazone:\n\n`
    : `Crie a copy completa e estruturada para o seguinte post da Seazone:\n\n`;
  prompt += `Título: ${title}\n`;
  prompt += `Editoria: ${editorial}\n`;
  prompt += `Formato: ${formato}\n`;
  prompt += `Canal: ${canal}\n`;
  if (tema) prompt += `Tema/Briefing: ${tema}\n`;
  if (notas) prompt += `Notas adicionais: ${notas}\n`;
  if (isTikTok) {
    prompt += `\nSiga o formato de entrega exigido na sua skill (Hook x3, Texto on-video, Roteiro, Legenda, Hashtags).`;
  } else {
    prompt += `\nUse dados reais da base de conhecimento da Seazone quando relevante.`;
    prompt += `\nEscreva a copy completa com toda a estrutura necessária para esse formato (cenas, slides, ganchos, CTA).`;
  }
  prompt += `\nResposta SOMENTE em português brasileiro.`;
  return prompt;
}
