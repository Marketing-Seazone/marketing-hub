import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query } = body;

  if (!query) {
    return NextResponse.json({ error: 'Query obrigatoria' }, { status: 400 });
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return NextResponse.json({ error: 'TAVILY_API_KEY nao configurada' }, { status: 500 });
  }

  // 1. Busca no Tavily
  let searchResults: string[] = [];
  try {
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${query} mercado imobiliario aluguel temporada Brasil`,
        search_depth: 'basic',
        max_results: 6,
        include_answer: true,
      }),
    });

    const tavilyData = await tavilyRes.json();

    if (tavilyData.answer) {
      searchResults.push(`Resumo: ${tavilyData.answer}`);
    }

    if (tavilyData.results) {
      for (const r of tavilyData.results.slice(0, 5)) {
        searchResults.push(`[${r.title}] ${r.content?.slice(0, 300) ?? ''}`);
      }
    }
  } catch (err) {
    console.error('Erro Tavily:', err);
    return NextResponse.json({ error: 'Falha na busca' }, { status: 500 });
  }

  const searchContext = searchResults.join('\n\n');

  // 2. Claude sintetiza os resultados
  const systemPrompt = `Voce e um analista de marketing digital especialista em mercado imobiliario de short stay, Airbnb e aluguel por temporada no Brasil.

Sua funcao e analisar noticias e tendencias e extrair insights uteis para criacao de conteudo para redes sociais da Seazone.

As editorias da Seazone sao:
- Inteligencia de Mercado: dados, tendencias, analises do setor
- Dono no Controle: dicas para proprietarios, rentabilidade, gestao
- Por dentro do Airbnb: como funciona a plataforma, algoritmo, dicas
- Destinos Seazone: viagens, turismo, experiencias
- Autoridade Seazone: cases, resultados, diferenciais da empresa
- Onde Investir: oportunidades, cidades, retorno financeiro
- Resultados Reais: dados concretos, depoimentos, provas sociais

Responda SOMENTE com JSON valido, sem texto antes ou depois, sem backticks.
Formato exato:
{
  "resumo": "resumo executivo das principais descobertas em 3-4 frases",
  "insights": [
    {"editoria": "nome da editoria", "insight": "insight especifico para esta editoria baseado na pesquisa", "angulo": "angulo criativo para o post"}
  ]
}

Inclua apenas editorias que tenham insights relevantes para o que foi pesquisado (minimo 3, maximo 7).`;

  const userPrompt = `Tema pesquisado: ${query}

Resultados encontrados:
${searchContext}

Extraia insights e angulos de conteudo para as editorias da Seazone.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const clean = textBlock
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(clean);
    return NextResponse.json({ ...parsed, query, searchResults: searchResults.slice(0, 3) });
  } catch (err: any) {
    console.error('Erro Claude:', err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
