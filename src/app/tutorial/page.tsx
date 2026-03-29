import Link from "next/link"
import { ChevronLeft, Download, GitBranch, FolderPlus, GitPullRequest, Rocket, Terminal, CheckCircle } from "lucide-react"
import { T } from "@/lib/constants"

function Step({ n, title, color, children }: { n: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 32 }}>
      {/* Number + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: color, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, flexShrink: 0,
        }}>{n}</div>
        <div style={{ width: 2, flex: 1, background: T.border, marginTop: 8 }} />
      </div>
      {/* Content */}
      <div style={{ paddingBottom: 8, flex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.cardFg, margin: "6px 0 12px" }}>{title}</p>
        {children}
      </div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <div style={{
      background: T.cinza800, color: "#e2e8f0",
      borderRadius: 10, padding: "14px 18px",
      fontFamily: "monospace", fontSize: 13, lineHeight: 1.7,
      margin: "10px 0", overflowX: "auto",
      whiteSpace: "pre",
    }}>
      {children}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: `${T.primary}10`, border: `1px solid ${T.primary}30`,
      borderRadius: 8, padding: "10px 14px",
      fontSize: 13, color: T.cinza700, margin: "10px 0", lineHeight: 1.6,
    }}>
      <strong style={{ color: T.primary }}>💡 Dica: </strong>{children}
    </div>
  )
}

function Tag({ children, color = T.primary }: { children: string; color?: string }) {
  return (
    <code style={{
      background: `${color}15`, color, border: `1px solid ${color}30`,
      borderRadius: 5, padding: "1px 7px", fontSize: 12, fontWeight: 600,
    }}>{children}</code>
  )
}

const STEP_COLORS = [T.primary, T.roxo600, T.teal600, T.laranja500, T.verde600, T.primary]

