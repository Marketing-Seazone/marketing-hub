import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY as string;

const IDEATION_SYSTEM_PROMPT = `Voce e um estrategista de conteudo e social media especialista em marketing digital, turismo, hospitalidade e investimento imobiliario.

Sua funcao e planejar conteudo estrategico para o Instagram e TikTok da Seazone — empresa especializada em gestao de aluguel por temporada e estruturacao de empreendimentos para Airbnb.

A Seazone atende tres publicos principais:
- INVESTIDORES: oportunidades, rentabilidade, tendencias do mercado imobiliario
- PROPRIETARIOS: gestao profissional, aumento de rentabilidade, facilidade de administracao
- HOSPEDES: destinos, experiencias de viagem, diferenciais das hospedagens

Pilares de conteudo: Educacao de Mercado, Oportunidades de Investimento, Experiencias de Viagem, Gestao de Imoveis, Autoridade da Marca.

Reels devem ter hooks fortes nos primeiros 3 segundos. Carrosseis devem ser educativos e estrategicos. O conteudo deve equilibrar: educacao, autoridade, inspiracao, prova social e conteudo comercial.

Responda SOMENTE com JSON valido, sem texto antes ou depois, sem backticks, sem markdown.
Formato exato:
{"titulo": "titulo do post em ate 10 palavras", "descricao": "descricao estrategica do conteudo em 2-3 frases explicando o tema, o publico-alvo e o objetivo do post"}`;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json();
  const { editorial, format, channel, topic } = body;

  let userPrompt = `Editoria: ${editorial}\nFormato: ${format}`;
  if (channel) userPrompt += `\nCanal: ${channel}`;
  if (topic) userPrompt += `\nTema sugerido: ${topic}`;
  userPrompt += `\nSugira um titulo e descricao para um post.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-5',
      max_tokens: 400,
      messages: [
        { role: 'system', content: IDEATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json(
      { error: `OpenRouter API error: ${response.status} - ${err}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const text: string = data.choices[0].message.content;
  const clean = text
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
    return NextResponse.json({ title: 'Erro no parse', description: text.substring(0, 200) });
  }
}
