import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SEAZONE_REDACAO_SKILL, SEAZONE_TIKTOK_SKILL, isTikTok } from '@/lib/skills';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const INSTAGRAM_IDEATION_PROMPT = `${SEAZONE_REDACAO_SKILL}

---

## Contexto desta rota

Você é um estrategista de conteúdo planejando posts de Instagram da Seazone. Atende três públicos: investidores, proprietários e hóspedes.

Pilares de conteúdo: Educação de Mercado, Oportunidades de Investimento, Experiências de Viagem, Gestão de Imóveis, Autoridade da Marca.

Reels: hooks fortes nos primeiros 3 segundos. Carrosséis: educativos e estratégicos. Equilibre educação, autoridade, inspiração, prova social e conteúdo comercial.

REGRA ABSOLUTA: Responda SOMENTE com JSON válido, sem texto antes ou depois, sem backticks, sem markdown.

Formato exato:
{"titulo": "título do post em até 10 palavras", "descricao": "descrição estratégica do conteúdo em 2–3 frases explicando o tema, o público-alvo e o objetivo do post"}`;

const TIKTOK_IDEATION_PROMPT = `${SEAZONE_TIKTOK_SKILL}

---

## Contexto desta rota

Você é um estrategista de conteúdo planejando posts de TikTok da Seazone para o público de hóspedes/viajantes. Use o conhecimento da skill (formatos, hooks, tom) para sugerir temas que tenham potencial real de retenção e compartilhamento na plataforma.

Pense em: ângulos virais ("quanto custa", "vale a pena", série de roteiro, B-roll inspiracional), destinos onde a Seazone atua, ganchos que pessoas querem mandar pra amigos.

REGRA ABSOLUTA: Responda SOMENTE com JSON válido, sem texto antes ou depois, sem backticks, sem markdown.

Formato exato:
{"titulo": "título curto e direto do tema do TikTok (até 10 palavras)", "descricao": "descrição em 2–3 frases incluindo: formato do TikTok sugerido (B-roll, quanto custa, série), 1 sugestão de hook e a promessa principal do vídeo"}`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { editorial, format, channel, topic, researchContext } = body;

  const isTk = isTikTok({ channel, format });
  const systemPrompt = isTk ? TIKTOK_IDEATION_PROMPT : INSTAGRAM_IDEATION_PROMPT;

  let userPrompt = `Editoria: ${editorial}\nFormato: ${format}`;
  if (channel) userPrompt += `\nCanal: ${channel}`;
  if (topic) {
    userPrompt += `\nTema sugerido: ${topic}`;
  } else {
    userPrompt += `\nSem tema definido — escolha um assunto relevante e atual para esta editoria.`;
  }

  if (researchContext) {
    userPrompt += `\n\nCONTEXTO DE PESQUISA (use para embasar o post):\n${researchContext}`;
  }

  userPrompt += `\n\nSugira um título e descrição para o post.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const clean = textBlock
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(clean);
      const title = parsed.titulo ?? parsed.title ?? 'Sem titulo';
      const description = parsed.descricao ?? parsed.description ?? '';
      return NextResponse.json({ title, description });
    } catch {
      return NextResponse.json({ title: 'Erro no parse', description: clean.substring(0, 200) });
    }
  } catch (err: any) {
    console.error('Erro:', err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