export default function TutorialPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.muted, fontFamily: T.font }}>

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40,
        boxShadow: T.elevSm,
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 4,
          color: T.mutedFg, fontSize: 12, textDecoration: "none", fontWeight: 500,
        }}>
          <ChevronLeft size={14} />
          Menu
        </Link>
        <span style={{ color: T.border }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.cardFg }}>Como adicionar um artefato</span>
      </header>

      <main style={{ padding: "40px 24px 64px", maxWidth: 760, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.mutedFg, margin: "0 0 8px" }}>
            Tutorial
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.cardFg, margin: "0 0 10px" }}>
            Adicionando um artefato ao Marketing Hub
          </h1>
          <p style={{ fontSize: 14, color: T.mutedFg, lineHeight: 1.7, margin: 0 }}>
            Esse guia mostra passo a passo como qualquer pessoa do time pode subir
            um artefato novo — por exemplo, um dashboard de orçamento no time de Growth —
            usando Git e Pull Request, sem precisar de permissão de administrador.
          </p>
        </div>

        {/* Pré-requisitos */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "20px 24px", marginBottom: 40,
          boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 14px" }}>
            Antes de começar — instale esses 3 programas
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Git", desc: "Controle de versão", url: "https://git-scm.com/downloads", color: T.laranja500 },
              { label: "Node.js (versão 20+)", desc: "Ambiente de execução", url: "https://nodejs.org", color: T.verde600 },
              { label: "VS Code", desc: "Editor de código recomendado", url: "https://code.visualstudio.com", color: T.primary },
            ].map(({ label, desc, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle size={16} color={color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.cardFg }}>{label}</span>
                <span style={{ fontSize: 12, color: T.mutedFg }}>— {desc}</span>
              </div>
            ))}
          </div>
          <Note>
            Para verificar se já tem, abra o terminal e rode <code style={{ fontFamily: "monospace" }}>git --version</code> e <code style={{ fontFamily: "monospace" }}>node --version</code>.
          </Note>
        </div>

        {/* Steps */}
        <div>

          <Step n={1} title="Clonar o repositório (só na primeira vez)" color={STEP_COLORS[0]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Abra o terminal, navegue até a pasta onde quer salvar o projeto e rode:
            </p>
            <Code>{`git clone https://github.com/Sampa-J/marketing-hub.git
cd marketing-hub
npm install`}</Code>
            <Note>
              Você só precisa clonar uma vez. Da próxima vez, só rode <Tag>git pull origin main</Tag> para pegar as atualizações.
            </Note>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "8px 0 0" }}>
              Para abrir no VS Code:
            </p>
            <Code>{`code .`}</Code>
          </Step>

          <Step n={2} title="Criar uma branch para o seu artefato" color={STEP_COLORS[1]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Nunca mexa direto no <Tag>main</Tag>. Crie uma branch com o nome do seu artefato:
            </p>
            <Code>{`git checkout main
git pull origin main
git checkout -b feat/growth-gestao-orcamento`}</Code>
            <Note>
              Use o formato <Tag>feat/time-nome-do-artefato</Tag>. Ex: <Tag>feat/social-calendario-editorial</Tag>, <Tag>feat/criacao-briefing-campanha</Tag>.
            </Note>
          </Step>

          <Step n={3} title="Criar a página do artefato" color={STEP_COLORS[2]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Crie uma nova pasta dentro do time correspondente. Exemplo para o time de Growth:
            </p>
            <Code>{`src/app/growth/gestao-orcamento/page.tsx`}</Code>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "12px 0 8px" }}>
              Conteúdo mínimo da página:
            </p>
            <Code>{`"use client"

import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function GestaOrcamentoPage() {
  return (
    <TeamLayout teamId="growth">
      <div style={{
        background: T.card,
        border: \`1px solid \${T.border}\`,
        borderRadius: 12,
        padding: "24px",
        boxShadow: T.elevSm,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.cardFg, margin: "0 0 8px" }}>
          Gestão de Orçamento
        </h2>
        <p style={{ fontSize: 13, color: T.mutedFg }}>
          Seu conteúdo aqui.
        </p>
      </div>
    </TeamLayout>
  )
}`}</Code>
            <Note>
              Troque <Tag>teamId="growth"</Tag> pelo id do seu time:{" "}
              <Tag>criacao</Tag>, <Tag>product-marketing</Tag>, <Tag>social-midia</Tag>, <Tag>growth</Tag> ou <Tag>ativacao</Tag>.
            </Note>
          </Step>

          <Step n={4} title="Linkar o artefato na página do time" color={STEP_COLORS[3]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Abra <Tag>src/app/growth/page.tsx</Tag> e adicione um link para o artefato novo.
              Se a página do time ainda for o placeholder padrão, substitua o conteúdo pelo seu artefato ou adicione uma lista de links.
            </p>
            <Code>{`import Link from "next/link"
import { TeamLayout } from "@/components/team-layout"
import { T } from "@/lib/constants"

export default function GrowthPage() {
  return (
    <TeamLayout teamId="growth">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <Link href="/growth/gestao-orcamento" style={{
          background: T.card,
          border: \`1px solid \${T.border}\`,
          borderRadius: 12, padding: "20px 24px",
          textDecoration: "none", display: "block",
          boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.cardFg, margin: "0 0 4px" }}>
            Gestão de Orçamento
          </p>
          <p style={{ fontSize: 12, color: T.mutedFg, margin: 0 }}>
            Controle de budget de mídia paga por empreendimento.
          </p>
        </Link>

      </div>
    </TeamLayout>
  )
}`}</Code>
          </Step>

          <Step n={5} title="Testar localmente antes de subir" color={STEP_COLORS[4]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Rode o servidor de desenvolvimento e acesse <Tag>http://localhost:3000</Tag>:
            </p>
            <Code>{`npm run dev`}</Code>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "8px 0 0" }}>
              Navegue até o time e confirme que o artefato aparece corretamente antes de abrir o PR.
            </p>
          </Step>

          <Step n={6} title="Abrir o Pull Request" color={STEP_COLORS[5]}>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "0 0 8px" }}>
              Salve as alterações, faça o commit e suba a branch:
            </p>
            <Code>{`git add .
git commit -m "feat(growth): adiciona página de gestão de orçamento"
git push origin feat/growth-gestao-orcamento`}</Code>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "12px 0 8px" }}>
              Depois, abra o GitHub em{" "}
              <strong style={{ color: T.cardFg }}>github.com/Sampa-J/marketing-hub</strong>{" "}
              — vai aparecer um banner amarelo com o botão <strong style={{ color: T.cardFg }}>"Compare & pull request"</strong>.
              Clique nele, descreva o que fez e clique em <strong style={{ color: T.cardFg }}>"Create pull request"</strong>.
            </p>
            <Note>
              O PR precisa de aprovação de um maintainer antes de ir pro ar. Avise no Slack quando abrir o PR para agilizar a revisão.
            </Note>
            <p style={{ fontSize: 13, color: T.mutedFg, lineHeight: 1.7, margin: "8px 0 0" }}>
              Após o merge, a Vercel faz o deploy automático em{" "}
              <strong style={{ color: T.cardFg }}>marketing-hub.vercel.app</strong> em ~1 minuto.
            </p>
          </Step>

        </div>

        {/* Footer recap */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "20px 24px", boxShadow: T.elevSm,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: T.mutedFg, margin: "0 0 14px" }}>
            Resumo dos comandos
          </p>
          <Code>{`# 1. Primeira vez
git clone https://github.com/Sampa-J/marketing-hub.git
cd marketing-hub && npm install

# 2. Antes de cada artefato novo
git checkout main && git pull origin main
git checkout -b feat/time-nome-do-artefato

# 3. Depois de criar/editar os arquivos
npm run dev   # testar local

# 4. Subir
git add .
git commit -m "feat(time): descrição do artefato"
git push origin feat/time-nome-do-artefato

# 5. Abrir PR no GitHub → aguardar aprovação → merge → deploy automático`}</Code>
        </div>

      </main>
    </div>
  )
}
