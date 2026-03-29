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
