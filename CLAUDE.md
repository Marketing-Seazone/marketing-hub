# Marketing Hub

## O que é
Central de artefatos e ferramentas do time de Marketing da Seazone.
Organizado por times: Criação, Product Marketing, Social Mídia, Growth e Marketing de Ativação.

- **Deploy:** Vercel (conta do Jorge)
- **GitHub:** Sampa-J/marketing-hub
- **Branch principal:** `main`

## Stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript 5, Tailwind 4, Lucide React
- **Inline styles** com tokens do objeto `T` em `src/lib/constants.ts`
- **Deploy:** Vercel (auto-deploy via merge em `main`)

## Workflow de contribuição
- Ninguém faz push direto em `main`
- Cada contribuição deve ser feita em uma branch separada (`feat/nome-do-artefato`)
- Abrir Pull Request apontando para `main`
- PR precisa de aprovação de um dos maintainers antes do merge
- Após merge, Vercel faz deploy automático

## Estrutura
```
src/
  app/
    page.tsx                    — Menu principal (cards por time)
    criacao/page.tsx
    product-marketing/page.tsx
    social-midia/page.tsx
    growth/page.tsx
    ativacao/page.tsx
  components/
    team-layout.tsx             — Layout base de cada time
  lib/
    constants.ts                — Tokens de design (T) + config dos times
```

## Design System
Usar o objeto `T` de `src/lib/constants.ts` para todas as cores, sombras e fontes.
Não usar classes Tailwind diretamente — preferir `style={{ ... }}` com os tokens do `T`.
Seguir o mesmo padrão visual do saleszone e ads-squad.

## Adicionando um artefato novo
1. Criar branch: `git checkout -b feat/nome-do-artefato`
2. Adicionar página em `src/app/{time}/nome-do-artefato/page.tsx`
3. Linkar na página do time (`src/app/{time}/page.tsx`)
4. Abrir PR → aguardar aprovação → merge

## Infraestrutura de dados (Nekt)

O hub tem uma rota de API pronta que conecta nas tabelas da Nekt (Pipedrive + Meta):

```
POST /api/query
Body: { "sql": "SELECT ..." }
Response: { "columns": [...], "rows": [...] }
```

**Quando criar um artefato com dados**, usar essa rota diretamente — sem precisar configurar credenciais.

### Tabelas disponíveis

| Tabela | Uso |
|--------|-----|
| `nekt_silver.ads_unificado` | Performance diária de anúncios Meta — spend, impressões, MQL, WON por anúncio (últimos ~90 dias) |
| `nekt_silver.ads_unificado_historico` | Igual ao anterior, sem limite de data — usar para análises de longo prazo |
| `nekt_silver.pipedrive_deals_readable` | **Fonte principal de WON/OPP/SQL** — atribuição correta via `rd_campanha` ({ad_id}_{campanha}), pipelines: 14=SZS, 28=SZI, 37=Marketplace |
| `nekt_silver.deals_pipedrive_join_marketing` | Deals Pipedrive com atribuição de campanha (legado, tem duplicatas) |
| `nekt_silver.funil_szi_pago_mql_sql_opp_won_lovable` | Funil pré-agregado Investimentos (SZI) por dia |
| `nekt_silver.funil_mktp_pago_mql_sql_opp_won_lovable` | Funil pré-agregado Marketplace por dia |
| `nekt_silver.funil_szs_pago_mql_sql_opp_won_lovable` | Funil pré-agregado Serviços (SZS) por dia |

### Atribuição correta de WON por anúncio

`ads_unificado` atribui WON pela data de criação do deal — erra quando o deal foi criado antes do anúncio existir. Para ranking correto de anúncios por WON, usar `pipedrive_deals_readable` + `ads_unificado_historico`:

```sql
WITH pipe AS (
  SELECT SPLIT_PART(rd_campanha, '_', 1) AS ad_id, COUNT(*) AS won
  FROM nekt_silver.pipedrive_deals_readable
  WHERE pipeline_id = 14 AND status = 'won'   -- 14=SZS, 28=SZI, 37=Marketplace
    AND rd_campanha IS NOT NULL AND rd_campanha != ''
  GROUP BY 1
),
meta AS (
  SELECT ad_id, MAX(ad_name) AS ad_name, MAX(campaign_name) AS campaign_name, SUM(spend) AS spend
  FROM nekt_silver.ads_unificado_historico
  WHERE vertical IN ('Serviços', 'Servicos', 'SZS')
  GROUP BY 1
)
SELECT m.ad_id, m.ad_name, m.campaign_name, p.won, m.spend,
       ROUND(m.spend / NULLIF(p.won, 0), 2) AS cac_won
FROM pipe p JOIN meta m ON m.ad_id = p.ad_id
ORDER BY p.won DESC LIMIT 50
```

### Padrão para buscar dados em um artefato

```typescript
const res = await fetch("/api/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sql: `SELECT campaign_name, SUM(spend) AS spend
    FROM nekt_silver.ads_unificado
    WHERE date >= CURRENT_DATE - INTERVAL '7' DAY
    GROUP BY 1 ORDER BY spend DESC` }),
})
const { columns, rows } = await res.json()
```

### Ao receber comando para criar artefato com dados

Quando o usuário disser "usa os dados da Nekt" ou "usa os dados do Marketing Hub":
- Consultar o dicionário acima para escolher a tabela e colunas corretas
- Usar `POST /api/query` para buscar os dados no client component
- Seguir o padrão visual com `T.` e `TeamLayout`
