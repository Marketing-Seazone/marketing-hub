import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const IDEATION_SYSTEM_PROMPT = `Voce e um estrategista de conteudo e social media especialista em marketing digital, turismo, hospitalidade e investimento imobiliario.

Sua funcao e planejar conteudo estrategico para o Instagram e TikTok da Seazone — empresa especializada em gestao de aluguel por temporada e estruturacao de empreendimentos para Airbnb.

A Seazone atende tres publicos principais:
- INVESTIDORES: oportunidades, rentabilidade, tendencias do mercado imobiliario
- PROPRIETARIOS: gestao profissional, aumento de rentabilidade, facilidade de administracao
- HOSPEDES: destinos, experiencias de viagem, diferenciais das hospedagens

Pilares de conteudo: Educacao de Mercado, Oportunidades de Investimento, Experiencias de Viagem, Gestao de Imoveis, Autoridade da Marca.

SEMPRE use a ferramenta de busca antes de criar o conteudo. Pesquise tendencias atuais, dados recentes e noticias relevantes relacionados a editoria e ao tema (se fornecido). Use essas informacoes para tornar o post mais relevante, atual e embasado.

Reels devem ter hooks fortes nos primeiros 3 segundos. Carrosseis devem ser educativos e estrategicos. O conteudo deve equilibrar: educacao, autoridade, inspiracao, prova social e conteudo comercial.

Responda SOMENTE com JSON valido, sem texto antes ou depois, sem backticks, sem markdown.
Formato exato:
{"titulo": "titulo do post em ate 10 palavras", "descricao": "descricao estrategica do conteudo em 2-3 frases explicando o tema, o publico-alvo e o objetivo do post"}`;

function buildSearchQuery(editorial: string, topic?: string): string {
  if (topic) {
    return `${topic} mercado imobiliario aluguel temporada Brasil 2025 2026`;
  }
  const editorialMap: Record<string, string> = {
    'Autoridade Seazone': 'gestao profissional aluguel por temporada tendencias 2026',
    'Dono no Controle': 'proprietario imovel airbnb rentabilidade dicas 2026',
    'Por dentro do Airbnb': 'algoritmo airbnb dicas anfitrioes 2026',
    'Destinos Seazone': 'destinos viagem turismo Brasil temporada 2026',
    'Inteligencia de Mercado': 'mercado imobiliario short stay investimento tendencias 2026',
  };
  return editorialMap[editorial] ?? `${editorial} aluguel temporada Brasil 2026`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { editorial, format, channel, topic } = body;

  const searchQuery = buildSearchQuery(editorial, topic);

  let userPrompt = `Editoria: ${editorial}\nFormato: ${format}`;
  if (channel) userPrompt += `\nCanal: ${channel}`;
  if (topic) {
    userPrompt += `\nTema sugerido: ${topic}`;
  } else {
    userPrompt += `\nSem tema definido — escolha um assunto relevante e atual para esta editoria.`;
  }
  userPrompt += `\n\nAntes de criar o conteudo, pesquise tendencias atuais usando a query: "${searchQuery}". Use o que encontrar para embasar o post.\n\nSugira um titulo e descricao para o post.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: IDEATION_SYSTEM_PROMPT,
      betas: [{ type: 'web_search_20250305', name: 'web_search' }],
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
    console.error('Anthropic error:', err);
    return NextResponse.json(
      { error: `Anthropic API error: ${err.message}` },
      { status: 500 }
    );
  }
}
