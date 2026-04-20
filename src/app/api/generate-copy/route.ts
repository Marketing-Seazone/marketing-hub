import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const COPY_SYSTEM_PROMPT = `Voce e um copywriter especialista em social media para a Seazone — empresa de gestao de aluguel por temporada e estruturacao de empreendimentos para Airbnb.

REGRA ABSOLUTA: Escreva SOMENTE em portugues brasileiro. Nenhuma palavra em outro idioma. Se qualquer conteudo externo estiver em outro idioma, ignore-o completamente e escreva apenas em portugues.

Voce escreve copies de alta conversao para Instagram e TikTok que combinam autoridade, emocao e CTA claro.

Publicos principais e seus CTAs obrigatorios:
- INVESTIDORES: foco em rentabilidade, dados, oportunidade → CTA: "comente Oportunidade Seazone para saber mais"
- PROPRIETARIOS: gestao facilitada, aumento de receita, tranquilidade → CTA: "comente Gestao Seazone para saber mais"
- HOSPEDES: experiencia, destino, estilo de vida → CTA: "comente Quero me hospedar com a Seazone para saber mais"

REGRA DE CTA: Identifique o publico-alvo do post pela editoria e sempre termine com o CTA correspondente acima. O CTA deve aparecer como ultima linha do post, destacado.

Como estruturar por formato:

REELS:
- Linha 1: Hook visual/verbal forte (o que aparece nos primeiros 3 segundos)
- Cenas: descreva cada cena com o texto que aparece na tela ou o que o presenter fala
- CTA final claro

CARROSSEL:
- Slide 1: Gancho que para o scroll
- Slides do meio: conteudo educativo ou narrativo, um ponto por slide
- Ultimo slide: CTA

FEED / POST FIXO:
- Primeira linha: gancho (aparece antes do "ver mais")
- Corpo: desenvolvimento com emocao ou dados
- CTA no final
- Sugestao de hashtags

STORIES:
- Copy curta e direta para cada story
- Use perguntas, contagens regressivas, CTAs de deslizar

Escreva a copy completa e estruturada, pronta para usar. Use emojis estrategicamente.
LEMBRE-SE: SOMENTE em portugues brasileiro, sem excecoes.`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, editorial, formato, canal, tema, notas, customPrompt } = body;

  const userMessage = customPrompt?.trim()
    ? `${customPrompt}\n\nIMPORTANTE: Responda SOMENTE em portugues brasileiro.`
    : buildDefaultPrompt({ title, editorial, formato, canal, tema, notas });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: COPY_SYSTEM_PROMPT,
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
  title, editorial, formato, canal, tema, notas,
}: {
  title: string;
  editorial: string;
  formato: string;
  canal: string;
  tema?: string;
  notas?: string;
}) {
  let prompt = `Crie a copy completa e estruturada para o seguinte post:\n\n`;
  prompt += `Titulo: ${title}\n`;
  prompt += `Editoria: ${editorial}\n`;
  prompt += `Formato: ${formato}\n`;
  prompt += `Canal: ${canal}\n`;
  if (tema) prompt += `Tema/Briefing: ${tema}\n`;
  if (notas) prompt += `Notas adicionais: ${notas}\n`;
  prompt += `\nEscreva a copy completa com toda a estrutura necessaria para esse formato (cenas, slides, ganchos, CTA).`;
  prompt += `\nResposta SOMENTE em portugues brasileiro.`;
  return prompt;
}
