import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const SEAZONE_KNOWLEDGE = `
## BASE DE CONHECIMENTO — SEAZONE

**O que é a Seazone**
Empresa brasileira líder em aluguel por temporada (short stay), atuando de ponta a ponta: estruturação e lançamento de empreendimentos para investimento (Spots) e gestão operacional completa de imóveis no Airbnb e demais plataformas. Fundada há mais de 7 anos. Mais de 3.000 imóveis sob gestão. Mais de R$ 25 milhões em faturamento anual para proprietários. Mais de 80 mil diárias contabilizadas. Presença em mais de 15 estados.

**Produtos e linhas de negócio**

1. SEAZONE SERVIÇOS — Gestão Completa de Imóveis
Assume toda a operação: gestão de anúncios (Airbnb e outras plataformas), precificação inteligente com algoritmo proprietário, atendimento ao hóspede 24h, check-in e check-out presencial, limpeza e lavanderia, manutenções, plataforma do proprietário com dashboard em tempo real. O proprietário recebe renda passiva sem se preocupar com nada.

2. SPOTS — Empreendimentos para Investimento em Short Stay
Empreendimentos arquitetados desde o início para operar no Airbnb. Modelo SPE (Sociedade de Propósito Específico) a preço de custo. Rentabilidade projetada: 11% a 22% líquido ao ano. Valorização média de 70–80% até a entrega. Studios e apartamentos compactos (18m² a 63m²), áreas comuns de alto padrão (piscina de borda infinita, rooftop, bar). 47 Spots ativos em Florianópolis/SC (23), Bahia (7), Imbituba/SC (3), Bonito/MS (2), Urubici/SC (2), Curitiba/PR, Caraguatatuba/SP, Foz do Iguaçu/PR, Japaratinga/AL, Goiânia/GO, Fortaleza/CE, Natal/RN, Penha/SC.

Exemplos de Spots:
- Barra Spot (Floripa): rooftop com piscina de borda infinita, vista para o mar, ticket médio R$ 731.468, entrega jun/2028, projeção R$ 31.000/ano
- Campeche Spot (Floripa): 18m² a 63m², piscina de borda infinita, ticket médio R$ 542.450, projeção 15% líquido ao ano (R$ 45.000/ano)
- Barra Grande Spot (Maraú/BA): ticket médio R$ 293.742, projeção 22,29% ao ano (R$ 59.315/ano), valorização 77% até entrega
- Jurerê Spot (Floripa): studios 20–21m², piscina, vista lateral para o mar, ticket médio R$ 372.580, a 100m da praia
- Batel Spot (Curitiba): bairro mais nobre de Curitiba, ticket médio R$ 284.554
- Urubici Spot: Serra Catarinense, 51 unidades, ticket médio R$ 222.100
- Penha Spot: piscina de borda infinita, próximo ao Beto Carrero, ticket médio R$ 263.765

3. SEAZONE DECOR — Decoração Completa
Decoração end-to-end para imóveis de temporada. Inclui projeto de interiores, execução de obra, eletrodomésticos, enxoval completo. Prazo máximo 90 dias. Modelo a preço de custo — se ficar abaixo do estimado, devolve a diferença. Pacotes: Essential, Plus e Premium.

4. SEAZONE FRANQUIAS
Franquia de gestão de temporada. Sem royalties, sem taxa de marketing. Mais de R$ 25 milhões em faturamento anual. Operação em 13 estados. Treinamento completo incluído.

5. PROGRAMA DE PARCERIAS
Remuneração para corretores, assessores e influencers que indicam produtos Seazone. Até 5% na venda de Spots. 2% da receita ou R$ 500 em gestão de imóveis. O cliente sempre pertence ao parceiro — toda compra futura gera comissão.

**Diferenciais-chave para copy**
- Líder no Brasil em faturamento pelo Airbnb
- Renda passiva real: o proprietário não precisa fazer nada
- Algoritmo proprietário de precificação dinâmica
- Transparência total via plataforma do proprietário
- Mais de 7 anos de mercado, mais de 3.000 imóveis
- Modelo SPE a preço de custo: máxima segurança jurídica
- Rentabilidade de 11–22% ao ano (vs. renda fixa ~10% ao ano)
`;

const COPY_SYSTEM_PROMPT = `Você é um copywriter especialista em social media para a Seazone — empresa de gestão de aluguel por temporada e estruturação de empreendimentos para Airbnb.

REGRA ABSOLUTA: Escreva SOMENTE em português brasileiro. Nenhuma palavra em outro idioma.

${SEAZONE_KNOWLEDGE}

Você escreve copies de alta conversão para Instagram e TikTok que combinam autoridade, emoção e CTA claro.

Públicos principais e seus CTAs obrigatórios:
- INVESTIDORES: foco em rentabilidade, dados, oportunidade → CTA: "comente Oportunidade Seazone para saber mais"
- PROPRIETÁRIOS: gestão facilitada, aumento de receita, tranquilidade → CTA: "comente Gestão Seazone para saber mais"
- HÓSPEDES: experiência, destino, estilo de vida → CTA: "comente Quero me hospedar com a Seazone para saber mais"

REGRA DE CTA: Identifique o público-alvo do post pela editoria e sempre termine com o CTA correspondente. O CTA deve aparecer como última linha do post, destacado.

Como estruturar por formato:

REELS:
- Linha 1: Hook visual/verbal forte (primeiros 3 segundos)
- Cenas: descreva cada cena com o texto na tela ou o que o presenter fala
- CTA final claro

CARROSSEL:
- Slide 1: Gancho que para o scroll
- Slides do meio: conteúdo educativo ou narrativo, um ponto por slide
- Último slide: CTA

FEED / POST FIXO:
- Primeira linha: gancho (aparece antes do "ver mais")
- Corpo: desenvolvimento com emoção ou dados
- CTA no final
- Sugestão de hashtags

STORIES:
- Copy curta e direta para cada story
- Use perguntas, contagens regressivas, CTAs de deslizar

Use dados reais da base de conhecimento quando relevante (rentabilidade, número de imóveis, anos de mercado, etc).
Escreva a copy completa e estruturada, pronta para usar. Use emojis estrategicamente.
LEMBRE-SE: SOMENTE em português brasileiro, sem exceções.`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, editorial, formato, canal, tema, notas, customPrompt } = body;

  const userMessage = customPrompt?.trim()
    ? `${customPrompt}\n\nIMPORTANTE: Responda SOMENTE em português brasileiro.`
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
  let prompt = `Crie a copy completa e estruturada para o seguinte post da Seazone:\n\n`;
  prompt += `Título: ${title}\n`;
  prompt += `Editoria: ${editorial}\n`;
  prompt += `Formato: ${formato}\n`;
  prompt += `Canal: ${canal}\n`;
  if (tema) prompt += `Tema/Briefing: ${tema}\n`;
  if (notas) prompt += `Notas adicionais: ${notas}\n`;
  prompt += `\nUse dados reais da base de conhecimento da Seazone quando relevante.`;
  prompt += `\nEscreva a copy completa com toda a estrutura necessária para esse formato (cenas, slides, ganchos, CTA).`;
  prompt += `\nResposta SOMENTE em português brasileiro.`;
  return prompt;
}